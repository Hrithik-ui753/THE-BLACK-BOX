import logging
from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, Optional

from config import DEFAULT_BATTERY_ID
from services.firebase_service import firebase_service
from services.prediction_service import prediction_service
from supabase_service import supabase_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/telemetry", tags=["Live & Historical Telemetry"])


@router.get("/live")
def get_live_telemetry(battery_id: str = Query(DEFAULT_BATTERY_ID)):
    """
    Returns the latest live battery telemetry object containing:
    - sensors (cell voltages, total voltage, temp, ambient temp, gas)
    - derived (voltage imbalance, temp rise, estimated current, c-rate, power)
    - predictions (soc, soh, rul, anomaly, confidence)
    - status (NORMAL, WARNING, CRITICAL, ANOMALY)
    """
    # 1. Try polling Firebase & latest memory state
    live_state = prediction_service.poll_and_process_firebase(battery_id=battery_id)

    # 2. Check latest memory cache
    if not live_state:
        live_state = prediction_service.latest_live_state

    # 3. Read directly from Firebase
    if not live_state:
        raw_telemetry = firebase_service.fetch_live_telemetry()
        if raw_telemetry:
            live_state = prediction_service.process_telemetry(raw_telemetry, battery_id=battery_id)

    # 4. Read latest entry from Supabase sensor_history
    if not live_state and supabase_db.is_connected():
        try:
            history = supabase_db.get_sensor_history(battery_id, limit=1)
            if history and len(history) > 0:
                h = history[0]
                raw_telemetry = {
                    "cell1_voltage_v": float(h.get("cell1_voltage_v") or 3.799),
                    "cell2_voltage_v": float(h.get("cell2_voltage_v") or 3.555),
                    "cell3_voltage_v": float(h.get("cell3_voltage_v") or 3.391),
                    "total_voltage_v": float(h.get("total_voltage_v") or 10.745),
                    "battery_temperature_c": float(h.get("battery_temperature_c") or 27.14),
                    "ambient_temperature_c": float(h.get("ambient_temperature_c") or 27.14),
                    "gas_sensor_raw": float(h.get("gas_sensor_raw") or 195.0),
                    "timestamp": str(h.get("timestamp") or "")
                }
                live_state = prediction_service.process_telemetry(raw_telemetry, battery_id=battery_id)
        except Exception as e:
            logger.warning(f"Failed to fetch historical telemetry fallback: {e}")

    # 5. Last resilience fallback: process standard baseline payload
    if not live_state:
        default_raw = {
            "cell1_voltage_v": 3.799,
            "cell2_voltage_v": 3.555,
            "cell3_voltage_v": 3.391,
            "total_voltage_v": 10.745,
            "battery_temperature_c": 27.14,
            "ambient_temperature_c": 27.14,
            "gas_sensor_raw": 195.0,
            "timestamp": ""
        }
        live_state = prediction_service.process_telemetry(default_raw, battery_id=battery_id)

    return live_state


@router.get("/history")
def get_telemetry_history(battery_id: str = Query(DEFAULT_BATTERY_ID), limit: int = Query(50, ge=1, le=500)):
    """READ: Fetch historical telemetry readings from Supabase."""
    history = supabase_db.get_sensor_history(battery_id, limit=limit)
    return {
        "status": "ok",
        "battery_id": battery_id,
        "count": len(history),
        "history": history
    }


@router.post("/process")
def process_manual_telemetry(payload: Dict[str, Any], battery_id: str = Query(DEFAULT_BATTERY_ID)):
    """Processes a telemetry reading payload through feature engineering, ML, Supabase storage, and alerts."""
    processed = prediction_service.process_telemetry(payload, battery_id=battery_id)
    return {
        "status": "success",
        "processed_state": processed
    }
