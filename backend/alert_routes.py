from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from email_alert_service import email_service, alert_tracker

router = APIRouter(prefix="/api/alerts", tags=["Gmail Battery Alerts"])


class CellItem(BaseModel):
    index: int = 1
    voltage: float = 3.60
    temperature: float = 38.0
    status: str = "healthy"


class TelemetryAlertPayload(BaseModel):
    battery_id: str = "battery-01"
    battery_name: str = "Battery Pack 01"
    health_score: int = 46
    soh_pct: float = 76.0
    overall_risk: str = "CRITICAL"
    anomaly_score: int = 94
    temperature: float = 48.0
    rise_rate: float = 2.1
    cells: List[CellItem] = []
    recipient_email: Optional[str] = None
    force_send: bool = False


class TestEmailPayload(BaseModel):
    recipient_email: Optional[str] = None


@router.get("/config")
def get_alert_config():
    """Returns the current Gmail alert configuration status."""
    return {
        "status": "ok",
        "gmail_configured": email_service.is_configured(),
        "smtp_host": email_service.smtp_host,
        "smtp_port": email_service.smtp_port,
        "gmail_user": email_service.gmail_user if email_service.gmail_user else "Not set",
        "default_recipient": email_service.default_recipient if email_service.default_recipient else "Not set",
    }


@router.get("/history")
def get_alert_history():
    """Returns the historical list of dispatched and suppressed alerts."""
    return {
        "status": "ok",
        "history": alert_tracker.get_history()
    }


