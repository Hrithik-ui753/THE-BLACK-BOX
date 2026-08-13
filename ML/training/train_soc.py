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
MODEL_DIR = "../models/soc"
MODEL_PATH = os.path.join(MODEL_DIR, "soc_model.joblib")


# ============================================================
# SOC FEATURES
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

TARGET = "SoC_pct"


# ============================================================
# LOAD DATASET
# ============================================================

print("\n========================================")
print("        SOC MODEL TRAINING")
print("========================================")

print("\nLoading dataset...")

df = pd.read_excel(DATA_PATH)

print(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

required_columns = FEATURES + [TARGET]

missing_columns = [
    column for column in required_columns
    if column not in df.columns
]

if missing_columns:
    print("\nERROR: Missing required columns:")
    for column in missing_columns:
        print(f" - {column}")
    raise SystemExit(1)


# ============================================================
# SELECT FEATURES AND TARGET
# ============================================================

X = df[FEATURES]
y = df[TARGET]


print("\nFeatures used:")
for feature in FEATURES:
    print(f" - {feature}")

print(f"\nTarget: {TARGET}")


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

print("\nTraining XGBoost SOC model...")

model.fit(X_train, y_train)

print("Training completed.")


# ============================================================
# PREDICTION
# ============================================================

y_pred = model.predict(X_test)


# ============================================================
# EVALUATION
# ============================================================

mae = mean_absolute_error(y_test, y_pred)
rmse = mean_squared_error(y_test, y_pred) ** 0.5
r2 = r2_score(y_test, y_pred)


print("\n========================================")
print("SOC MODEL PERFORMANCE")
print("========================================")

print(f"MAE  : {mae:.4f} %")
print(f"RMSE : {rmse:.4f} %")
print(f"R²   : {r2:.4f}")


# ============================================================
# SAMPLE PREDICTIONS
# ============================================================

results = pd.DataFrame({
    "Actual_SoC": y_test.values,
    "Predicted_SoC": y_pred
})

results["Error"] = (
    results["Predicted_SoC"] - results["Actual_SoC"]
)

print("\n========================================")
print("SAMPLE PREDICTIONS")
print("========================================")

print(results.head(10).to_string(index=False))


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

importance = pd.DataFrame({
    "Feature": FEATURES,
    "Importance": model.feature_importances_
})

importance = importance.sort_values(
    by="Importance",
    ascending=False
)

print("\n========================================")
print("FEATURE IMPORTANCE")
print("========================================")

print(importance.to_string(index=False))


# ============================================================
# SAVE MODEL
# ============================================================

os.makedirs(MODEL_DIR, exist_ok=True)

joblib.dump(model, MODEL_PATH)

print("\n========================================")
print("MODEL SAVED")
print("========================================")

print(f"Location: {MODEL_PATH}")
print("\nSOC MODEL TRAINING COMPLETE!")