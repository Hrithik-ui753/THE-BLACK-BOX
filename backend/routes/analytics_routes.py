import logging
from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, List

from config import DEFAULT_BATTERY_ID
from supabase_service import supabase_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["Battery Analytics"])


@router.get("/{battery_id}")
def get_battery_analytics(battery_id: str):
    """
    Computes real analytics from stored historical telemetry in Supabase:
    - avg/min/max cell voltages & max imbalance
    - avg/max temperature & temperature rise
    - average gas sensor value
    - anomaly & alert count
    - trends for SOC, SOH, RUL, and voltage degradation
    """
    sensors = supabase_db.get_sensor_history(battery_id, limit=200)
    predictions = supabase_db.get_predictions(battery_id, limit=200)
    alerts = supabase_db.get_alerts(battery_id, limit=200)

    if not sensors or len(sensors) < 1:
        return {
            "status": "insufficient_data",
            "message": "Insufficient historical data"
        }

    # Sensor aggregations
    c1_list = [s.get("cell1_voltage_v", 0.0) for s in sensors if s.get("cell1_voltage_v") is not None]
    c2_list = [s.get("cell2_voltage_v", 0.0) for s in sensors if s.get("cell2_voltage_v") is not None]
    c3_list = [s.get("cell3_voltage_v", 0.0) for s in sensors if s.get("cell3_voltage_v") is not None]
    total_list = [s.get("total_voltage_v", 0.0) for s in sensors if s.get("total_voltage_v") is not None]
    temp_list = [s.get("battery_temperature_c", 0.0) for s in sensors if s.get("battery_temperature_c") is not None]
    amb_list = [s.get("ambient_temperature_c", 0.0) for s in sensors if s.get("ambient_temperature_c") is not None]
    gas_list = [s.get("gas_sensor_raw", 0.0) for s in sensors if s.get("gas_sensor_raw") is not None]

    all_cell_voltages = c1_list + c2_list + c3_list

    avg_cell_v = round(sum(all_cell_voltages) / len(all_cell_voltages), 3) if all_cell_voltages else 0.0
    min_cell_v = round(min(all_cell_voltages), 3) if all_cell_voltages else 0.0
    max_cell_v = round(max(all_cell_voltages), 3) if all_cell_voltages else 0.0

    max_imbalance = 0.0
    for s in sensors:
        c1 = s.get("cell1_voltage_v", 0.0)
        c2 = s.get("cell2_voltage_v", 0.0)
        c3 = s.get("cell3_voltage_v", 0.0)
        imb = max(c1, c2, c3) - min(c1, c2, c3)
        if imb > max_imbalance:
            max_imbalance = imb

    avg_temp = round(sum(temp_list) / len(temp_list), 2) if temp_list else 0.0
    max_temp = round(max(temp_list), 2) if temp_list else 0.0
    avg_ambient = round(sum(amb_list) / len(amb_list), 2) if amb_list else 0.0
    temp_rise = round(max(0.0, max_temp - avg_ambient), 2)

    avg_gas = round(sum(gas_list) / len(gas_list), 1) if gas_list else 0.0

    anomaly_count = sum(1 for p in predictions if p.get("status") not in ["NORMAL", "HEALTHY", "normal"])
    alert_count = len(alerts)

    # Trends
    soc_trend = [p.get("soc_percent") for p in reversed(predictions) if p.get("soc_percent") is not None]
    soh_trend = [p.get("soh_percent") for p in reversed(predictions) if p.get("soh_percent") is not None]
    rul_trend = [p.get("rul_days") for p in reversed(predictions) if p.get("rul_days") is not None]
    voltage_degradation = [s.get("total_voltage_v") for s in reversed(sensors) if s.get("total_voltage_v") is not None]

    return {
        "status": "ok",
        "battery_id": battery_id,
        "sample_count": len(sensors),
        "analytics": {
            "average_cell_voltage_v": avg_cell_v,
            "minimum_cell_voltage_v": min_cell_v,
            "maximum_cell_voltage_v": max_cell_v,
            "maximum_cell_imbalance_v": round(max_imbalance, 3),
            "average_temperature_c": avg_temp,
            "maximum_temperature_c": max_temp,
            "temperature_rise_c": temp_rise,
            "average_gas_sensor_raw": avg_gas,
            "anomaly_count": anomaly_count,
            "alert_count": alert_count,
            "soc_trend": soc_trend,
            "soh_trend": soh_trend,
            "rul_trend": rul_trend,
            "voltage_degradation_trend": voltage_degradation
        }
    }
