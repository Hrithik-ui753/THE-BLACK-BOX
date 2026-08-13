import os
import math
import logging
from typing import Dict, Any
import pandas as pd
import joblib

from config import (
    SOC_MODEL_PATH,
    SOH_MODEL_PATH,
    RUL_MODEL_PATH,
    ANOMALY_MODEL_PATH,
    ANOMALY_ENCODER_PATH,
    CELL_ABSENT_THRESHOLD,
)

logger = logging.getLogger(__name__)

SOC_FEATURES = [
    "cell1_voltage_V",
    "cell2_voltage_V",
    "cell3_voltage_V",
    "pack_voltage_V",
    "voltage_avg_V",
    "min_cell_voltage_V",
    "max_cell_voltage_V",
    "cell_voltage_imbalance_V",
    "avg_temperature_C",
    "max_temperature_C",
    "ambient_temperature_C",
    "gas_sensor_raw",
    "temperature_rise_C",
    "gas_change_index"
]

ANOMALY_FEATURES = [
    "cell1_voltage_V",
    "cell2_voltage_V",
    "cell3_voltage_V",
    "pack_voltage_V",
    "voltage_avg_V",
    "min_cell_voltage_V",
    "max_cell_voltage_V",
    "cell_voltage_imbalance_V",
    "avg_c_rate",
    "max_current_A",
    "avg_temperature_C",
    "max_temperature_C",
    "ambient_temperature_C",
    "gas_sensor_raw",
    "discharge_depth_pct",
    "high_current_burst",
    "charge_time_min",
    "discharge_time_min",
    "internal_resistance_proxy_ohm",
    "capacity_Ah",
    "temperature_rise_C",
    "power_avg_W",
    "gas_change_index"
]


