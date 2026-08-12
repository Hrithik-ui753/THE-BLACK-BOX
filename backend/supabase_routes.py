import os
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from supabase_service import supabase_db

router = APIRouter(prefix="/api/db", tags=["Supabase Database CRUD"])


class BatteryCreatePayload(BaseModel):
    id: Optional[str] = None
    battery_name: str = "3 Individual Cells Module"
    chemistry: str = "Li-Ion"
    cell_count: int = 3
    configuration: str = "3S"
    rated_capacity_ah: float = 2.5


class BatteryUpdatePayload(BaseModel):
    battery_name: Optional[str] = None
    chemistry: Optional[str] = None
    cell_count: Optional[int] = None
    configuration: Optional[str] = None
    rated_capacity_ah: Optional[float] = None


class SensorHistoryPayload(BaseModel):
    battery_id: str = "164de9f0-62ee-411a-b8b9-a73eb2406f97"
    cell1_voltage_v: float = 4.12
    cell2_voltage_v: float = 3.65
    cell3_voltage_v: float = 4.10
    total_voltage_v: float = 12.30
    battery_temperature_c: float = 35.4
    ambient_temperature_c: Optional[float] = 30.1
    gas_sensor_raw: Optional[int] = 215


@router.get("/status")
def get_db_status():
    """Returns the Supabase connection status."""
    return {
        "status": "ok",
        "supabase_connected": supabase_db.is_connected(),
        "database_url": os.getenv("SUPABASE_URL", "Not set")
    }


# ============================================================
# 1. BATTERIES CRUD ENDPOINTS
# ============================================================
@router.get("/batteries")
def list_batteries():
    """READ: Fetch all battery records from Supabase."""
    data = supabase_db.get_all_batteries()
    return {"status": "ok", "count": len(data), "batteries": data}


@router.get("/batteries/{battery_id}")
def get_battery(battery_id: str):
    """READ: Fetch a specific battery by ID from Supabase."""
    item = supabase_db.get_battery_by_id(battery_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Battery '{battery_id}' not found in Supabase.")
    return {"status": "ok", "battery": item}


@router.post("/batteries")
def create_battery(payload: BatteryCreatePayload):
    """CREATE: Create a new battery in Supabase."""
    data = payload.dict(exclude_unset=True)
    created = supabase_db.create_battery(data)
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create battery record in Supabase.")
    return {"status": "created", "battery": created}


@router.put("/batteries/{battery_id}")
def update_battery(battery_id: str, payload: BatteryUpdatePayload):
    """UPDATE: Update battery details in Supabase."""
    updates = payload.dict(exclude_unset=True)
    updated = supabase_db.update_battery(battery_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Failed to update battery '{battery_id}'.")
    return {"status": "updated", "battery": updated}


@router.delete("/batteries/{battery_id}")
def delete_battery(battery_id: str):
    """DELETE: Remove a battery record from Supabase."""
    success = supabase_db.delete_battery(battery_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Failed to delete battery '{battery_id}'.")
    return {"status": "deleted", "battery_id": battery_id}


# ============================================================
# 2. SENSOR HISTORY & ALL-TABLE CASCADE INSERT
# ============================================================
@router.get("/sensor-history/{battery_id}")
def get_sensor_history(battery_id: str, limit: int = Query(50, ge=1, le=500)):
    """READ: Fetch telemetry history timeline for a battery from Supabase."""
    history = supabase_db.get_sensor_history(battery_id, limit=limit)
    return {"status": "ok", "battery_id": battery_id, "count": len(history), "history": history}


@router.post("/sensor-history")
def record_sensor_history(payload: SensorHistoryPayload):
    """CREATE: Insert telemetry and cascade to ALL 6 Supabase tables (sensor_history, derived_features, predictions, ai_analysis, alerts)."""
    res = supabase_db.record_full_telemetry(payload.dict())
    return res


# ============================================================
# 3. DERIVED FEATURES, PREDICTIONS, AI ANALYSIS & ALERTS ENDPOINTS
# ============================================================
@router.get("/derived-features/{battery_id}")
def get_derived_features(battery_id: str, limit: int = Query(50, ge=1, le=200)):
    """READ: Fetch derived features history from Supabase."""
    data = supabase_db.get_derived_features(battery_id, limit=limit)
    return {"status": "ok", "battery_id": battery_id, "count": len(data), "derived_features": data}


@router.get("/predictions/{battery_id}")
def get_predictions(battery_id: str, limit: int = Query(50, ge=1, le=200)):
    """READ: Fetch ML predictions history from Supabase."""
    data = supabase_db.get_predictions(battery_id, limit=limit)
    return {"status": "ok", "battery_id": battery_id, "count": len(data), "predictions": data}


@router.get("/ai-analysis/{battery_id}")
def get_ai_analysis(battery_id: str, limit: int = Query(50, ge=1, le=200)):
    """READ: Fetch AI analysis records from Supabase."""
    data = supabase_db.get_ai_analysis(battery_id, limit=limit)
    return {"status": "ok", "battery_id": battery_id, "count": len(data), "ai_analysis": data}


@router.get("/alerts")
def get_alerts(battery_id: Optional[str] = None, limit: int = Query(50, ge=1, le=200)):
    """READ: Fetch alerts history from Supabase."""
    alerts = supabase_db.get_alerts(battery_id=battery_id, limit=limit)
    return {"status": "ok", "count": len(alerts), "alerts": alerts}
