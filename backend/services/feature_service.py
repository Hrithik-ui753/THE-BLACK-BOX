import logging
from typing import Dict, Any

from config import DEFAULT_BATTERY_ID

logger = logging.getLogger(__name__)


def estimate_current(pack_voltage: float) -> float:
    """
    Estimates battery current based on pack voltage levels.
    Explicitly labeled as ESTIMATED (no physical current sensor in telemetry).
    """
    if pack_voltage >= 11.6:
        return 0.4
    elif pack_voltage >= 7.32:
        return 0.3
    elif pack_voltage >= 4.6:
        return 0.2
    else:
        return 0.1


class FeatureService:
    def compute_features(self, sensor_data: Dict[str, Any], battery_id: str = DEFAULT_BATTERY_ID) -> Dict[str, Any]:
        """
        Takes raw validated sensor readings and calculates all derived features
        required by the SOC, SOH, RUL, and Anomaly ML models.
        """
        c1 = float(sensor_data.get("cell1_voltage_v", 3.799))
        c2 = float(sensor_data.get("cell2_voltage_v", 3.606))
        c3 = float(sensor_data.get("cell3_voltage_v", 3.425))

        pack_v = float(sensor_data.get("total_voltage_v", round(c1 + c2 + c3, 3)))
        temp_c = float(sensor_data.get("battery_temperature_c", 27.14))
        ambient_c = float(sensor_data.get("ambient_temperature_c", 27.14))
        gas_raw = float(sensor_data.get("gas_sensor_raw", 195.0))

        # Basic Derived Cell Features
        min_v = round(min(c1, c2, c3), 3)
        max_v = round(max(c1, c2, c3), 3)
        avg_v = round(pack_v / 3.0, 3)
        imbalance_v = round(max_v - min_v, 3)
        temp_rise = round(max(0.0, temp_c - ambient_c), 2)

        # Estimated Current (Measured current is null because hardware lacks current sensor)
        measured_current_a = None
        estimated_current_a = estimate_current(pack_v)

        capacity_ah = 2.8
        avg_c_rate = round(estimated_current_a / capacity_ah, 4)
        power_avg_w = round(pack_v * estimated_current_a, 3)

        high_current_burst = 1 if estimated_current_a >= 0.4 else 0
        discharge_depth_pct = 60.0
        charge_time_min = 90.0
        discharge_time_min = 75.0
        internal_resistance = 0.045
        gas_change_index = 0.05

        features = {
            "battery_id": battery_id,
            "cycle_id": 250,
            "usage_profile": "light",

            # Cell & Pack Voltages
            "cell1_voltage_V": c1,
            "cell2_voltage_V": c2,
            "cell3_voltage_V": c3,
            "pack_voltage_V": pack_v,
            "voltage_avg_V": avg_v,
            "min_cell_voltage_V": min_v,
            "max_cell_voltage_V": max_v,
            "cell_voltage_imbalance_V": imbalance_v,

            # Temperatures
            "avg_temperature_C": temp_c,
            "max_temperature_C": temp_c,
            "ambient_temperature_C": ambient_c,
            "temperature_rise_C": temp_rise,

            # Gas
            "gas_sensor_raw": gas_raw,
            "gas_change_index": gas_change_index,

            # Current & Power (Estimated vs Measured)
            "measured_current_A": measured_current_a,
            "estimated_current_A": estimated_current_a,
            "avg_c_rate": avg_c_rate,
            "max_current_A": estimated_current_a,
            "power_avg_W": power_avg_w,

            # Additional Model Features
            "discharge_depth_pct": discharge_depth_pct,
            "high_current_burst": high_current_burst,
            "charge_time_min": charge_time_min,
            "discharge_time_min": discharge_time_min,
            "internal_resistance_proxy_ohm": internal_resistance,
            "capacity_Ah": capacity_ah,
        }

        return features


# Singleton Instance
feature_service = FeatureService()