@router.post("/test-gmail")
def send_test_gmail(payload: TestEmailPayload):
    """Sends an instant test Gmail alert to verify configuration."""
    target_email = payload.recipient_email or email_service.default_recipient

    if not email_service.is_configured():
        raise HTTPException(
            status_code=400,
            detail="Gmail SMTP credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env"
        )

    test_cells = [
        {"index": 1, "voltage": 3.60, "status": "healthy"},
        {"index": 2, "voltage": 3.60, "status": "healthy"},
        {"index": 3, "voltage": 1.10, "status": "critical"}
    ]

    subject, text_body, html_body = email_service.build_alert_content(
        severity="CRITICAL",
        battery_id="battery-01",
        battery_name="Test Pack (Verification)",
        health_score=46,
        soh_pct=76.0,
        overall_risk="CRITICAL",
        anomaly_score=94,
        cells_data=test_cells,
        detected_problem="[TEST EMAIL] Cell 3 voltage is 1.10 V (2.50 V Imbalance). Verification of SMTP delivery.",
        max_v=3.60,
        min_v=1.10,
        imbalance_v=2.50,
        ai_assessment="This is a test notification sent to verify Gmail SMTP configuration for THE BLACK BOX AI BMS.",
        possible_causes=["Verification of SMTP service", "Hardware diagnostic simulation"],
        recommended_action="No action required. This is a system verification test email.",
        event_type="ALERT"
    )

    success = email_service.send_email(
        recipient=target_email,
        subject=subject,
        plain_text_body=text_body,
        html_body=html_body
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send test email via Gmail SMTP server.")

    return {
        "status": "success",
        "message": f"Test Gmail alert successfully delivered to {target_email}!",
        "recipient": target_email
    }


@router.post("/send-email")
def evaluate_and_send_alert(payload: TelemetryAlertPayload):
    """Evaluates telemetry payload, determines severity rules, checks deduplication, and sends alert email."""
    cells_list = [c.dict() for c in payload.cells] if payload.cells else [
        {"index": 1, "voltage": 3.60, "status": "healthy"},
        {"index": 2, "voltage": 3.60, "status": "healthy"},
        {"index": 3, "voltage": 1.10, "status": "critical"}
    ]

    voltages = [float(c.get("voltage", 3.60)) for c in cells_list] if cells_list else [3.60, 3.60, 1.10]
    max_v = max(voltages)
    min_v = min(voltages)
    imbalance_v = max_v - min_v
    net_pack_v = sum(voltages)

    # Dead battery and cell rules
    zero_cells = [c for c in cells_list if float(c.get("voltage", 3.60)) <= 0.5]
    is_entire_pack_dead = net_pack_v <= 1.0 or (len(voltages) == 3 and all(v <= 0.5 for v in voltages))
    is_low_net_v = net_pack_v < 7.5
    is_healthy_net_v = net_pack_v >= 11.0 and min_v >= 2.80 and imbalance_v <= 0.20

    # Determine Severity & Specific Issue Texts
    if is_entire_pack_dead:
        severity = "CRITICAL"
        detected_prob = f"🚨 DEAD BATTERY PACK: Net voltage is {net_pack_v:.2f} V (0.0 V / depleted). All cells are drained/dead!"
        rec_action = "IMMEDIATELY ISOLATE DEAD PACK. Inspect cells for physical damage or deep discharge state before recharging."
    elif zero_cells:
        severity = "CRITICAL"
        zero_indices = [str(c.get("index", 1)) for c in zero_cells]
        detected_prob = f"🚨 CRITICAL CELL FAILURE: Cell(s) {', '.join(zero_indices)} voltage is 0.0 V (0V / depleted). Replace Cell(s) {', '.join(zero_indices)} immediately!"
        rec_action = f"Isolate battery pack and REPLACE Cell(s) {', '.join(zero_indices)} before operating!"
    elif is_low_net_v:
        severity = "CRITICAL"
        detected_prob = f"⚠️ CRITICAL LOW VOLTAGE: Battery net pack voltage ({net_pack_v:.2f} V < 7.5 V) is depleted. Needs immediate recharge and inspection!"
        rec_action = "Connect pack to charger immediately and check individual cell health before applying load."
    elif min_v < 2.80 or imbalance_v > 0.20 or payload.temperature > 55.0 or payload.anomaly_score >= 76:
        severity = "CRITICAL"
        weakest = min(cells_list, key=lambda c: c.get("voltage", 99.0))
        detected_prob = f"Cell {weakest.get('index', 3)} is operating at {min_v:.2f} V, producing a {imbalance_v:.2f} V pack imbalance."
        rec_action = f"Verify voltage measurement immediately. If confirmed, stop normal operation and inspect/isolate Cell {weakest.get('index', 3)}."
    elif imbalance_v > 0.10 or payload.temperature > 45.0 or payload.anomaly_score >= 51:
        severity = "HIGH_RISK"
        detected_prob = f"Cell imbalance elevated to {imbalance_v:.2f} V with temp {payload.temperature:.1f} °C."
        rec_action = "Monitor cell balance and reduce heavy load to allow passive thermal equalization."
    elif payload.health_score < 75 or payload.soh_pct < 80.0:
        severity = "WARNING"
        detected_prob = f"Battery State of Health (SOH) dropped to {payload.soh_pct:.1f}%."
        rec_action = "Schedule maintenance check to assess capacity degradation."
    elif is_healthy_net_v:
        severity = "NORMAL"
        detected_prob = f"🟢 HEALTHY: Battery pack net voltage is {net_pack_v:.2f} V (>= 11.0 V). Operating within optimal parameters."
        rec_action = "No action required. Battery pack operating normally."
    else:
        severity = "NORMAL"
        detected_prob = f"Battery pack operating at {net_pack_v:.2f} V."
        rec_action = "Continue standard monitoring."

    details = {
        "severity": severity,
        "min_voltage": min_v,
        "imbalance_v": imbalance_v,
        "temperature": payload.temperature,
        "health_score": payload.health_score
    }

    # Evaluate Smart Alert Deduplication
    if payload.force_send:
        should_send = True
        reason = "FORCE_SEND"
    else:
        should_send, reason = alert_tracker.evaluate_dispatch_necessity(
            battery_id=payload.battery_id,
            current_severity=severity,
            current_details=details
        )

    # Always update tracker state
    alert_tracker.update_state(payload.battery_id, details)

    if not should_send:
        return {
            "status": "suppressed",
            "reason": reason,
            "severity": severity,
            "message": f"Alert email suppressed according to smart deduplication rules ({reason})."
        }

    # Build Content & Dispatch Email
    event_type = "RECOVERY" if reason == "RECOVERY" else "ALERT"

    ai_assess = f"The system detected {severity} condition for battery {payload.battery_name} ({payload.battery_id}). Net Pack Voltage: {net_pack_v:.2f} V, Max Imbalance: {imbalance_v:.2f} V."
    possible_causes = [
        "Cell degradation or internal resistance deviation",
        "Abnormal self-discharge under load",
        "Deep discharge or low state of charge",
        "Physical cell damage or connection fault",
        "Sensor or BMS measurement drift"
    ]

    subject, text_body, html_body = email_service.build_alert_content(
        severity=severity,
        battery_id=payload.battery_id,
        battery_name=payload.battery_name,
        health_score=payload.health_score,
        soh_pct=payload.soh_pct,
        overall_risk=payload.overall_risk,
        anomaly_score=payload.anomaly_score,
        cells_data=cells_list,
        detected_problem=detected_prob,
        max_v=max_v,
        min_v=min_v,
        imbalance_v=imbalance_v,
        ai_assessment=ai_assess,
        possible_causes=possible_causes,
        recommended_action=rec_action,
        event_type=event_type
    )

    target_email = payload.recipient_email or email_service.default_recipient

    sent = email_service.send_email(
        recipient=target_email,
        subject=subject,
        plain_text_body=text_body,
        html_body=html_body
    )

    import time
    details["email_sent"] = sent
    details["last_dispatch_ts"] = time.time()
    alert_tracker.update_state(payload.battery_id, details)

    return {
        "status": "sent" if sent else "recorded",
        "reason": reason,
        "severity": severity,
        "recipient_email": target_email,
        "email_sent": sent,
        "message": f"Gmail Email Alert successfully dispatched to {target_email}!" if sent else f"Alert event recorded in database history."
    }
