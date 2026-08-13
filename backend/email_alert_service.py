import os
import smtplib
import time
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()


# ============================================================
# SMART ALERT TRACKER (Deduplication, Escalation & Recovery)
# ============================================================

class SmartAlertTracker:
    def __init__(self):
        # Maps battery_id -> last_alert_state dict
        # e.g., { "status": "CRITICAL", "severity_level": 3, "timestamp": 1690000000, "cell_voltages": {...} }
        self._states: Dict[str, Dict[str, Any]] = {}
        self._history: List[Dict[str, Any]] = []

    def get_state(self, battery_id: str) -> Optional[Dict[str, Any]]:
        return self._states.get(battery_id)

    def update_state(self, battery_id: str, new_state: Dict[str, Any]):
        self._states[battery_id] = new_state
        self._history.append({
            "battery_id": battery_id,
            "timestamp": datetime.now().isoformat(),
            **new_state
        })
        # Keep last 50 history logs in memory
        if len(self._history) > 50:
            self._history.pop(0)

    def get_history(self) -> List[Dict[str, Any]]:
        return list(reversed(self._history))

    def evaluate_dispatch_necessity(self, battery_id: str, current_severity: str, current_details: Dict[str, Any]) -> tuple[bool, str]:
        """
        Determines if an email should be sent based on smart alerting rules:
        - First detection -> Send email
        - Previous dispatch failed -> Retry sending email
        - Persistent 0V dead cell -> Re-alert every 60s cooldown
        - Condition escalates -> Send escalation email
        - Condition recovers -> Send recovery email
        """
        last_state = self.get_state(battery_id)
        severity_rank = {"NORMAL": 0, "WARNING": 1, "HIGH_RISK": 2, "CRITICAL": 3}

        curr_rank = severity_rank.get(current_severity, 0)

        if not last_state:
            if curr_rank > 0:
                return True, "INITIAL_TRIGGER"
            return False, "NO_ACTION"

        # Retry Rule: If previous alert failed to send via SMTP, retry immediately on new telemetry
        if last_state.get("email_sent") is False and curr_rank > 0:
            return True, "RETRY_PREVIOUS_FAILED_DISPATCH"

        last_rank = severity_rank.get(last_state.get("severity", "NORMAL"), 0)

        # Recovery Rule: previous alert active (WARNING/HIGH/CRITICAL), now returned to NORMAL
        if curr_rank == 0 and last_rank > 0:
            return True, "RECOVERY"

        # Escalation Rule: current severity strictly higher than previous
        if curr_rank > last_rank:
            return True, "ESCALATION"

        # 0V Dead Cell Cooldown Re-Alert Rule (Every 60s for persistent 0V cell)
        curr_min_v = current_details.get("min_voltage", 99.0)
        if current_severity == "CRITICAL" and curr_min_v <= 0.5:
            last_ts = last_state.get("last_dispatch_ts", 0)
            if (time.time() - last_ts) >= 60.0:
                return True, "CRITICAL_0V_PERSISTENT_ALERT"

        # Persistence Rule: same severity level
        if curr_rank == last_rank and curr_rank > 0:
            # Check if affected cell index changed (e.g. Cell 1 was faulty, now Cell 2 is faulty)
            last_weakest = last_state.get("weakest_cell_index")
            curr_weakest = current_details.get("weakest_cell_index")
            if last_weakest and curr_weakest and last_weakest != curr_weakest:
                return True, "DIFFERENT_CELL_FAULT"

            # Check if details worsened significantly (e.g. voltage dropped further by >= 0.2V)
            last_min_v = last_state.get("min_voltage", 99.0)
            if (last_min_v - curr_min_v) >= 0.20:
                return True, "SIGNIFICANT_DETERIORATION"
            
            # Otherwise suppress duplicate email
            return False, "DUPLICATE_SUPPRESSED"

        return False, "NO_ACTION"


# Global Tracker Instance
alert_tracker = SmartAlertTracker()


# ============================================================
# TWILIO SMS ALERT SERVICE
# ============================================================

class SmsAlertService:
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.sms_from = os.getenv("TWILIO_SMS_FROM", "").strip()
        self.sms_to = os.getenv("TWILIO_SMS_TO", "").strip()

    def is_configured(self) -> bool:
        return bool(self.account_sid and self.auth_token and self.sms_from and self.sms_to)

    def send_sms(self, message_body: str) -> bool:
        """Sends an instant SMS alert via Twilio REST API."""
        if not self.is_configured():
            print("[SmsAlertService] Error: Missing Twilio credentials or recipient phone.")
            return False

        try:
            from twilio.rest import Client
            client = Client(self.account_sid, self.auth_token)
            msg = client.messages.create(
                from_=self.sms_from,
                to=self.sms_to,
                body=message_body
            )
            print(f"[SmsAlertService] [OK] SMS alert successfully dispatched! SID: {msg.sid}")
            return True
        except Exception as e:
            err_msg = str(e).split("\n")[0]
            print(f"[SmsAlertService] Twilio SMS alert skipped: {err_msg}")
            return False


