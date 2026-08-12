import os
import pandas as pd
import joblib


# ============================================================
# PATH
# ============================================================

MODEL_PATH = "../models/soh/soh_model.joblib"


# ============================================================
# LOAD MODEL PACKAGE
# ============================================================

if not os.path.exists(MODEL_PATH):
    print("ERROR: SOH model not found.")
    print(f"Expected location: {MODEL_PATH}")
    raise SystemExit(1)

package = joblib.load(MODEL_PATH)

model = package["model"]
features = package["features"]


print("\n========================================")
print("          SOH PREDICTION")
print("========================================")


# ============================================================
# NEW BATTERY READING
# ============================================================

data = {
    "cycle_id": 250,

    "cell1_voltage_V": 3.55,
    "cell2_voltage_V": 3.54,
    "cell3_voltage_V": 3.53,

    "pack_voltage_V": 10.62,
    "voltage_avg_V": 3.54,

    "min_cell_voltage_V": 3.53,
    "max_cell_voltage_V": 3.55,

    "cell_voltage_imbalance_V": 0.02,

    "avg_c_rate": 0.8,
    "max_current_A": 2.5,

    "avg_temperature_C": 30.0,
    "max_temperature_C": 32.0,
    "ambient_temperature_C": 27.0,

    "gas_sensor_raw": 200.0,

    "discharge_depth_pct": 60.0,
    "high_current_burst": 0,

    "charge_time_min": 90.0,
    "discharge_time_min": 75.0,

    "internal_resistance_proxy_ohm": 0.045,
    "capacity_Ah": 2.8,

    "temperature_rise_C": 3.0,
    "power_avg_W": 25.0,

    "gas_change_index": 0.05,

    # One-hot encoded fields created during training
    "battery_id_BAT_001": 1,
    "battery_id_BAT_002": 0,
    "battery_id_BAT_003": 0,

    "usage_profile_light": 1,
    "usage_profile_normal": 0,
    "usage_profile_pulse": 0
}


# ============================================================
# CREATE INPUT DATAFRAME
# ============================================================

input_data = pd.DataFrame([data])


# Make sure every training feature exists
for feature in features:

    if feature not in input_data.columns:
        input_data[feature] = 0


# Exact feature order used during training
input_data = input_data[features]


# ============================================================
# PREDICT
# ============================================================

predicted_soh = model.predict(input_data)[0]


# Keep SOH between 0 and 100
predicted_soh = max(
    0.0,
    min(100.0, predicted_soh)
)


# ============================================================
# OUTPUT
# ============================================================

print("\nBattery Input:")

print(f"Cycle ID       : {data['cycle_id']}")

print(
    f"Pack Voltage   : "
    f"{data['pack_voltage_V']:.3f} V"
)

print(
    f"Average Voltage: "
    f"{data['voltage_avg_V']:.3f} V"
)

print(
    f"Temperature    : "
    f"{data['avg_temperature_C']:.2f} °C"
)

print(
    f"Capacity       : "
    f"{data['capacity_Ah']:.2f} Ah"
)

print(
    f"Resistance     : "
    f"{data['internal_resistance_proxy_ohm']:.4f} Ω"
)


print("\n----------------------------------------")

print(
    f"Predicted SOH  : "
    f"{predicted_soh:.2f}%"
)

print("========================================")