import sys
import os
import math
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from services.report_service import report_service
from services.prediction_service import prediction_service

print("============================================================")
print("      THE BLACK BOX REPORT SERVICE TRANSPARENCY TEST SUITE ")
print("============================================================")

failed = 0

# TEST 1: Default Report Generation Structure & 4 Sections
print("\n[TEST 1] Testing report structure and 4 clear sections...")
valid_baseline = {
    "cell1_voltage_v": 3.799,
    "cell2_voltage_v": 3.555,
    "cell3_voltage_v": 3.391,
    "total_voltage_v": 10.745,
    "battery_temperature_c": 27.14,
    "ambient_temperature_c": 27.14,
    "gas_sensor_raw": 195.0,
    "timestamp": "2026-08-13T12:00:00.000Z"
}
prediction_service.process_telemetry(valid_baseline)
report = report_service.generate_report()

if report and report.get("status") == "success":
    sections = report.get("sections", {})
    sec1 = sections.get("ml_predictions")
    sec2 = sections.get("measured_telemetry")
    sec3 = sections.get("calculated_metrics")
    sec4 = sections.get("ai_explanation")
    metadata = report.get("model_metadata")

    sec1_ok = sec1 and "soc" in sec1 and "soh" in sec1 and "rul" in sec1 and "anomaly" in sec1
    sec2_ok = sec2 and "cell1_voltage_v" in sec2 and "temperature_c" in sec2 and "cycle_count" in sec2
    sec3_ok = sec3 and "average_cell_voltage_v" in sec3 and "cell_voltage_spread_v" in sec3
    sec4_ok = sec4 and "executive_summary" in sec4 and "ai_explanation" in sec4 and "rule_based_recommendation" in sec4
    meta_ok = metadata and "soc_model" in metadata and "XGBoost" in metadata["soc_model"].get("algorithm", "")
    src_ok = report.get("prediction_source") == "Prediction Source: XGBoost ML Model"

    if sec1_ok and sec2_ok and sec3_ok and sec4_ok and meta_ok and src_ok:
        print(" [OK] All 4 sections, XGBoost Model Metadata, and Prediction Source present in report.")
    else:
        print(f" [FAIL] Missing section components: sec1={sec1_ok}, sec2={sec2_ok}, sec3={sec3_ok}, sec4={sec4_ok}, meta={meta_ok}, src={src_ok}")
        failed += 1
else:
    print(f" [FAIL] Report generation failed: {report}")
    failed += 1


# TEST 2: Dynamic Telemetry Calculations (C1=3.80V, C2=3.65V, C3=3.60V)
print("\n[TEST 2] Testing dynamic metric calculations (C1=3.80, C2=3.65, C3=3.60)...")
test_payload = {
    "cell1_voltage_v": 3.80,
    "cell2_voltage_v": 3.65,
    "cell3_voltage_v": 3.60,
    "total_voltage_v": 11.05,
    "battery_temperature_c": 35.0,
    "ambient_temperature_c": 25.0,
    "gas_sensor_raw": 200.0,
    "timestamp": "2026-08-13T12:01:00Z"
}
prediction_service.process_telemetry(test_payload)
rep2 = report_service.generate_report()

calc2 = rep2["sections"]["calculated_metrics"]
avg_val = calc2["average_cell_voltage_v"]["value"]
spread_val = calc2["cell_voltage_spread_v"]["value"]

expected_avg = round((3.80 + 3.65 + 3.60) / 3.0, 3) # 3.683
expected_spread = round(3.80 - 3.60, 3) # 0.20

if math.isclose(avg_val, expected_avg, abs_tol=0.01) and math.isclose(spread_val, expected_spread, abs_tol=0.01):
    print(f" [OK] Calculated Avg={avg_val} V (expected {expected_avg} V), Spread={spread_val} V (expected {expected_spread} V)")
else:
    print(f" [FAIL] Calculation mismatch: Avg={avg_val} V (expected {expected_avg}), Spread={spread_val} V (expected {expected_spread})")
    failed += 1


# TEST 3: Cell Removal (C3 = 0.07 V) & Unavailable RUL Handling
print("\n[TEST 3] Testing cell removal (C3 = 0.07V) & unavailable RUL handling...")
removed_payload = {
    "cell1_voltage_v": 3.80,
    "cell2_voltage_v": 3.65,
    "cell3_voltage_v": 0.07,
    "total_voltage_v": 7.52,
    "battery_temperature_c": 27.0,
    "ambient_temperature_c": 27.0,
    "gas_sensor_raw": 195.0,
    "timestamp": "2026-08-13T12:05:00Z"
}
prediction_service.process_telemetry(removed_payload)
rep3 = report_service.generate_report()

rul_info = rep3["sections"]["ml_predictions"]["rul"]
anomaly_info = rep3["sections"]["ml_predictions"]["anomaly"]

rul_ok = (rul_info["value"] is None) and ("Prediction unavailable" in rul_info["formatted"])
anomaly_ok = anomaly_info["source_type"] == "RULE_BASED" and anomaly_info["label"] == "Rule-Based Detection"

if rul_ok and anomaly_ok:
    print(f" [OK] Cell removal correctly handled: RUL formatted='{rul_info['formatted']}', Anomaly label='{anomaly_info['label']}'")
else:
    print(f" [FAIL] Cell removal handling issue: RUL={rul_info}, Anomaly={anomaly_info}")
    failed += 1


# TEST 4: Physical Consistency Validation Failure (-5.0V Cell)
print("\n[TEST 4] Testing physical consistency validation failure (-5.0V Cell)...")
invalid_payload = {
    "cell1_voltage_v": -5.0,
    "cell2_voltage_v": 3.65,
    "cell3_voltage_v": 3.60,
    "total_voltage_v": 2.25,
    "battery_temperature_c": 27.0,
    "ambient_temperature_c": 27.0,
    "gas_sensor_raw": 195.0,
    "timestamp": "2026-08-13T12:10:00Z"
}
prediction_service.process_telemetry(invalid_payload)
rep4 = report_service.generate_report()

if rep4.get("status") == "error" and "Prediction unavailable — invalid or insufficient telemetry." in rep4.get("error", ""):
    print(" [OK] Invalid cell voltage correctly rejected with 'Prediction unavailable — invalid or insufficient telemetry.'")
else:
    print(f" [FAIL] Expected validation failure, got: {rep4}")
    failed += 1

print("\n============================================================")
if failed == 0:
    print("           ALL 4 REPORT TRANSPARENCY TESTS PASSED [OK]")
else:
    print(f"           {failed} TEST(S) FAILED [FAIL]")
print("============================================================")

sys.exit(failed)