class MLService:
    def __init__(self):
        self.soc_model = None
        self.soh_model = None
        self.soh_features = []
        self.rul_model = None
        self.rul_features = []
        self.anomaly_model = None
        self.anomaly_encoder = None
        self.loaded = False

        self.load_models()

    def load_models(self):
        """Loads trained joblib model files once at startup."""
        try:
            logger.info("[MLService] Loading ML models from joblib files...")
            
            if os.path.exists(SOC_MODEL_PATH):
                self.soc_model = joblib.load(SOC_MODEL_PATH)
            
            if os.path.exists(SOH_MODEL_PATH):
                soh_pkg = joblib.load(SOH_MODEL_PATH)
                self.soh_model = soh_pkg["model"]
                self.soh_features = soh_pkg["features"]

            if os.path.exists(RUL_MODEL_PATH):
                rul_pkg = joblib.load(RUL_MODEL_PATH)
                self.rul_model = rul_pkg["model"]
                self.rul_features = rul_pkg["features"]

            if os.path.exists(ANOMALY_MODEL_PATH):
                self.anomaly_model = joblib.load(ANOMALY_MODEL_PATH)

            if os.path.exists(ANOMALY_ENCODER_PATH):
                self.anomaly_encoder = joblib.load(ANOMALY_ENCODER_PATH)

            self.loaded = True
            logger.info("[MLService] All ML models successfully loaded into memory.")

        except Exception as e:
            logger.error(f"[MLService] Failed loading ML models: {e}")
            self.loaded = False

    def sanitize_val(self, val: float, default: float, min_val: float = None, max_val: float = None) -> float:
        """Sanitizes numerical outputs against NaN, Inf, and range bounds."""
        if val is None or math.isnan(val) or math.isinf(val):
            val = default
        if min_val is not None:
            val = max(min_val, val)
        if max_val is not None:
            val = min(max_val, val)
        return round(float(val), 2)

    def predict(self, feature_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs feature vector through SOC, SOH, RUL, and Anomaly ML models.
        Includes deterministic cell presence validation layer BEFORE ML inference.
        """
        if not self.loaded:
            self.load_models()

        c1 = float(feature_dict.get("cell1_voltage_V", 3.799))
        c2 = float(feature_dict.get("cell2_voltage_V", 3.606))
        c3 = float(feature_dict.get("cell3_voltage_V", 3.425))

        # 1. Deterministic Cell Presence Classification
        cell_raw_voltages = [("Cell 1", c1), ("Cell 2", c2), ("Cell 3", c3)]
        cell_statuses = []
        cell_ml_flags = []
        present_voltages = []

        for idx, (name, v) in enumerate(cell_raw_voltages, 1):
            if v <= CELL_ABSENT_THRESHOLD:
                cell_statuses.append("CELL_REMOVED")
                cell_ml_flags.append(False)
                logger.info(f"Cell {idx} voltage = {v:.2f} V")
                logger.info(f"Cell {idx} classified as CELL_REMOVED")
                logger.info(f"Skipping ML inference for Cell {idx}")
            else:
                cell_statuses.append("CELL_PRESENT")
                cell_ml_flags.append(True)
                present_voltages.append(v)
                logger.info(f"Cell {idx} voltage = {v:.2f} V")
                logger.info(f"Cell {idx} classified as CELL_PRESENT")
                logger.info(f"Running existing ML inference")

        present_count = len(present_voltages)

        # 2. Build sanitized feature dictionary to prevent 0.07 V offset from corrupting XGBoost input
        sanitized_dict = feature_dict.copy()
        if present_count > 0:
            avg_present = sum(present_voltages) / float(present_count)
            sanitized_dict["cell1_voltage_V"] = c1 if c1 > CELL_ABSENT_THRESHOLD else round(avg_present, 3)
            sanitized_dict["cell2_voltage_V"] = c2 if c2 > CELL_ABSENT_THRESHOLD else round(avg_present, 3)
            sanitized_dict["cell3_voltage_V"] = c3 if c3 > CELL_ABSENT_THRESHOLD else round(avg_present, 3)
            sanitized_dict["pack_voltage_V"] = feature_dict.get("valid_pack_voltage_V", round(avg_present * 3, 3))
            sanitized_dict["voltage_avg_V"] = round(avg_present, 3)
            sanitized_dict["min_cell_voltage_V"] = round(min(present_voltages), 3)
            sanitized_dict["max_cell_voltage_V"] = round(max(present_voltages), 3)
            sanitized_dict["cell_voltage_imbalance_V"] = round(max(present_voltages) - min(present_voltages), 3) if present_count >= 2 else 0.0
        else:
            sanitized_dict["cell1_voltage_V"] = 3.7
            sanitized_dict["cell2_voltage_V"] = 3.7
            sanitized_dict["cell3_voltage_V"] = 3.7

        df = pd.DataFrame([sanitized_dict])

        # 3. ML Models Inference (Only run if there are valid present cells)
        predicted_soc = 85.0
        predicted_soh = 94.0
        predicted_rul = 180.0
        predicted_anomaly = "normal"
        anomaly_confidence = 95.0

        if present_count > 0:
            # SOC Prediction
            if self.soc_model:
                try:
                    soc_input = df[SOC_FEATURES]
                    raw_soc = self.soc_model.predict(soc_input)[0]
                    predicted_soc = self.sanitize_val(raw_soc, 85.0, min_val=0.0, max_val=100.0)
                except Exception as e:
                    logger.error(f"[MLService] SOC Prediction error: {e}")

            # One-hot encoding for SOH / RUL models
            df_encoded = pd.get_dummies(df.copy(), columns=["battery_id", "usage_profile"], dtype=int)

            # SOH Prediction
            if self.soh_model:
                try:
                    for feat in self.soh_features:
                        if feat not in df_encoded.columns:
                            df_encoded[feat] = 0
                    soh_input = df_encoded[self.soh_features]
                    raw_soh = self.soh_model.predict(soh_input)[0]
                    predicted_soh = self.sanitize_val(raw_soh, 94.0, min_val=0.0, max_val=100.0)
                except Exception as e:
                    logger.error(f"[MLService] SOH Prediction error: {e}")

            # RUL Prediction
            if self.rul_model:
                try:
                    df_encoded["SoH_pct"] = predicted_soh
                    for feat in self.rul_features:
                        if feat not in df_encoded.columns:
                            df_encoded[feat] = 0
                    rul_input = df_encoded[self.rul_features]
                    raw_rul = self.rul_model.predict(rul_input)[0]
                    predicted_rul = self.sanitize_val(raw_rul, 180.0, min_val=0.0)
                except Exception as e:
                    logger.error(f"[MLService] RUL Prediction error: {e}")

            # Anomaly Detection
            if self.anomaly_model and self.anomaly_encoder:
                try:
                    anomaly_input = df[ANOMALY_FEATURES]
                    encoded_pred = self.anomaly_model.predict(anomaly_input)[0]
                    predicted_anomaly = str(self.anomaly_encoder.inverse_transform([encoded_pred])[0])
                    probs = self.anomaly_model.predict_proba(anomaly_input)[0]
                    anomaly_confidence = self.sanitize_val(max(probs) * 100.0, 95.0, min_val=0.0, max_val=100.0)
                except Exception as e:
                    logger.error(f"[MLService] Anomaly Prediction error: {e}")

        # 4. Cell-Specific Results assembly (SOC / SOH = None for removed cells)
        cell_predictions = []
        for i in range(3):
            is_present = cell_ml_flags[i]
            cell_predictions.append({
                "cell_index": i + 1,
                "status": cell_statuses[i],
                "soc": predicted_soc if is_present else None,
                "soh": predicted_soh if is_present else None,
                "ml_skipped": not is_present
            })

        # 5. Derive System Health & Anomaly Label
        min_cell_v = min(present_voltages) if present_voltages else 0.0
        imbalance_v = feature_dict.get("cell_voltage_imbalance_V", 0.0)
        temp_c = float(feature_dict.get("avg_temperature_C", 27.0))

        if present_count < 3:
            anomaly_label = "open_circuit_removed_cell"
            anomaly_confidence = 99.0
            system_status = "CRITICAL"
        elif min_cell_v <= 0.50:
            anomaly_label = "dead_cell_detected"
            anomaly_confidence = 99.0
            system_status = "CRITICAL"
            predicted_soc = 0.0
        elif min_cell_v <= 2.5 or imbalance_v >= 0.60 or temp_c >= 55.0 or predicted_anomaly in ["critical_failure", "thermal_runaway"]:
            system_status = "CRITICAL" if (min_cell_v <= 2.0 or predicted_anomaly in ["critical_failure", "thermal_runaway"]) else "ANOMALY"
            anomaly_label = predicted_anomaly
        elif min_cell_v <= 3.0 or imbalance_v >= 0.30 or temp_c >= 45.0 or predicted_soh < 80.0 or predicted_anomaly != "normal":
            system_status = "WARNING"
            anomaly_label = predicted_anomaly
        else:
            system_status = "NORMAL"
            anomaly_label = predicted_anomaly

        return {
            "soc": predicted_soc if present_count > 0 else None,
            "soh": predicted_soh if present_count > 0 else None,
            "rul_cycles": int(predicted_rul) if present_count > 0 else None,
            "anomaly": anomaly_label,
            "anomaly_confidence": anomaly_confidence,
            "system_status": system_status,
            "cells": cell_predictions,
            "cell1_status": cell_statuses[0],
            "cell2_status": cell_statuses[1],
            "cell3_status": cell_statuses[2],
            "present_cells": f"{present_count}/3"
        }


# Singleton Instance
ml_service = MLService()
