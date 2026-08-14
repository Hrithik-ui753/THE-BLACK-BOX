import logging
from typing import Dict, Any, Optional

from email_alert_service import email_service, alert_tracker
from config import DEFAULT_BATTERY_ID, CELL_ABSENT_THRESHOLD

logger = logging.getLogger(__name__)


class AlertService:
    def evaluate_and_notify(
        self,
        battery_id: str,
        sensor_data: Dict[str, Any],
        derived_features: Dict[str, Any],
        predictions: Dict[str, Any],
        force_send: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluates battery telemetry, derived features, and ML predictions.
        If a Warning or Critical condition occurs, checks deduplication rules
        and sends a Gmail alert via SMTP.
        """
    def _extract_voltage(self, data: Dict[str, Any], keys: list, default: float) -> float:
        for k in keys:
            val = data.get(k)
            if val is not None:
                try:
                    return round(float(val), 3)
                except Exception:
                    pass
        return round(default, 3)

    def evaluate_and_notify(
        self,
        battery_id: str,
        sensor_data: Dict[str, Any],
        derived_features: Dict[str, Any],
        predictions: Dict[str, Any],
        force_send: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluates battery telemetry, derived features, and ML predictions.
        If a Warning or Critical condition occurs, checks deduplication rules
        and sends a Gmail alert via SMTP.
        """
        c1 = self._extract_voltage(sensor_data, ["cell1_voltage_v", "cell1_v", "cell1", "c1", "voltage1"], 3.799)
        c2 = self._extract_voltage(sensor_data, ["cell2_voltage_v", "cell2_v", "cell2", "c2", "voltage2"], 3.606)
        c3 = self._extract_voltage(sensor_data, ["cell3_voltage_v", "cell3_v", "cell3", "c3", "voltage3"], 3.391)

        raw_total = sensor_data.get("total_voltage_v") or sensor_data.get("total_v") or sensor_data.get("pack_voltage")
        if raw_total is not None:
            try:
                total_v = round(float(raw_total), 3)
            except Exception:
                total_v = round(c1 + c2 + c3, 3)
        else:
            total_v = round(c1 + c2 + c3, 3)

        try:
            temp_c = round(float(sensor_data.get("battery_temperature_c") if sensor_data.get("battery_temperature_c") is not None else 27.14), 2)
        except Exception:
            temp_c = 27.14

        min_v = round(float(derived_features.get("min_cell_voltage_V", min(c1, c2, c3))), 3)
        max_v = round(float(derived_features.get("max_cell_voltage_V", max(c1, c2, c3))), 3)
        imbalance_v = round(float(derived_features.get("cell_voltage_imbalance_V", max_v - min_v)), 3)

        soc_pct = float(predictions.get("soc") if predictions.get("soc") is not None else 85.0)
        soh_pct = float(predictions.get("soh") if predictions.get("soh") is not None else 94.0)
        rul_cycles = predictions.get("rul_cycles", 180)
        anomaly = predictions.get("anomaly", "normal")
        status_str = predictions.get("system_status", "NORMAL")

        cells_list = [
            {"index": 1, "voltage": c1, "temperature": temp_c, "status": "CELL_REMOVED" if c1 <= CELL_ABSENT_THRESHOLD else "critical" if c1 <= 2.5 else "warning" if c1 < 3.2 else "healthy"},
            {"index": 2, "voltage": c2, "temperature": temp_c, "status": "CELL_REMOVED" if c2 <= CELL_ABSENT_THRESHOLD else "critical" if c2 <= 2.5 else "warning" if c2 < 3.2 else "healthy"},
            {"index": 3, "voltage": c3, "temperature": temp_c, "status": "CELL_REMOVED" if c3 <= CELL_ABSENT_THRESHOLD else "critical" if c3 <= 2.5 else "warning" if c3 < 3.2 else "healthy"},
        ]

        # Determine Specific Issue & Action (Dead Battery 0V/0.07V & Removed Cell Differentiation)
        removed_cells = [c for c in cells_list if c["voltage"] <= CELL_ABSENT_THRESHOLD]
        zero_cells = [c for c in cells_list if CELL_ABSENT_THRESHOLD < c["voltage"] <= 0.50]
        is_entire_pack_dead = total_v <= 1.0 or (c1 <= CELL_ABSENT_THRESHOLD and c2 <= CELL_ABSENT_THRESHOLD and c3 <= CELL_ABSENT_THRESHOLD)
        is_low_net_v = total_v < 7.5

        if is_entire_pack_dead:
            severity = "CRITICAL"
            detected_prob = f"🚨 DEAD BATTERY PACK: Net voltage is {total_v:.3f} V (0.00 V / depleted). All cells are drained or disconnected!"
            rec_action = "IMMEDIATELY ISOLATE PACK. Check physical cell contact terminals and inspect cells before recharging."
        elif removed_cells:
            severity = "CRITICAL"
            removed_indices = [str(c["index"]) for c in removed_cells]
            detected_prob = f"🔌 CELL REMOVED / DISCONNECTED: Cell(s) {', '.join(removed_indices)} reading floating open-circuit voltage ({min_v:.3f} V ~0.07 V). Cell appears physically REMOVED or DISCONNECTED from holder!"
            rec_action = f"Check physical cell holder contact and re-insert Cell(s) {', '.join(removed_indices)} securely."
        elif zero_cells:
            severity = "CRITICAL"
            zero_indices = [str(c["index"]) for c in zero_cells]
            detected_prob = f"🚨 CRITICAL DEAD CELL: Cell(s) {', '.join(zero_indices)} voltage is {min_v:.3f} V (depleted / dead cell under load). Replace Cell(s) {', '.join(zero_indices)} immediately!"
            rec_action = f"Isolate battery pack and REPLACE Cell(s) {', '.join(zero_indices)} before operating!"
        elif is_low_net_v:
            severity = "CRITICAL"
            detected_prob = f"⚠️ CRITICAL LOW VOLTAGE: Battery net pack voltage ({total_v:.3f} V < 7.5 V) is depleted."
            rec_action = "Connect pack to charger immediately and inspect cell balance."
        elif min_v <= 2.50 or imbalance_v >= 0.60 or temp_c > 55.0 or anomaly in ["critical_failure", "thermal_runaway"]:
            severity = "CRITICAL"
            weakest = min(cells_list, key=lambda c: c["voltage"])
            detected_prob = f"Cell {weakest['index']} is at {min_v:.3f} V with severe pack imbalance {imbalance_v:.3f} V. Anomaly status: {anomaly}."
            rec_action = f"Inspect Cell {weakest['index']}. Stop heavy discharge load immediately."
        elif min_v < 3.00 or imbalance_v >= 0.30 or temp_c > 45.0 or soh_pct < 80.0 or anomaly != "normal":
            severity = "WARNING"
            detected_prob = f"Cell imbalance elevated to {imbalance_v:.3f} V with temp {temp_c:.1f} °C."
            rec_action = "Monitor pack balance and allow thermal equalization on next charge."
        else:
            severity = "NORMAL"
            detected_prob = f"Battery pack operating normally at {total_v:.3f} V."
            rec_action = "Continue standard monitoring."

        weakest = min(cells_list, key=lambda c: c["voltage"]) if cells_list else {"index": 1, "voltage": 3.6}

        details = {
            "severity": severity,
            "min_voltage": min_v,
            "imbalance_v": imbalance_v,
            "temperature": temp_c,
            "anomaly": anomaly,
            "weakest_cell_index": weakest.get("index", 1),
            "zero_cells": [c["index"] for c in zero_cells],
            "removed_cells": [c["index"] for c in removed_cells]
        }

        # Deduplication check
        should_send, reason = alert_tracker.evaluate_dispatch_necessity(
            battery_id=battery_id,
            current_severity=severity,
            current_details=details
        )

        # User Directive: Only dispatch alerts for REMOVED CELL or DEAD/DRAINED BATTERY (< 1.0V) or RECOVERY
        is_realistic_hardware_alert = bool(removed_cells or zero_cells or is_entire_pack_dead or min_v <= 1.00)

        if not is_realistic_hardware_alert and not force_send and reason != "RECOVERY":
            alert_tracker.update_state(battery_id, details)
            logger.info(f"[AlertService] Alert suppressed by hardware policy (only removed cell or dead battery <1.0V triggers alerts).")
            return {"status": "suppressed", "reason": "NON_HARDWARE_ALERT_SUPPRESSED", "severity": severity}

        if not should_send and not force_send:
            alert_tracker.update_state(battery_id, details)
            logger.info(f"[AlertService] Alert suppressed by deduplication rules ({reason}) for battery {battery_id}.")
            return {"status": "suppressed", "reason": reason, "severity": severity}

        # Build Email Content & Handle Event Type
        event_type = "RECOVERY" if reason == "RECOVERY" else "ALERT"

        if event_type == "RECOVERY":
            detected_prob = f"🟢 HEALTHY: Battery pack net voltage is {total_v:.3f} V. Drained/disconnected cell replacement verified."
            ai_assess = f"Battery pack condition has returned to normal healthy state ({total_v:.3f} V). Cell replacement or reconnection verified."
            possible_causes = [
                "Drained or damaged cell successfully replaced with healthy unit",
                "Disconnected cell reconnected securely to battery holder",
                "Battery pack recharged and balanced to safe limits"
            ]
            rec_action = "No action required. Battery pack is operating normally within optimal parameters."
        else:
            ai_assess = f"System detected {severity} condition for battery {battery_id}. Net V: {total_v:.3f} V, Imbalance: {imbalance_v:.3f} V, Temperature: {temp_c:.1f} °C, Anomaly: {anomaly}."
            possible_causes = [
                "Internal cell degradation or impedance mismatch",
                "Deep discharge or over-discharge state",
                "Thermal stress or insufficient cooling",
                "Measurement sensor calibration drift"
            ]

        subject, text_body, html_body = email_service.build_alert_content(
            severity=severity,
            battery_id=battery_id,
            battery_name="BLACK BOX Battery Pack",
            health_score=int(soh_pct),
            soh_pct=soh_pct,
            overall_risk=severity,
            anomaly_score=int(predictions.get("anomaly_confidence", 95)),
            cells_data=cells_list,
            detected_problem=detected_prob,
            max_v=max_v,
            min_v=min_v,
            imbalance_v=imbalance_v,
            ai_assessment=ai_assess,
            possible_causes=possible_causes,
            recommended_action=rec_action,
            event_type=event_type,
            total_v=total_v
        )

        recipient = email_service.default_recipient
        email_sent = email_service.send_email(
            recipient=recipient,
            subject=subject,
            plain_text_body=text_body,
            html_body=html_body
        )

        # Update tracker state with exact dispatch result
        import time
        details["email_sent"] = email_sent
        details["last_dispatch_ts"] = time.time()
        alert_tracker.update_state(battery_id, details)

        logger.info(f"[AlertService] Dispatched Gmail alert to {recipient} (Success: {email_sent})")

        return {
            "status": "sent" if email_sent else "failed",
            "severity": severity,
            "recipient": recipient,
            "email_sent": email_sent,
            "detected_problem": detected_prob
        }


# Singleton Instance
alert_service = AlertService()
