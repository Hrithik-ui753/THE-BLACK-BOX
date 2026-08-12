import logging
from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any

from config import DEFAULT_BATTERY_ID
from services.prediction_service import prediction_service
from supabase_service import supabase_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/predictions", tags=["ML Predictions"])


@router.get("/latest/{battery_id}")
def get_latest_prediction(battery_id: str):
    """READ: Fetch latest ML prediction from live memory cache or Supabase."""
    live_state = prediction_service.latest_live_state
    if live_state and live_state.get("battery_id") == battery_id:
        return {
            "status": "ok",
            "battery_id": battery_id,
            "predictions": live_state.get("predictions"),
            "system_status": live_state.get("status")
        }

    history = supabase_db.get_predictions(battery_id, limit=1)
    if history:
        latest = history[0]
        return {
            "status": "ok",
            "battery_id": battery_id,
            "predictions": {
                "soc_percent": latest.get("soc_percent"),
                "soh_percent": latest.get("soh_percent"),
                "rul_cycles": latest.get("rul_days"),
                "anomaly": latest.get("status"),
                "anomaly_confidence": latest.get("anomaly_score")
            },
            "system_status": latest.get("status")
        }

    raise HTTPException(status_code=404, detail=f"No ML predictions found for battery '{battery_id}'.")


@router.get("/history/{battery_id}")
def get_prediction_history(battery_id: str, limit: int = Query(50, ge=1, le=200)):
    """READ: Fetch prediction history timeline from Supabase."""
    history = supabase_db.get_predictions(battery_id, limit=limit)
    return {
        "status": "ok",
        "battery_id": battery_id,
        "count": len(history),
        "predictions": history
    }
