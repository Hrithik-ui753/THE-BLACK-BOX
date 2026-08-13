import logging
from typing import Dict, Any, Optional

from config import DEFAULT_BATTERY_ID
from services.firebase_service import firebase_service
from services.feature_service import feature_service
from services.ml_service import ml_service
from services.alert_service import alert_service
from supabase_service import supabase_db

logger = logging.getLogger(__name__)


class PredictionService:
    def __init__(self):
        self.latest_live_state: Optional[Dict[str, Any]] = None
        self.last_processed_timestamp: Optional[str] = None
        self.recover_last_processed_timestamp()

    def recover_last_processed_timestamp(self):
        """Restores the last processed timestamp from Supabase sensor_history for backend restart deduplication."""
        try:
            stored_ts = supabase_db.get_latest_processed_timestamp(DEFAULT_BATTERY_ID)
            if stored_ts:
                self.last_processed_timestamp = stored_ts
                logger.info(f"[PredictionService] Recovered last processed timestamp from Supabase: '{stored_ts}'")
        except Exception as e:
            logger.warning(f"[PredictionService] Failed to recover timestamp from Supabase: {e}")

    def is_valid_timestamp(self, ts: Any) -> bool:
        """Validates timestamp for null, empty, 0, or invalid states."""
        if ts is None:
            return False
        ts_str = str(ts).strip()
        if not ts_str or ts_str == "0" or ts_str.lower() in ["null", "none", "undefined"]:
            return False
        return True

    def process_telemetry(self, sensor_data: Dict[str, Any], battery_id: str = DEFAULT_BATTERY_ID) -> Dict[str, Any]:
        """
        Full orchestration pipeline for a NEW telemetry reading:
        1. Log [FIREBASE] NEW TIMESTAMP: <ts>
        2. Feature Engineering -> Log [FEATURES] Calculated
        3. ML Inference (SOC, SOH, RUL, Anomaly) -> Log ML predictions
        4. Supabase Storage (sensor_history, derived_features, predictions)
        5. Alert Evaluation & Gmail dispatch
        6. Commit last_processed_timestamp ONLY AFTER success.
        """
        raw_ts = str(sensor_data.get("timestamp", "")).strip()

        logger.info(f"[FIREBASE] NEW TIMESTAMP: {raw_ts}")

        # 1. Feature Engineering
        derived = feature_service.compute_features(sensor_data, battery_id=battery_id)
        logger.info("[FEATURES] Calculated")

        # 2. Run ML Models
        predictions = ml_service.predict(derived)
        logger.info(f"[ML] SOC predicted: {predictions['soc']}%")
        logger.info(f"[ML] SOH predicted: {predictions['soh']}%")
        logger.info(f"[ML] RUL predicted: {predictions['rul_cycles']} cycles")
        logger.info(f"[ML] Anomaly predicted: {predictions['anomaly']}")

        # 3. Assemble Unified Live Response Object
        live_state = {
            "battery_id": battery_id,
            "timestamp": raw_ts,
            "cell1_status": predictions.get("cell1_status", derived.get("cell1_status", "CELL_PRESENT")),
            "cell2_status": predictions.get("cell2_status", derived.get("cell2_status", "CELL_PRESENT")),
            "cell3_status": predictions.get("cell3_status", derived.get("cell3_status", "CELL_PRESENT")),
            "present_cells": predictions.get("present_cells", derived.get("present_cells", "3/3")),
            "pack_presence_status": derived.get("pack_presence_status", "ALL_PRESENT"),
            "sensors": {
                "cell1_voltage_v": sensor_data["cell1_voltage_v"],
                "cell2_voltage_v": sensor_data["cell2_voltage_v"],
                "cell3_voltage_v": sensor_data["cell3_voltage_v"],
                "total_voltage_v": sensor_data["total_voltage_v"],
                "battery_temperature_c": sensor_data["battery_temperature_c"],
                "ambient_temperature_c": sensor_data["ambient_temperature_c"],
                "gas_sensor_raw": sensor_data["gas_sensor_raw"],
            },
            "cells": predictions.get("cells", [
                {"index": 1, "voltage": sensor_data["cell1_voltage_v"], "status": derived.get("cell1_status", "CELL_PRESENT"), "soc": predictions["soc"], "soh": predictions["soh"], "ml_skipped": False},
                {"index": 2, "voltage": sensor_data["cell2_voltage_v"], "status": derived.get("cell2_status", "CELL_PRESENT"), "soc": predictions["soc"], "soh": predictions["soh"], "ml_skipped": False},
                {"index": 3, "voltage": sensor_data["cell3_voltage_v"], "status": derived.get("cell3_status", "CELL_PRESENT"), "soc": predictions["soc"], "soh": predictions["soh"], "ml_skipped": False},
            ]),
            "derived": {
                "min_cell_voltage_v": derived["min_cell_voltage_V"],
                "max_cell_voltage_v": derived["max_cell_voltage_V"],
                "voltage_imbalance_v": derived["cell_voltage_imbalance_V"],
                "temperature_rise_c": derived["temperature_rise_C"],
                "measured_current_a": derived["measured_current_A"],
                "estimated_current_a": derived["estimated_current_A"],
                "avg_c_rate": derived["avg_c_rate"],
                "power_avg_w": derived["power_avg_W"],
                "gas_change_index": derived["gas_change_index"]
            },
            "predictions": {
                "soc_percent": predictions["soc"],
                "soh_percent": predictions["soh"],
                "rul_cycles": predictions["rul_cycles"],
                "rul_available": predictions.get("rul_available", True),
                "anomaly": predictions["anomaly"],
                "anomaly_source": predictions.get("anomaly_source", "ML_PREDICTED"),
                "anomaly_confidence": predictions["anomaly_confidence"],
            },
            "model_metadata": predictions.get("model_metadata"),
            "status": predictions["system_status"]
        }

        # 4. Store in Supabase
        if supabase_db.is_connected() and self.is_valid_timestamp(raw_ts) and raw_ts != self.last_processed_timestamp:
            try:
                # sensor_history
                sh_data = {
                    "battery_id": battery_id,
                    "timestamp": raw_ts,
                    "cell1_voltage_v": sensor_data["cell1_voltage_v"],
                    "cell2_voltage_v": sensor_data["cell2_voltage_v"],
                    "cell3_voltage_v": sensor_data["cell3_voltage_v"],
                    "total_voltage_v": sensor_data["total_voltage_v"],
                    "battery_temperature_c": sensor_data["battery_temperature_c"],
                    "ambient_temperature_c": sensor_data["ambient_temperature_c"],
                    "gas_sensor_raw": sensor_data["gas_sensor_raw"],
                }
                supabase_db.client.table("sensor_history").insert(sh_data).execute()
                logger.info("[SUPABASE] sensor_history inserted")

                # derived_features
                df_data = {
                    "battery_id": battery_id,
                    "timestamp": raw_ts,
                    "pack_voltage_v": derived["pack_voltage_V"],
                    "average_voltage_v": derived["voltage_avg_V"],
                    "min_voltage_v": derived["min_cell_voltage_V"],
                    "max_voltage_v": derived["max_cell_voltage_V"],
                    "voltage_imbalance_v": derived["cell_voltage_imbalance_V"],
                    "temperature_rise_c": derived["temperature_rise_C"],
                    "estimated_current_a": derived["estimated_current_A"],
                    "c_rate": derived["avg_c_rate"],
                    "power_w": derived["power_avg_W"],
                }
                supabase_db.client.table("derived_features").insert(df_data).execute()
                logger.info("[SUPABASE] derived_features inserted")

                # predictions
                pred_data = {
                    "battery_id": battery_id,
                    "timestamp": raw_ts,
                    "soc_percent": predictions["soc"],
                    "soh_percent": predictions["soh"],
                    "rul_days": predictions["rul_cycles"],
                    "anomaly_score": int(predictions["anomaly_confidence"]),
                    "status": predictions["system_status"],
                }
                supabase_db.client.table("predictions").insert(pred_data).execute()
                logger.info("[SUPABASE] predictions inserted")

            except Exception as e:
                logger.error(f"[TELEMETRY ERROR] Timestamp {raw_ts} Supabase insertion failed: {e}")
                logger.info(f"[TELEMETRY] Will retry timestamp {raw_ts}")
                raise e

        # 5. Evaluate Alert Engine & Gmail Notification
        try:
            alert_service.evaluate_and_notify(
                battery_id=battery_id,
                sensor_data=sensor_data,
                derived_features=derived,
                predictions=predictions
            )
            logger.info("[ALERT] Evaluated")
        except Exception as e:
            logger.error(f"[ALERT ERROR] Alert evaluation error: {e}")

        # 6. Commit last_processed_timestamp ONLY AFTER success
        self.last_processed_timestamp = raw_ts
        self.latest_live_state = live_state
        logger.info(f"[TELEMETRY] Timestamp {raw_ts} processed successfully")

        return live_state

    def poll_and_process_firebase(self, battery_id: str = DEFAULT_BATTERY_ID) -> Optional[Dict[str, Any]]:
        """
        Continuously polls Firebase for telemetry.
        Extracts timestamp, validates it, and processes live state.
        Ensures latest_live_state is always populated with live Firebase data.
        """
        telemetry = firebase_service.fetch_live_telemetry()
        if not telemetry:
            return self.latest_live_state

        raw_ts = str(telemetry.get("timestamp", "")).strip()

        # 1. Timestamp Validation
        if not self.is_valid_timestamp(raw_ts):
            logger.error(f"[TELEMETRY ERROR] Invalid or missing timestamp: '{raw_ts}' - skipping")
            return self.latest_live_state

        # 2. If memory cache is populated and timestamp is unchanged, return cached state
        if self.latest_live_state is not None and raw_ts == self.last_processed_timestamp:
            return self.latest_live_state

        # 3. Process Telemetry (calculates ML predictions & populates latest_live_state)
        try:
            return self.process_telemetry(telemetry, battery_id=battery_id)
        except Exception as e:
            logger.error(f"[TELEMETRY ERROR] Timestamp {raw_ts} failed processing: {e}")
            return self.latest_live_state


# Singleton Instance
prediction_service = PredictionService()
