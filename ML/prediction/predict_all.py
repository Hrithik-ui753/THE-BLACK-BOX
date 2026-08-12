import os
import pandas as pd
import joblib


# ============================================================
# MODEL PATHS
# ============================================================

SOC_MODEL_PATH = "../models/soc/soc_model.joblib"
SOH_MODEL_PATH = "../models/soh/soh_model.joblib"
RUL_MODEL_PATH = "../models/rul/rul_model.joblib"

ANOMALY_MODEL_PATH = "../models/anomaly/anomaly_model.joblib"
ANOMALY_ENCODER_PATH = "../models/anomaly/anomaly_label_encoder.joblib"


# ============================================================
# LOAD MODELS
# ============================================================

print("\nLoading THE BLACK BOX models...")

soc_model = joblib.load(SOC_MODEL_PATH)

soh_package = joblib.load(SOH_MODEL_PATH)
soh_model = soh_package["model"]
soh_features = soh_package["features"]

rul_package = joblib.load(RUL_MODEL_PATH)
rul_model = rul_package["model"]
rul_features = rul_package["features"]

anomaly_model = joblib.load(ANOMALY_MODEL_PATH)
anomaly_encoder = joblib.load(ANOMALY_ENCODER_PATH)


print("All models loaded successfully.")


# ============================================================
# SOC FEATURES
# ============================================================

SOC_FEATURES = [
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
# ANOMALY FEATURES
# ============================================================

ANOMALY_FEATURES = [
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
# BATTERY INPUT
# ============================================================
#
# Replace these values later with real Firebase / Arduino data.
#

data = {
    "battery_id": "BAT_001",
    "cycle_id": 250,
    "usage_profile": "light",

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

    # Used by RUL model
    "SoH_pct": 85.0
}


# ============================================================
# CREATE DATAFRAME
# ============================================================

df = pd.DataFrame([data])


# ============================================================
# SOC PREDICTION
# ============================================================

soc_input = df[SOC_FEATURES]

predicted_soc = soc_model.predict(
    soc_input
)[0]

predicted_soc = max(
    0.0,
    min(100.0, predicted_soc)
)


# ============================================================
# SOH / RUL FEATURE PREPARATION
# ============================================================

# The SOH and RUL models were trained with:
#
# battery_id
# usage_profile
#
# converted into one-hot encoded columns.
#
# Reproduce that encoding here.

df_encoded = pd.get_dummies(
    df.copy(),
    columns=[
        "battery_id",
        "usage_profile"
    ],
    dtype=int
)


# Make sure every feature expected by the model exists.

for feature in soh_features:

    if feature not in df_encoded.columns:

        df_encoded[feature] = 0


for feature in rul_features:

    if feature not in df_encoded.columns:

        df_encoded[feature] = 0


# ============================================================
# SOH PREDICTION
# ============================================================

soh_input = df_encoded[soh_features]

predicted_soh = soh_model.predict(
    soh_input
)[0]

predicted_soh = max(
    0.0,
    min(100.0, predicted_soh)
)


# ============================================================
# RUL PREDICTION
# ============================================================

rul_input = df_encoded[rul_features]

predicted_rul = rul_model.predict(
    rul_input
)[0]

predicted_rul = max(
    0.0,
    predicted_rul
)


# ============================================================
# ANOMALY PREDICTION
# ============================================================

anomaly_input = df[ANOMALY_FEATURES]

encoded_prediction = anomaly_model.predict(
    anomaly_input
)[0]


predicted_anomaly = anomaly_encoder.inverse_transform(
    [encoded_prediction]
)[0]


# ============================================================
# ANOMALY CONFIDENCE
# ============================================================

probabilities = anomaly_model.predict_proba(
    anomaly_input
)[0]

confidence = max(probabilities) * 100


# ============================================================
# SYSTEM STATUS
# ============================================================

if predicted_anomaly == "normal":

    system_status = "NORMAL"

else:

    system_status = "ANOMALY DETECTED"


# ============================================================
# RUL STATUS
# ============================================================

if predicted_rul <= 0:

    rul_status = "END OF LIFE"

elif predicted_rul <= 20:

    rul_status = "CRITICAL"

elif predicted_rul <= 50:

    rul_status = "LOW RUL"

elif predicted_rul <= 100:

    rul_status = "MODERATE"

else:

    rul_status = "HEALTHY"


# ============================================================
# SOH STATUS
# ============================================================

if predicted_soh >= 90:

    soh_status = "HEALTHY"

elif predicted_soh >= 80:

    soh_status = "GOOD"

elif predicted_soh >= 70:

    soh_status = "DEGRADED"

else:

    soh_status = "CRITICAL"


# ============================================================
# DISPLAY INPUT
# ============================================================

print("\n")
print("============================================================")
print("                 THE BLACK BOX")
print("              BATTERY AI ANALYSIS")
print("============================================================")

print("\nBATTERY INPUT")
print("------------------------------------------------------------")

print(
    f"Battery ID              : "
    f"{data['battery_id']}"
)

print(
    f"Cycle ID                : "
    f"{data['cycle_id']}"
)

print(
    f"Usage Profile           : "
    f"{data['usage_profile']}"
)

print(
    f"Cell 1 Voltage          : "
    f"{data['cell1_voltage_V']:.3f} V"
)

print(
    f"Cell 2 Voltage          : "
    f"{data['cell2_voltage_V']:.3f} V"
)

print(
    f"Cell 3 Voltage          : "
    f"{data['cell3_voltage_V']:.3f} V"
)

print(
    f"Pack Voltage            : "
    f"{data['pack_voltage_V']:.3f} V"
)

print(
    f"Average Temperature     : "
    f"{data['avg_temperature_C']:.2f} °C"
)

print(
    f"Maximum Temperature     : "
    f"{data['max_temperature_C']:.2f} °C"
)

print(
    f"Gas Sensor              : "
    f"{data['gas_sensor_raw']:.2f}"
)


# ============================================================
# AI RESULTS
# ============================================================

print("\n")
print("AI PREDICTIONS")
print("------------------------------------------------------------")

print(
    f"SOC                     : "
    f"{predicted_soc:.2f}%"
)

print(
    f"SOH                     : "
    f"{predicted_soh:.2f}%"
)

print(
    f"SOH Status              : "
    f"{soh_status}"
)

print(
    f"RUL                     : "
    f"{predicted_rul:.2f} cycles"
)

print(
    f"RUL Status              : "
    f"{rul_status}"
)

print(
    f"Anomaly                 : "
    f"{predicted_anomaly}"
)

print(
    f"Anomaly Confidence      : "
    f"{confidence:.2f}%"
)


# ============================================================
# FINAL SYSTEM STATUS
# ============================================================

print("\n")
print("SYSTEM STATUS")
print("------------------------------------------------------------")

print(
    f"Status                  : "
    f"{system_status}"
)


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n")
print("============================================================")

if predicted_anomaly == "normal":

    print("        BATTERY CONDITION: NORMAL")

else:

    print(
        f"        BATTERY CONDITION: "
        f"{predicted_anomaly.upper()}"
    )

print("============================================================")