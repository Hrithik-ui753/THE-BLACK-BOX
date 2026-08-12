import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)


# ============================================================
# PATHS
# ============================================================

DATA_PATH = "../data/3S_LiIon_BMS_Training_Dataset_5000_3Batteries.xlsx"

MODEL_DIR = "../models/anomaly"

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "anomaly_model.joblib"
)

ENCODER_PATH = os.path.join(
    MODEL_DIR,
    "anomaly_label_encoder.joblib"
)


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


TARGET = "anomaly_label"


# ============================================================
# LOAD DATASET
# ============================================================

print("\n========================================")
print("       ANOMALY MODEL TRAINING")
print("========================================")

print("\nLoading dataset...")

df = pd.read_excel(DATA_PATH)

print(
    f"Dataset loaded: "
    f"{df.shape[0]} rows, {df.shape[1]} columns"
)


# ============================================================
# CHECK COLUMNS
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
# FEATURES / TARGET
# ============================================================

X = df[FEATURES]

y = df[TARGET]


# ============================================================
# ENCODE TARGET LABELS
# ============================================================

label_encoder = LabelEncoder()

y_encoded = label_encoder.fit_transform(y)


print("\n========================================")
print("ANOMALY CLASSES")
print("========================================")

for number, label in enumerate(
    label_encoder.classes_
):

    print(
        f"{number} -> {label}"
    )


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.20,
    random_state=42,
    stratify=y_encoded
)


print("\n========================================")
print("TRAIN / TEST SPLIT")
print("========================================")

print(
    f"Training samples: {len(X_train)}"
)

print(
    f"Testing samples : {len(X_test)}"
)


# ============================================================
# CREATE CLASSIFIER
# ============================================================

model = RandomForestClassifier(

    n_estimators=300,

    max_depth=None,

    min_samples_split=2,

    min_samples_leaf=1,

    random_state=42,

    n_jobs=-1,

    class_weight="balanced"
)


# ============================================================
# TRAIN
# ============================================================

print(
    "\nTraining Random Forest "
    "Anomaly classifier..."
)

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
# ACCURACY
# ============================================================

accuracy = accuracy_score(
    y_test,
    y_pred
)


print("\n========================================")
print("ANOMALY MODEL PERFORMANCE")
print("========================================")

print(
    f"Accuracy : {accuracy * 100:.2f}%"
)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\n========================================")
print("CLASSIFICATION REPORT")
print("========================================")

print(
    classification_report(
        y_test,
        y_pred,
        target_names=label_encoder.classes_,
        zero_division=0
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\n========================================")
print("CONFUSION MATRIX")
print("========================================")

cm = confusion_matrix(
    y_test,
    y_pred
)

print(cm)


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

importance = pd.DataFrame({

    "Feature":
        FEATURES,

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


joblib.dump(
    model,
    MODEL_PATH
)


joblib.dump(
    label_encoder,
    ENCODER_PATH
)


# ============================================================
# COMPLETE
# ============================================================

print("\n========================================")
print("MODELS SAVED")
print("========================================")

print(
    f"Model: {MODEL_PATH}"
)

print(
    f"Encoder: {ENCODER_PATH}"
)

print("\nANOMALY MODEL TRAINING COMPLETE!")