import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")

SMS_FROM = os.getenv("TWILIO_SMS_FROM")
SMS_TO = os.getenv("TWILIO_SMS_TO")

client = Client(ACCOUNT_SID, AUTH_TOKEN)

message = client.messages.create(
    from_=SMS_FROM,
    to=SMS_TO,
    body="""🚨 THE BLACK BOX - CRITICAL ALERT

Cell 3: 1.10 V 🔴
Cell Imbalance: 2.50 V
Temperature: 48.0°C
Battery Health: 46/100
SOH: 76%
AI Anomaly: 94/100

⚠️ Severe cell voltage deviation detected.

ACTION:
Verify Cell 3 and inspect/isolate according to battery safety procedures.

THE BLACK BOX
SENSE → ANALYZE → DETECT → PREDICT → ALERT"""
)

print("✅ SMS SENT")
print("Message SID:", message.sid)