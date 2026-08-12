import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List

from config import DEFAULT_BATTERY_ID
from supabase_service import supabase_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/batteries", tags=["Battery Profiles"])


@router.get("")
@router.get("/")
def list_batteries():
    """READ: Fetch all battery profiles from Supabase."""
    batteries = supabase_db.get_all_batteries()
    if not batteries:
        # Default profile fallback if table is empty
        batteries = [{
            "id": DEFAULT_BATTERY_ID,
            "battery_name": "BLACK BOX 3-Cell Module",
            "chemistry": "Li-Ion",
            "cell_count": 3,
            "configuration": "3S",
            "rated_capacity_ah": 2.8,
            "nominal_voltage": 11.1
        }]
    return {
        "status": "ok",
        "count": len(batteries),
        "batteries": batteries
    }


@router.get("/{battery_id}")
def get_battery_by_id(battery_id: str):
    """READ: Fetch single battery profile by ID."""
    battery = supabase_db.get_battery_by_id(battery_id)
    if not battery and battery_id == DEFAULT_BATTERY_ID:
        battery = {
            "id": DEFAULT_BATTERY_ID,
            "battery_name": "BLACK BOX 3-Cell Module",
            "chemistry": "Li-Ion",
            "cell_count": 3,
            "configuration": "3S",
            "rated_capacity_ah": 2.8,
            "nominal_voltage": 11.1
        }
    if not battery:
        raise HTTPException(status_code=404, detail=f"Battery ID '{battery_id}' not found.")

    return {
        "status": "ok",
        "battery": battery
    }
