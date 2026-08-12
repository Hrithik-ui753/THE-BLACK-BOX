import os
import pandas as pd
import joblib


# ============================================================
# PATH
# ============================================================

MODEL_PATH = "../models/soc/soc_model.joblib"


# ============================================================
# FEATURES
# ============================================================

FEATURES = [
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


# ============================================================
# LOAD MODEL
# ============================================================

if not os.path.exists(MODEL_PATH):
    print("ERROR: SOC model not found.")
    print(f"Expected location: {MODEL_PATH}")
    raise SystemExit(1)

model = joblib.load(MODEL_PATH)

print("\n========================================")
print("          SOC PREDICTION")
print("========================================")


# ============================================================
# NEW BATTERY READING
# ============================================================

data = {
    "cell1_voltage_V": 3.65,
    "cell2_voltage_V": 3.64,
    "cell3_voltage_V": 3.63,

    "pack_voltage_V": 10.92,
    "voltage_avg_V": 3.64,

    "min_cell_voltage_V": 3.63,
    "max_cell_voltage_V": 3.65,

    "cell_voltage_imbalance_V": 0.02,

    "avg_temperature_C": 30.0,
    "max_temperature_C": 31.0,
    "ambient_temperature_C": 27.0,

    "gas_sensor_raw": 200.0,

    "temperature_rise_C": 3.0,
    "gas_change_index": 0.05
}


input_data = pd.DataFrame([data])

input_data = input_data[FEATURES]


# ============================================================
# PREDICT
# ============================================================

predicted_soc = model.predict(input_data)[0]


# Keep SOC between 0 and 100
predicted_soc = max(0.0, min(100.0, predicted_soc))


# ============================================================
# OUTPUT
# ============================================================

print("\nBattery Input:")
print(f"Cell 1 Voltage : {data['cell1_voltage_V']:.3f} V")
print(f"Cell 2 Voltage : {data['cell2_voltage_V']:.3f} V")
print(f"Cell 3 Voltage : {data['cell3_voltage_V']:.3f} V")
print(f"Pack Voltage   : {data['pack_voltage_V']:.3f} V")
print(f"Temperature    : {data['avg_temperature_C']:.2f} °C")

print("\n----------------------------------------")

print(f"Predicted SOC  : {predicted_soc:.2f}%")

print("========================================")