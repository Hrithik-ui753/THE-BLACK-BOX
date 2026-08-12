import os
import sys
import pandas as pd
import joblib

import firebase_admin
from firebase_admin import credentials
from firebase_admin import db


# ============================================================
# CONFIGURATION
# ============================================================

SERVICE_ACCOUNT = "serviceAccountKey.json"

DATABASE_URL = (
    "https://black-box-24537-default-rtdb.firebaseio.com/"
)


# ============================================================
# MODEL PATHS
# ============================================================

SOC_MODEL_PATH = "../models/soc/soc_model.joblib"
SOH_MODEL_PATH = "../models/soh/soh_model.joblib"
RUL_MODEL_PATH = "../models/rul/rul_model.joblib"

ANOMALY_MODEL_PATH = "../models/anomaly/anomaly_model.joblib"
ANOMALY_ENCODER_PATH = (
    "../models/anomaly/anomaly_label_encoder.joblib"
)


# ============================================================
# CHECK FILES
# ============================================================

required_files = [
    SERVICE_ACCOUNT,
    SOC_MODEL_PATH,
    SOH_MODEL_PATH,
    RUL_MODEL_PATH,
    ANOMALY_MODEL_PATH,
    ANOMALY_ENCODER_PATH
]

for file_path in required_files:

    if not os.path.exists(file_path):

        print("\nERROR: File not found:")
        print(file_path)

        sys.exit(1)


# ============================================================
# FIREBASE INITIALIZATION
# ============================================================

if not firebase_admin._apps:

    cred = credentials.Certificate(
        SERVICE_ACCOUNT
    )

    firebase_admin.initialize_app(
        cred,
        {
            "databaseURL": DATABASE_URL
        }
    )


# ============================================================
# LOAD MODELS
# ============================================================

print("\nLoading ML models...")

soc_model = joblib.load(
    SOC_MODEL_PATH
)

soh_package = joblib.load(
    SOH_MODEL_PATH
)

rul_package = joblib.load(
    RUL_MODEL_PATH
)

anomaly_model = joblib.load(
    ANOMALY_MODEL_PATH
)

anomaly_encoder = joblib.load(
    ANOMALY_ENCODER_PATH
)


# ============================================================
# EXTRACT MODEL FEATURES
# ============================================================

soh_model = soh_package["model"]
soh_features = soh_package["features"]

rul_model = rul_package["model"]
rul_features = rul_package["features"]


print("All models loaded.")


# ============================================================
# CURRENT ESTIMATION
# ============================================================

def estimate_current(pack_voltage):

    if pack_voltage >= 11.6:

        return 0.4

    elif pack_voltage >= 7.32:

        return 0.3

    elif pack_voltage >= 4.6:

        return 0.2

    else:

        return 0.1


# ============================================================
# READ FIREBASE LIVE DATA
# ============================================================

live_ref = db.reference(
    "battery/live"
)

live_data = live_ref.get()


if not live_data:

    print("\nERROR: No live battery data found.")

    sys.exit(1)


print("\nFirebase live data received:")
print(live_data)


# ============================================================
# SUPPORT BOTH CURRENT FIREBASE STRUCTURES
# ============================================================

# Preferred structure:
#
# battery/live
#     cell1
#     cell2
#     cell3
#     batteryTemperature
#     ambientTemperature
#     gas
#
# For now your current database only has cell1.
# The script will therefore stop with a clear message
# until cell2 and cell3 are available.

if "cell1" in live_data:

    cell1 = live_data["cell1"]

    cell1_voltage = float(
        cell1.get("voltage", 0)
    )

    battery_temperature = float(
        cell1.get("temperature", 0)
    )

    ambient_temperature = float(
        cell1.get("ambientTemperature", 0)
    )

    gas_sensor = float(
        cell1.get("gas", 0)
    )

    # If separate cells exist
    if "cell2" in live_data:

        cell2_voltage = float(
            live_data["cell2"].get("voltage", 0)
        )

    else:

        cell2_voltage = 0

    if "cell3" in live_data:

        cell3_voltage = float(
            live_data["cell3"].get("voltage", 0)
        )

    else:

        cell3_voltage = 0

else:

    print("\nERROR:")
    print("Firebase does not contain battery/live/cell1")

    sys.exit(1)


