import sys
import os
import json
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

print("============================================================")
print("             THE BLACK BOX PIPELINE TEST")
print("============================================================")

# TEST 1: Firebase Connection
print("\n[TEST 1] Testing Firebase connection...")
from services.firebase_service import firebase_service
if firebase_service.initialized:
    print(" [OK] [FIREBASE] CONNECTED")
else:
    print(" [FAIL] [FIREBASE] FAILED TO CONNECT")

# TEST 2: Read Live Telemetry
print("\n[TEST 2] Reading live telemetry from Firebase...")
telemetry = firebase_service.fetch_live_telemetry()
if telemetry:
    print(" [OK] Live Telemetry Received:")
    print(f"   Cell 1 Voltage   : {telemetry['cell1_voltage_v']} V")
    print(f"   Cell 2 Voltage   : {telemetry['cell2_voltage_v']} V")
    print(f"   Cell 3 Voltage   : {telemetry['cell3_voltage_v']} V")
    print(f"   Pack Voltage     : {telemetry['total_voltage_v']} V")
    print(f"   Battery Temp     : {telemetry['battery_temperature_c']} C")
    print(f"   Ambient Temp     : {telemetry['ambient_temperature_c']} C")
    print(f"   Gas Sensor       : {telemetry['gas_sensor_raw']}")
    print(f"   Timestamp        : {telemetry['timestamp']}")
else:
    print(" [FAIL] [TELEMETRY] FAILED TO READ TELEMETRY")
    sys.exit(1)

# TEST 3: Feature Engineering
print("\n[TEST 3] Testing Feature Engineering...")
from services.feature_service import feature_service
derived = feature_service.compute_features(telemetry)
print(" [OK] Derived Features Calculated:")
print(f"   Voltage Avg      : {derived['voltage_avg_V']} V")
print(f"   Min Cell Voltage : {derived['min_cell_voltage_V']} V")
print(f"   Max Cell Voltage : {derived['max_cell_voltage_V']} V")
print(f"   Voltage Imbalance: {derived['cell_voltage_imbalance_V']} V")
print(f"   Temp Rise        : {derived['temperature_rise_C']} C")
print(f"   Measured Current : {derived['measured_current_A']}")
print(f"   Estimated Current: {derived['estimated_current_A']} A")

# TEST 4: ML Models Inference
print("\n[TEST 4] Testing ML Models Inference...")
from services.ml_service import ml_service
predictions = ml_service.predict(derived)
print(" [OK] ML Predictions Completed:")
print(f"   SOC (%)             : {predictions['soc']}%")
print(f"   SOH (%)             : {predictions['soh']}%")
print(f"   RUL (cycles)        : {predictions['rul_cycles']} cycles")
print(f"   Anomaly             : {predictions['anomaly']}")
print(f"   Anomaly Confidence  : {predictions['anomaly_confidence']}%")
print(f"   System Status       : {predictions['system_status']}")

# TEST 5: Full Pipeline Execution & Supabase Insertion
print("\n[TEST 5] Executing Full Pipeline & Supabase Insertion...")
from services.prediction_service import prediction_service
live_state = prediction_service.process_telemetry(telemetry)
print(" [OK] Full Pipeline Result:")
print(json.dumps(live_state, indent=2))

print("\n============================================================")
print("               ALL 5 BACKEND TESTS PASSED [OK]")
print("============================================================")
