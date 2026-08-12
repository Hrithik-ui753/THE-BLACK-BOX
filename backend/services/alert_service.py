import logging
from typing import Dict, Any, Optional

from email_alert_service import email_service, sms_service, alert_tracker
from config import DEFAULT_BATTERY_ID

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
        and sends a Gmail alert (+ optional SMS).
        """
        try:
            c1 = float(sensor_data.get("cell1_voltage_v") if sensor_data.get("cell1_voltage_v") is not None else 3.799)
        except Exception:
            c1 = 0.0

        try:
            c2 = float(sensor_data.get("cell2_voltage_v") if sensor_data.get("cell2_voltage_v") is not None else 3.606)
        except Exception:
            c2 = 0.0

        try:
            c3 = float(sensor_data.get("cell3_voltage_v") if sensor_data.get("cell3_voltage_v") is not None else 3.425)
        except Exception:
            c3 = 0.0

        try:
            total_v = float(sensor_data.get("total_voltage_v") if sensor_data.get("total_voltage_v") is not None else (c1 + c2 + c3))
        except Exception:
            total_v = round(c1 + c2 + c3, 3)

        try:
            temp_c = float(sensor_data.get("battery_temperature_c") if sensor_data.get("battery_temperature_c") is not None else 27.14)
        except Exception:
            temp_c = 27.14

        min_v = float(derived_features.get("min_cell_voltage_V", min(c1, c2, c3)))
        max_v = float(derived_features.get("max_cell_voltage_V", max(c1, c2, c3)))
        imbalance_v = float(derived_features.get("cell_voltage_imbalance_V", max_v - min_v))

        soc_pct = float(predictions.get("soc", 85.0))
        soh_pct = float(predictions.get("soh", 94.0))
        rul_cycles = predictions.get("rul_cycles", 180)
        anomaly = predictions.get("anomaly", "normal")
        status_str = predictions.get("system_status", "NORMAL")

        cells_list = [
            {"index": 1, "voltage": c1, "temperature": temp_c, "status": "critical" if c1 <= 2.5 else "warning" if c1 < 3.2 else "healthy"},
            {"index": 2, "voltage": c2, "temperature": temp_c, "status": "critical" if c2 <= 2.5 else "warning" if c2 < 3.2 else "healthy"},
            {"index": 3, "voltage": c3, "temperature": temp_c, "status": "critical" if c3 <= 2.5 else "warning" if c3 < 3.2 else "healthy"},
        ]

        # Determine Specific Issue & Action (Dead Battery 0V & Dead Cell 0V Handling)
        zero_cells = [c for c in cells_list if c["voltage"] <= 0.5]
        is_entire_pack_dead = total_v <= 1.0 or (c1 <= 0.5 and c2 <= 0.5 and c3 <= 0.5)
        is_low_net_v = total_v < 7.5

        if is_entire_pack_dead:
            severity = "CRITICAL"
            detected_prob = f"🚨 DEAD BATTERY PACK: Net voltage is {total_v:.2f} V (0.0 V / depleted). All cells are drained/dead!"
            rec_action = "IMMEDIATELY ISOLATE DEAD PACK. Inspect cells for physical damage or deep discharge state before recharging."
            sms_msg = f"🚨 THE BLACK BOX CRITICAL: Battery pack is DEAD ({total_v:.2f}V). Disconnect immediately!"
        elif zero_cells:
            severity = "CRITICAL"
            zero_indices = [str(c["index"]) for c in zero_cells]
            detected_prob = f"🚨 CRITICAL CELL FAILURE: Cell(s) {', '.join(zero_indices)} voltage is 0.0 V (depleted / dead). Replace Cell(s) {', '.join(zero_indices)} immediately!"
            rec_action = f"Isolate battery pack and REPLACE Cell(s) {', '.join(zero_indices)} before operating!"
            sms_msg = f"🚨 THE BLACK BOX CRITICAL: Cell(s) {', '.join(zero_indices)} is 0.0V / depleted. Replace immediately!"
        elif is_low_net_v:
            severity = "CRITICAL"
            detected_prob = f"⚠️ CRITICAL LOW VOLTAGE: Battery net pack voltage ({total_v:.2f} V < 7.5 V) is depleted."
            rec_action = "Connect pack to charger immediately and inspect cell balance."
            sms_msg = f"⚠️ THE BLACK BOX: Battery net voltage is {total_v:.2f}V (< 7.5V). Needs recharge!"
        elif min_v < 2.80 or imbalance_v > 0.20 or temp_c > 55.0 or anomaly != "normal":
            severity = "CRITICAL"
            weakest = min(cells_list, key=lambda c: c["voltage"])
            detected_prob = f"Cell {weakest['index']} is at {min_v:.2f} V with pack imbalance {imbalance_v:.2f} V. Anomaly status: {anomaly}."
            rec_action = f"Inspect Cell {weakest['index']}. Stop heavy discharge load immediately."
            sms_msg = f"🚨 THE BLACK BOX ALERT: Cell {weakest['index']} at {min_v:.2f}V. Imbalance: {imbalance_v:.2f}V."
        elif imbalance_v > 0.10 or temp_c > 45.0 or soh_pct < 80.0:
            severity = "WARNING"
            detected_prob = f"Cell imbalance elevated to {imbalance_v:.2f} V with temp {temp_c:.1f} °C."
            rec_action = "Monitor pack balance and allow thermal equalization."
            sms_msg = f"🟡 THE BLACK BOX WARNING: High cell imbalance ({imbalance_v:.2f}V) detected."
        else:
            severity = "NORMAL"
            detected_prob = f"Battery pack operating normally at {total_v:.2f} V."
            rec_action = "Continue standard monitoring."
            sms_msg = ""

        # Only dispatch for Warning / Critical conditions
        if severity not in ["WARNING", "CRITICAL"] and not force_send:
            return None

        details = {
            "severity": severity,
            "min_voltage": min_v,
            "imbalance_v": imbalance_v,
            "temperature": temp_c,
            "anomaly": anomaly
        }

        # Deduplication check
        should_send, reason = alert_tracker.evaluate_dispatch_necessity(
            battery_id=battery_id,
            current_severity=severity,
            current_details=details
        )
        alert_tracker.update_state(battery_id, details)

        if not should_send and not force_send:
            logger.info(f"[AlertService] Alert suppressed by deduplication rules ({reason}) for battery {battery_id}.")
            return {"status": "suppressed", "reason": reason, "severity": severity}

        # Build Email Content
        ai_assess = f"System detected {severity} condition for battery {battery_id}. Net V: {total_v:.2f} V, Imbalance: {imbalance_v:.2f} V, Temperature: {temp_c:.1f} °C, Anomaly: {anomaly}."
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
            event_type="ALERT"
        )

        recipient = email_service.default_recipient
        email_sent = email_service.send_email(
            recipient=recipient,
            subject=subject,
            plain_text_body=text_body,
            html_body=html_body
        )

        # Optional SMS alert (Twilio failure won't block Gmail)
        sms_sent = False
        if sms_msg and sms_service.is_configured():
            try:
                sms_sent = sms_service.send_sms(sms_msg)
            except Exception as e:
                logger.warning(f"[AlertService] SMS dispatch failed (ignored): {e}")

        logger.info(f"[AlertService] Dispatched Gmail alert to {recipient} (Success: {email_sent})")

        return {
            "status": "sent" if email_sent else "failed",
            "severity": severity,
            "recipient": recipient,
            "email_sent": email_sent,
            "sms_sent": sms_sent,
            "detected_problem": detected_prob
        }


# Singleton Instance
alert_service = AlertService()