sms_service = SmsAlertService()


# ============================================================
# GMAIL / SMTP EMAIL ALERT SERVICE
# ============================================================

class EmailAlertService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.gmail_user = os.getenv("GMAIL_USER", "").strip()
        self.gmail_password = os.getenv("GMAIL_APP_PASSWORD", "").strip().replace(" ", "")
        self.default_recipient = os.getenv("ALERT_RECIPIENT_EMAIL", "").strip()

    def is_configured(self) -> bool:
        return bool(self.gmail_user and self.gmail_password)

    def send_email(
        self,
        recipient: str,
        subject: str,
        plain_text_body: str,
        html_body: str
    ) -> bool:
        """Sends a MIME email using standard Python smtplib with TLS."""
        if not recipient:
            recipient = self.default_recipient

        if not recipient or not self.gmail_user or not self.gmail_password:
            print(f"[EmailAlertService] Error: Missing SMTP credentials or recipient ({recipient}).")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"THE BLACK BOX AI <{self.gmail_user}>"
            msg["To"] = recipient

            part1 = MIMEText(plain_text_body, "plain", "utf-8")
            part2 = MIMEText(html_body, "html", "utf-8")

            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(self.gmail_user, self.gmail_password)
                server.sendmail(self.gmail_user, [recipient], msg.as_string())

            print(f"[EmailAlertService] [OK] Email successfully sent to {recipient}!")
            return True
        except Exception as e:
            print(f"[EmailAlertService] [ERROR] SMTP Error: {e}")
            return False

    def build_alert_content(
        self,
        severity: str,
        battery_id: str,
        battery_name: str,
        health_score: int,
        soh_pct: float,
        overall_risk: str,
        anomaly_score: int,
        cells_data: List[Dict[str, Any]],
        detected_problem: str,
        max_v: float,
        min_v: float,
        imbalance_v: float,
        ai_assessment: str,
        possible_causes: List[str],
        recommended_action: str,
        event_type: str = "ALERT"
    ) -> tuple[str, str, str]:
        """Formats the Subject, Plain Text Body, and HTML Body according to the required template."""
        
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

        # Subject Formatting
        if event_type == "RECOVERY":
            subject = f"🟢 THE BLACK BOX — BATTERY CONDITION RECOVERED: {battery_name}"
        else:
            sev_icon = "🔴" if severity == "CRITICAL" else "🟠" if severity == "HIGH_RISK" else "🟡"
            weakest = min(cells_data, key=lambda c: c.get("voltage", 99.0)) if cells_data else {}
            weakest_str = f"CELL {weakest.get('index', 3)} VOLTAGE {weakest.get('voltage', 1.10):.2f} V" if weakest else ""
            subject = f"{sev_icon} THE BLACK BOX — {severity} BATTERY ALERT: {weakest_str}"

        # Cell List Formatting
        cell_lines_text = []
        cell_rows_html = []

        for cell in cells_data:
            idx = cell.get("index", 1)
            v = cell.get("voltage", 3.60)
            st = cell.get("status", "healthy").upper()
            st_icon = "🔴" if st == "CRITICAL" else "🟡" if st == "WARNING" else "🟢"
            cell_lines_text.append(f"- Cell {idx}: {v:.2f} V — {st}")
            cell_rows_html.append(f"""
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #334155; font-weight: bold;">Cell {idx}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #334155; text-align: right; font-family: monospace; font-size: 14px;">{v:.2f} V</td>
                    <td style="padding: 8px; border-bottom: 1px solid #334155; text-align: right; font-weight: bold;">{st_icon} {st}</td>
                </tr>
            """)

        cells_text_block = "\n".join(cell_lines_text)
        cells_html_block = "".join(cell_rows_html)

        causes_text_block = "\n".join([f"- {c}" for c in possible_causes])
        causes_html_block = "".join([f"<li>{c}</li>" for c in possible_causes])

        # PLAIN TEXT TEMPLATE
        if event_type == "RECOVERY":
            plain_text = f"""THE BLACK BOX — AI BATTERY SAFETY RECOVERY

Status: 🟢 NORMAL RECOVERED

### Battery Status
- Battery Unit: {battery_name} ({battery_id})
- Battery Health: {health_score}/100 — NORMAL
- SOH: {soh_pct:.1f}%
- Overall Risk: LOW

Cell 3 voltage and pack cell imbalance have returned to configured safe operating bounds.

Previous Status: {severity}
Current Status: NORMAL

Timestamp: {now_str}
THE BLACK BOX — SENSE → ANALYZE → DETECT → PREDICT → ALERT → PREVENT
"""
        else:
            sev_badge = "🔴 CRITICAL" if severity == "CRITICAL" else "🟠 HIGH RISK" if severity == "HIGH_RISK" else "🟡 WARNING"
            plain_text = f"""THE BLACK BOX — AI BATTERY SAFETY ALERT

Severity: {sev_badge}

### Battery Status
- Battery Unit: {battery_name} ({battery_id})
- Battery Health: {health_score}/100
- SOH: {soh_pct:.1f}%
- Overall Risk: {overall_risk}
- Anomaly Score: {anomaly_score}/100

### Cell Status
{cells_text_block}

### Detected Problem
{detected_problem}
Maximum cell voltage: {max_v:.2f} V
Minimum cell voltage: {min_v:.2f} V
Cell imbalance: {imbalance_v:.2f} V

### AI Assessment
{ai_assessment}

Possible causes include:
{causes_text_block}

### Recommended Action
{recommended_action}

### Important
This alert was generated automatically by THE BLACK BOX AI battery monitoring engine.

Timestamp: {now_str}
THE BLACK BOX — SENSE → ANALYZE → DETECT → PREDICT → ALERT → PREVENT
"""

        # RICH HTML EMAIL TEMPLATE
        bg_color = "#0f172a"
        card_border = "#ef4444" if severity == "CRITICAL" else "#f59e0b" if severity == "WARNING" else "#22d3ee"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: {bg_color}; border: 2px solid {card_border}; border-radius: 16px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }}
            .header {{ text-align: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px; }}
            .title {{ font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px; margin: 0; }}
            .badge {{ display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 800; text-transform: uppercase; margin-top: 8px; }}
            .badge-critical {{ background-color: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }}
            .badge-warning {{ background-color: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b; }}
            .badge-recovery {{ background-color: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; }}
            .section-title {{ font-size: 13px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-top: 20px; margin-bottom: 8px; }}
            .metric-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }}
            .metric-card {{ background-color: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 12px; text-align: center; }}
            .metric-val {{ font-size: 18px; font-weight: 900; color: #ffffff; margin-top: 4px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
            .alert-box {{ background-color: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 12px; padding: 16px; margin-top: 20px; font-size: 13px; line-height: 1.6; }}
            .footer {{ text-align: center; border-top: 1px solid #334155; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #64748b; font-weight: bold; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">🔋 THE BLACK BOX — AI BATTERY ALERT</h1>
              <div class="badge {'badge-recovery' if event_type == 'RECOVERY' else 'badge-critical' if severity == 'CRITICAL' else 'badge-warning'}">
                {'🟢 RECOVERY' if event_type == 'RECOVERY' else f'🔴 {severity}'}
              </div>
            </div>

            <div class="section-title">Battery Summary</div>
            <div class="metric-grid">
              <div class="metric-card">
                <div style="font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">Battery Health</div>
                <div class="metric-val">{health_score} / 100</div>
              </div>
              <div class="metric-card">
                <div style="font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">State of Health (SOH)</div>
                <div class="metric-val">{soh_pct:.1f}%</div>
              </div>
            </div>

            <div class="section-title">Cell Status</div>
            <table>
              <thead>
                <tr style="background-color: #1e293b; color: #94a3b8; font-size: 11px; text-transform: uppercase;">
                  <th style="padding: 8px; text-align: left;">Cell</th>
                  <th style="padding: 8px; text-align: right;">Voltage</th>
                  <th style="padding: 8px; text-align: right;">Status</th>
                </tr>
              </thead>
              <tbody>
                {cells_html_block}
              </tbody>
            </table>

            <div class="section-title">Detected Issue</div>
            <p style="font-size: 13px; color: #cbd5e1; margin-top: 4px; line-height: 1.5;">
              {detected_problem}
              <br><br>
              <strong>Max Voltage:</strong> {max_v:.2f} V &nbsp;|&nbsp; <strong>Min Voltage:</strong> {min_v:.2f} V &nbsp;|&nbsp; <strong style="color: #ef4444;">Imbalance:</strong> {imbalance_v:.2f} V
            </p>

            <div class="section-title">AI Pattern Assessment</div>
            <p style="font-size: 13px; color: #cbd5e1; margin-top: 4px; line-height: 1.5;">
              {ai_assessment}
            </p>
            <ul style="font-size: 12px; color: #94a3b8; margin-top: 6px; padding-left: 20px;">
              {causes_html_block}
            </ul>

            <div class="alert-box">
              <strong style="color: #ef4444; text-transform: uppercase; letter-spacing: 0.5px;">Recommended Action Protocol:</strong>
              <p style="margin: 6px 0 0 0; color: #ffffff; font-weight: bold;">
                {recommended_action}
              </p>
            </div>

            <div class="footer">
              Generated automatically by THE BLACK BOX Battery Monitoring Engine<br>
              Timestamp: {now_str}<br><br>
              <strong>SENSE → ANALYZE → DETECT → PREDICT → ALERT → PREVENT</strong>
            </div>
          </div>
        </body>
        </html>
        """

        return subject, plain_text, html_body


# Global Email Alert Service Instance
email_service = EmailAlertService()
