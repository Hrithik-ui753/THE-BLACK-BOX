import os
import pandas as pd
import joblib


# ============================================================
# PATHS
# ============================================================

MODEL_PATH = "../models/anomaly/anomaly_model.joblib"
ENCODER_PATH = "../models/anomaly/anomaly_label_encoder.joblib"


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

    "avg_c_rate",
    "max_current_A",

    "avg_temperature_C",
    "max_temperature_C",
    "ambient_temperature_C",

    "gas_sensor_raw",

    "discharge_depth_pct",
    "high_current_burst",

    "charge_time_min",
    "discharge_time_min",

    "internal_resistance_proxy_ohm",

    "capacity_Ah",

    "temperature_rise_C",

    "power_avg_W",

    "gas_change_index"
]


# ============================================================
# CHECK FILES
# ============================================================

if not os.path.exists(MODEL_PATH):
    print("ERROR: Anomaly model not found.")
    print(f"Expected: {MODEL_PATH}")
    raise SystemExit(1)

if not os.path.exists(ENCODER_PATH):
    print("ERROR: Label encoder not found.")
    print(f"Expected: {ENCODER_PATH}")
    raise SystemExit(1)


# ============================================================
# LOAD MODEL
# ============================================================

model = joblib.load(MODEL_PATH)
label_encoder = joblib.load(ENCODER_PATH)


print("\n========================================")
print("       ANOMALY PREDICTION")
print("========================================")


# ============================================================
# NEW BATTERY READING
# ============================================================

data = {
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

    "gas_change_index": 0.05
}


# ============================================================
# CREATE INPUT DATAFRAME
# ============================================================

input_data = pd.DataFrame([data])

input_data = input_data[FEATURES]


# ============================================================
# PREDICT
# ============================================================

prediction_encoded = model.predict(input_data)[0]

prediction_label = label_encoder.inverse_transform(
    [prediction_encoded]
)[0]


# ============================================================
# PREDICTION PROBABILITIES
# ============================================================

probabilities = model.predict_proba(input_data)[0]

class_probabilities = {}

for encoded_class, probability in zip(
    model.classes_,
    probabilities
):

    label = label_encoder.inverse_transform(
        [encoded_class]
    )[0]

    class_probabilities[label] = probability


confidence = max(probabilities) * 100


# ============================================================
# OUTPUT
# ============================================================

print("\nBattery Input:")

print(
    f"Cell 1 Voltage : "
    f"{data['cell1_voltage_V']:.3f} V"
)

print(
    f"Cell 2 Voltage : "
    f"{data['cell2_voltage_V']:.3f} V"
)

print(
    f"Cell 3 Voltage : "
    f"{data['cell3_voltage_V']:.3f} V"
)

print(
    f"Pack Voltage   : "
    f"{data['pack_voltage_V']:.3f} V"
)

print(
    f"Temperature    : "
    f"{data['avg_temperature_C']:.2f} °C"
)

print(
    f"Gas Sensor     : "
    f"{data['gas_sensor_raw']:.2f}"
)


print("\n----------------------------------------")

print(
    f"Predicted Anomaly : "
    f"{prediction_label}"
)

print(
    f"Confidence        : "
    f"{confidence:.2f}%"
)


# ============================================================
# ALL CLASS PROBABILITIES
# ============================================================

print("\nClass Probabilities:")

sorted_probabilities = sorted(
    class_probabilities.items(),
    key=lambda x: x[1],
    reverse=True
)

for label, probability in sorted_probabilities:

    print(
        f"{label:25s} "
        f"{probability * 100:6.2f}%"
    )


# ============================================================
# STATUS
# ============================================================

if prediction_label == "normal":

    status = "BATTERY NORMAL"

else:

    status = "ANOMALY DETECTED"


print("\n----------------------------------------")

print(
    f"System Status: {status}"
)

print("========================================")