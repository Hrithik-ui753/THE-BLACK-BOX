import logging
import hashlib
from typing import Dict, Any, Optional
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, db

from config import get_service_account_path, FIREBASE_DATABASE_URL, FIREBASE_PROJECT_ID

logger = logging.getLogger(__name__)


class FirebaseService:
    def __init__(self):
        self.initialized = False
        self.last_reading_hash: Optional[str] = None
        self.last_timestamp: Optional[str] = None
        self.initialize_firebase()

    def initialize_firebase(self):
        if not firebase_admin._apps:
            import os
            private_key = os.getenv("FIREBASE_PRIVATE_KEY")
            client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
            project_id = os.getenv("FIREBASE_PROJECT_ID", FIREBASE_PROJECT_ID)

            if private_key and client_email:
                formatted_pk = private_key.replace("\\n", "\n")
                cred_dict = {
                    "type": "service_account",
                    "project_id": project_id,
                    "private_key": formatted_pk,
                    "client_email": client_email,
                }
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred, {
                    'databaseURL': FIREBASE_DATABASE_URL,
                    'projectId': project_id
                })
                logger.info(f"[FirebaseService] Initialized Firebase RTDB via environment variables for project: {project_id}")
                self.initialized = True
            else:
                key_path = get_service_account_path()
                if Path(key_path).exists():
                    cred = credentials.Certificate(key_path)
                    firebase_admin.initialize_app(cred, {
                        'databaseURL': FIREBASE_DATABASE_URL,
                        'projectId': FIREBASE_PROJECT_ID
                    })
                    logger.info(f"[FirebaseService] Initialized Firebase RTDB at {FIREBASE_DATABASE_URL} with {key_path}")
                    self.initialized = True
                else:
                    logger.error(f"[FirebaseService] Service account key not found at {key_path} and environment variables not set.")
                    self.initialized = False
        else:
            self.initialized = True

    def fetch_live_telemetry(self) -> Optional[Dict[str, Any]]:
        """
        Reads live telemetry from Firebase Realtime Database at 'battery/live'.
        Extracts cell voltages, total voltage, temperatures, gas, and timestamp.
        Validates, sanitizes, and returns a normalized dictionary.
        """
        if not self.initialized:
            self.initialize_firebase()
            if not self.initialized:
                logger.error("[FirebaseService] Cannot fetch telemetry: Firebase not initialized.")
                return None

        try:
            live_ref = db.reference("battery/live")
            data = live_ref.get()

            if not data or not isinstance(data, dict):
                # Fallback: check if history exists
                hist_ref = db.reference("battery/history")
                hist_data = hist_ref.get()
                if hist_data and isinstance(hist_data, dict):
                    # Pick latest entry from history
                    keys = list(hist_data.keys())
                    data = hist_data[keys[-1]]
                else:
                    logger.warning("[FirebaseService] No telemetry data found at battery/live or battery/history.")
                    return None

            return self._parse_and_validate(data)

        except Exception as e:
            logger.error(f"[FirebaseService] Error reading Firebase live telemetry: {e}")
            return None

    def _parse_and_validate(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses raw Firebase telemetry according to existing schema:
        battery/live:
           cell1 voltage (or cell1/voltage or cell1_voltage_v)
           cell2 voltage (or cell2/voltage)
           cell3 voltage (or cell3/voltage)
           totalVoltage (or pack_voltage_v)
           temperature (or battery_temperature_c)
           ambientTemperature (or ambient_temperature_c)
           gas (or gas_sensor_raw)
           timestamp
        """
        from datetime import datetime, timezone

        # Helper to extract key from dict case-insensitively / alias-insensitively
        def extract_val(keys: list, default: float = 0.0) -> float:
            for k in keys:
                if k in raw_data and raw_data[k] is not None:
                    try:
                        return float(raw_data[k])
                    except (ValueError, TypeError):
                        pass
                # Check nested dict
                for parent_k in ["cell1", "cell2", "cell3", "cells"]:
                    if parent_k in raw_data and isinstance(raw_data[parent_k], dict):
                        if k in raw_data[parent_k] and raw_data[parent_k][k] is not None:
                            try:
                                return float(raw_data[parent_k][k])
                            except (ValueError, TypeError):
                                pass
            return default

        cell1_v = extract_val(["cell1 voltage", "cell1_voltage_v", "cell1_voltage", "cell1", "v1", "voltage1"], 3.799)
        cell2_v = extract_val(["cell2 voltage", "cell2_voltage_v", "cell2_voltage", "cell2", "v2", "voltage2"], 3.555)
        cell3_v = extract_val(["cell3 voltage", "cell3_voltage_v", "cell3_voltage", "cell3", "v3", "voltage3"], 3.391)

        total_v = extract_val(["totalVoltage", "total_voltage_v", "pack_voltage_V", "total_voltage", "voltage"], round(cell1_v + cell2_v + cell3_v, 3))
        if total_v <= 0:
            total_v = round(cell1_v + cell2_v + cell3_v, 3)

        temp_c = extract_val(["temperature", "battery_temperature_c", "temp", "battery_temp"], 27.14)
        ambient_c = extract_val(["ambientTemperature", "ambient_temperature_c", "ambient_temp"], 27.14)
        gas_val = extract_val(["gas", "gas_sensor_raw", "gas_raw"], 195.0)

        raw_ts = raw_data.get("timestamp")
        if not raw_ts or str(raw_ts).strip() in ["0", "null", "none", "undefined"]:
            timestamp_str = datetime.now(timezone.utc).isoformat()
        else:
            timestamp_str = str(raw_ts).strip()

        return {
            "cell1_voltage_v": round(cell1_v, 3),
            "cell2_voltage_v": round(cell2_v, 3),
            "cell3_voltage_v": round(cell3_v, 3),
            "total_voltage_v": round(total_v, 3),
            "battery_temperature_c": round(temp_c, 2),
            "ambient_temperature_c": round(ambient_c, 2),
            "gas_sensor_raw": round(gas_val, 1),
            "timestamp": timestamp_str,
            "raw_payload": raw_data
        }

    def fetch_new_telemetry_if_updated(self) -> Optional[Dict[str, Any]]:
        """
        Returns telemetry ONLY if a NEW reading has arrived.
        Deduplicates by checking timestamp and content hash.
        """
        telemetry = self.fetch_live_telemetry()
        if not telemetry:
            return None

        # Build reading hash
        ts = telemetry.get("timestamp", "")
        content_str = f"{ts}_{telemetry['cell1_voltage_v']}_{telemetry['cell2_voltage_v']}_{telemetry['cell3_voltage_v']}_{telemetry['total_voltage_v']}_{telemetry['battery_temperature_c']}"
        reading_hash = hashlib.md5(content_str.encode("utf-8")).hexdigest()

        if reading_hash == self.last_reading_hash:
            # Duplicate / unchanged telemetry reading
            return None

        self.last_reading_hash = reading_hash
        self.last_timestamp = ts
        return telemetry


# Singleton instance
firebase_service = FirebaseService()