# ============================================================
# CHECK THREE CELL VOLTAGES
# ============================================================

if (
    cell1_voltage <= 0
    or cell2_voltage <= 0
    or cell3_voltage <= 0
):

    print("\n========================================")
    print("WAITING FOR 3 CELL VOLTAGES")
    print("========================================")

    print(
        f"Cell 1 : {cell1_voltage:.3f} V"
    )

    print(
        f"Cell 2 : {cell2_voltage:.3f} V"
    )

    print(
        f"Cell 3 : {cell3_voltage:.3f} V"
    )

    print("\nFirebase currently needs:")

    print(
        "battery/live/cell1/voltage"
    )

    print(
        "battery/live/cell2/voltage"
    )

    print(
        "battery/live/cell3/voltage"
    )

    sys.exit(0)


# ============================================================
# DERIVED FEATURES
# ============================================================

pack_voltage = (
    cell1_voltage
    + cell2_voltage
    + cell3_voltage
)

voltage_avg = (
    pack_voltage / 3
)

min_cell_voltage = min(
    cell1_voltage,
    cell2_voltage,
    cell3_voltage
)

max_cell_voltage = max(
    cell1_voltage,
    cell2_voltage,
    cell3_voltage
)

cell_voltage_imbalance = (
    max_cell_voltage
    - min_cell_voltage
)

temperature_rise = (
    battery_temperature
    - ambient_temperature
)


# ============================================================
# AUTOMATIC CURRENT
# ============================================================

estimated_current = estimate_current(
    pack_voltage
)


# ============================================================
# AUTOMATIC C-RATE
# ============================================================

# Your dataset uses capacity around a few Ah.
# For the demo we use the same 2.8 Ah value
# used in our previous prediction tests.

capacity_Ah = 2.8

avg_c_rate = (
    estimated_current / capacity_Ah
)


# ============================================================
# OTHER DEMO VALUES
# ============================================================

max_current = estimated_current

high_current_burst = (
    1 if estimated_current >= 0.4 else 0
)

charge_time = 90.0

discharge_time = 75.0

internal_resistance = 0.045

discharge_depth = 60.0

power_avg = (
    pack_voltage * estimated_current
)

gas_change_index = 0.05


# ============================================================
# CREATE INPUT DATA
# ============================================================

data = {

    "battery_id": "BAT_001",

    "cycle_id": 250,

    "usage_profile": "normal",

    "cell1_voltage_V":
        cell1_voltage,

    "cell2_voltage_V":
        cell2_voltage,

    "cell3_voltage_V":
        cell3_voltage,

    "pack_voltage_V":
        pack_voltage,

    "voltage_avg_V":
        voltage_avg,

    "min_cell_voltage_V":
        min_cell_voltage,

    "max_cell_voltage_V":
        max_cell_voltage,

    "cell_voltage_imbalance_V":
        cell_voltage_imbalance,

    "avg_c_rate":
        avg_c_rate,

    "max_current_A":
        max_current,

    "avg_temperature_C":
        battery_temperature,

    "max_temperature_C":
        battery_temperature,

    "ambient_temperature_C":
        ambient_temperature,

    "gas_sensor_raw":
        gas_sensor,

    "discharge_depth_pct":
        discharge_depth,

    "high_current_burst":
        high_current_burst,

    "charge_time_min":
        charge_time,

    "discharge_time_min":
        discharge_time,

    "internal_resistance_proxy_ohm":
        internal_resistance,

    "capacity_Ah":
        capacity_Ah,

    "temperature_rise_C":
        temperature_rise,

    "power_avg_W":
        power_avg,

    "gas_change_index":
        gas_change_index,

    # Demo state used by RUL model
    "SoH_pct": 85.0
}


df = pd.DataFrame([data])


# ============================================================
# SOC
# ============================================================

