import sys
import os
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from config import CELL_ABSENT_THRESHOLD
from services.feature_service import feature_service
from services.ml_service import ml_service
from services.prediction_service import prediction_service

print("============================================================")
print("     BLACK BOX CELL PRESENCE & ABSENT-CELL TEST SUITE      ")
print("============================================================")
print(f"Configured CELL_ABSENT_THRESHOLD: {CELL_ABSENT_THRESHOLD} V\n")

failed_count = 0

def run_test(test_id: str, description: str, voltages: tuple, expected_statuses: tuple, expected_ml_flags: tuple):
    global failed_count
    c1_v, c2_v, c3_v = voltages
    print(f"\n--- [{test_id}] {description} ---")
    print(f"Input Voltages: Cell 1={c1_v}V, Cell 2={c2_v}V, Cell 3={c3_v}V")
    
    sensor_data = {
        "cell1_voltage_v": c1_v,
        "cell2_voltage_v": c2_v,
        "cell3_voltage_v": c3_v,
        "total_voltage_v": round(c1_v + c2_v + c3_v, 3),
        "battery_temperature_c": 27.14,
        "ambient_temperature_c": 27.14,
        "gas_sensor_raw": 195.0,
        "timestamp": f"2026-08-12T23:30:{test_id.replace('TEST', '').strip().zfill(2)}"
    }

    derived = feature_service.compute_features(sensor_data)
    predictions = ml_service.predict(derived)

    actual_statuses = (
        predictions["cell1_status"],
        predictions["cell2_status"],
        predictions["cell3_status"]
    )
    
    actual_ml_flags = tuple(not c["ml_skipped"] for c in predictions["cells"])
    
    status_pass = actual_statuses == expected_statuses
    ml_pass = actual_ml_flags == expected_ml_flags

    print(f"Cell Statuses: {actual_statuses} | Expected: {expected_statuses} -> {'[OK]' if status_pass else '[FAIL]'}")
    print(f"ML Executed  : {actual_ml_flags} | Expected: {expected_ml_flags} -> {'[OK]' if ml_pass else '[FAIL]'}")

    for c in predictions["cells"]:
        idx = c["cell_index"]
        print(f"   Cell {idx}: Status={c['status']}, SOC={c['soc']}, SOH={c['soh']}, ML_Skipped={c['ml_skipped']}")

    if status_pass and ml_pass:
        print(f"Result: {test_id} PASSED [OK]")
    else:
        print(f"Result: {test_id} FAILED [FAIL]")
        failed_count += 1

# TEST 1: All batteries connected
run_test(
    "TEST 1",
    "All batteries connected (3.8V, 3.8V, 3.8V)",
    (3.80, 3.80, 3.80),
    ("CELL_PRESENT", "CELL_PRESENT", "CELL_PRESENT"),
    (True, True, True)
)

# TEST 2: Cell 2 removed
run_test(
    "TEST 2",
    "Cell 2 removed (3.8V, 0.07V, 3.8V)",
    (3.80, 0.07, 3.80),
    ("CELL_PRESENT", "CELL_REMOVED", "CELL_PRESENT"),
    (True, False, True)
)

# TEST 3: Cell 1 removed
run_test(
    "TEST 3",
    "Cell 1 removed (0.07V, 3.8V, 3.8V)",
    (0.07, 3.80, 3.80),
    ("CELL_REMOVED", "CELL_PRESENT", "CELL_PRESENT"),
    (False, True, True)
)

# TEST 4: Cell 3 removed
run_test(
    "TEST 4",
    "Cell 3 removed (3.8V, 3.8V, 0.07V)",
    (3.80, 3.80, 0.07),
    ("CELL_PRESENT", "CELL_PRESENT", "CELL_REMOVED"),
    (True, True, False)
)

# TEST 5: Very low voltage 0.10V (<= 0.15V)
run_test(
    "TEST 5",
    "Very low voltage 0.10V (<= 0.15V threshold)",
    (3.80, 0.10, 3.80),
    ("CELL_PRESENT", "CELL_REMOVED", "CELL_PRESENT"),
    (True, False, True)
)

# TEST 6: Normal low battery 3.0V (> 0.15V)
run_test(
    "TEST 6",
    "Normal low battery 3.0V (> 0.15V threshold)",
    (3.00, 3.00, 3.00),
    ("CELL_PRESENT", "CELL_PRESENT", "CELL_PRESENT"),
    (True, True, True)
)

print("\n============================================================")
if failed_count == 0:
    print("           ALL 6 CELL PRESENCE TESTS PASSED [OK]")
else:
    print(f"           {failed_count} TEST(S) FAILED [FAIL]")
print("============================================================")

sys.exit(failed_count)
