import os
import pandas as pd
import xgboost as xgb

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

import joblib


# ============================================================
# PATHS
# ============================================================

DATA_PATH = "../data/3S_LiIon_BMS_Training_Dataset_5000_3Batteries.xlsx"

MODEL_DIR = "../models/rul"
MODEL_PATH = os.path.join(MODEL_DIR, "rul_model.joblib")


# ============================================================
# RUL FEATURES
# ============================================================

FEATURES = [
    "battery_id",
    "cycle_id",
    "usage_profile",

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

    "gas_change_index",

    "SoH_pct"
]

TARGET = "rul_to_80_cycles"


# ============================================================
# LOAD DATASET
# ============================================================

print("\n========================================")
print("        RUL MODEL TRAINING")
print("========================================")

print("\nLoading dataset...")

df = pd.read_excel(DATA_PATH)

print(
    f"Dataset loaded: "
    f"{df.shape[0]} rows, {df.shape[1]} columns"
)


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

required_columns = FEATURES + [TARGET]

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:

    print("\nERROR: Missing required columns:")

    for column in missing_columns:
        print(f" - {column}")

    raise SystemExit(1)


# ============================================================
# ENCODE CATEGORICAL FEATURES
# ============================================================

df = pd.get_dummies(
    df,
    columns=[
        "battery_id",
        "usage_profile"
    ],
    dtype=int
)


# ============================================================
# BUILD FINAL FEATURE LIST
# ============================================================

categorical_features = [
    column
    for column in df.columns
    if column.startswith("battery_id_")
    or column.startswith("usage_profile_")
]

numeric_features = [
    column
    for column in FEATURES
    if column not in [
        "battery_id",
        "usage_profile"
    ]
]

FINAL_FEATURES = (
    numeric_features
    + categorical_features
)


# ============================================================
# PREPARE X AND Y
# ============================================================

X = df[FINAL_FEATURES]

y = df[TARGET]


print("\nNumber of input features:", len(FINAL_FEATURES))

print("\nTarget:", TARGET)


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)


print("\n========================================")
print("TRAIN / TEST SPLIT")
print("========================================")

print(f"Training samples: {len(X_train)}")
print(f"Testing samples : {len(X_test)}")


# ============================================================
# CREATE MODEL
# ============================================================

model = xgb.XGBRegressor(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    random_state=42,
    n_jobs=-1
)


# ============================================================
# TRAIN
# ============================================================

print("\nTraining XGBoost RUL model...")

model.fit(
    X_train,
    y_train
)

print("Training completed.")


# ============================================================
# PREDICTION
# ============================================================

y_pred = model.predict(X_test)


# ============================================================
# EVALUATION
# ============================================================

mae = mean_absolute_error(
    y_test,
    y_pred
)

rmse = mean_squared_error(
    y_test,
    y_pred
) ** 0.5

r2 = r2_score(
    y_test,
    y_pred
)


print("\n========================================")
print("RUL MODEL PERFORMANCE")
print("========================================")

print(
    f"MAE  : {mae:.4f} cycles"
)

print(
    f"RMSE : {rmse:.4f} cycles"
)

print(
    f"R²   : {r2:.4f}"
)


# ============================================================
# SAMPLE PREDICTIONS
# ============================================================

results = pd.DataFrame({

    "Actual_RUL":
        y_test.values,

    "Predicted_RUL":
        y_pred

})

results["Error"] = (
    results["Predicted_RUL"]
    - results["Actual_RUL"]
)


print("\n========================================")
print("SAMPLE PREDICTIONS")
print("========================================")

print(
    results
    .head(10)
    .to_string(index=False)
)


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

importance = pd.DataFrame({

    "Feature":
        FINAL_FEATURES,

    "Importance":
        model.feature_importances_

})

importance = importance.sort_values(
    by="Importance",
    ascending=False
)


print("\n========================================")
print("TOP FEATURE IMPORTANCE")
print("========================================")

print(
    importance
    .head(15)
    .to_string(index=False)
)


# ============================================================
# SAVE MODEL
# ============================================================

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)

model_package = {

    "model": model,

    "features": FINAL_FEATURES

}

joblib.dump(
    model_package,
    MODEL_PATH
)


print("\n========================================")
print("MODEL SAVED")
print("========================================")

print(
    f"Location: {MODEL_PATH}"
)

print("\nRUL MODEL TRAINING COMPLETE!")