soc_features = [
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

soc_input = df[soc_features]

predicted_soc = soc_model.predict(
    soc_input
)[0]

predicted_soc = max(
    0,
    min(100, predicted_soc)
)


# ============================================================
# SOH
# ============================================================

encoded_df = pd.get_dummies(
    df.copy(),
    columns=[
        "battery_id",
        "usage_profile"
    ],
    dtype=int
)

for feature in soh_features:

    if feature not in encoded_df.columns:

        encoded_df[feature] = 0


soh_input = encoded_df[
    soh_features
]

predicted_soh = soh_model.predict(
    soh_input
)[0]

predicted_soh = max(
    0,
    min(100, predicted_soh)
)


# ============================================================
# RUL
# ============================================================

for feature in rul_features:

    if feature not in encoded_df.columns:

        encoded_df[feature] = 0


rul_input = encoded_df[
    rul_features
]

predicted_rul = rul_model.predict(
    rul_input
)[0]

predicted_rul = max(
    0,
    predicted_rul
)


# ============================================================
# ANOMALY
# ============================================================

anomaly_features = [
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

anomaly_input = df[
    anomaly_features
]

encoded_anomaly = anomaly_model.predict(
    anomaly_input
)[0]

predicted_anomaly = (
    anomaly_encoder.inverse_transform(
        [encoded_anomaly]
    )[0]
)

probabilities = (
    anomaly_model.predict_proba(
        anomaly_input
    )[0]
)

anomaly_confidence = (
    max(probabilities) * 100
)


# ============================================================
# STATUS
# ============================================================

if predicted_anomaly == "normal":

    system_status = "NORMAL"

else:

    system_status = "ANOMALY DETECTED"


# ============================================================
# DISPLAY
# ============================================================

print("\n")
print("============================================================")
print("              THE BLACK BOX - LIVE ML")
print("============================================================")

print("\nLIVE SENSOR DATA")
print("------------------------------------------------------------")

print(
    f"Cell 1 Voltage       : "
    f"{cell1_voltage:.3f} V"
)

print(
    f"Cell 2 Voltage       : "
    f"{cell2_voltage:.3f} V"
)

print(
    f"Cell 3 Voltage       : "
    f"{cell3_voltage:.3f} V"
)

print(
    f"Pack Voltage         : "
    f"{pack_voltage:.3f} V"
)

print(
    f"Battery Temperature  : "
    f"{battery_temperature:.2f} °C"
)

print(
    f"Ambient Temperature  : "
    f"{ambient_temperature:.2f} °C"
)

print(
    f"Gas Sensor           : "
    f"{gas_sensor:.2f}"
)


print("\nDERIVED / DEMO VALUES")
print("------------------------------------------------------------")

print(
    f"Estimated Current    : "
    f"{estimated_current:.2f} A"
)

print(
    f"Average C-Rate       : "
    f"{avg_c_rate:.3f}"
)

print(
    f"Voltage Imbalance    : "
    f"{cell_voltage_imbalance:.3f} V"
)

print(
    f"Temperature Rise     : "
    f"{temperature_rise:.2f} °C"
)


print("\nML PREDICTIONS")
print("------------------------------------------------------------")

print(
    f"SOC                 : "
    f"{predicted_soc:.2f}%"
)

print(
    f"SOH                 : "
    f"{predicted_soh:.2f}%"
)

print(
    f"RUL                 : "
    f"{predicted_rul:.2f} cycles"
)

print(
    f"Anomaly             : "
    f"{predicted_anomaly}"
)

print(
    f"Confidence          : "
    f"{anomaly_confidence:.2f}%"
)


print("\nSYSTEM STATUS")
print("------------------------------------------------------------")

print(
    f"{system_status}"
)


# ============================================================
# WRITE RESULTS BACK TO FIREBASE
# ============================================================

prediction_ref = db.reference(
    "battery/live/predictions"
)

prediction_ref.set({

    "soc": round(
        float(predicted_soc),
        2
    ),

    "soh": round(
        float(predicted_soh),
        2
    ),

    "rul_cycles": round(
        float(predicted_rul),
        2
    ),

    "anomaly": str(
        predicted_anomaly
    ),

    "anomaly_confidence": round(
        float(anomaly_confidence),
        2
    ),

    "estimated_current_A": round(
        float(estimated_current),
        3
    ),

    "pack_voltage_V": round(
        float(pack_voltage),
        3
    ),

    "temperature_rise_C": round(
        float(temperature_rise),
        2
    )
})


print("\n============================================================")
print("Predictions written to:")
print("battery/live/predictions")
print("============================================================")