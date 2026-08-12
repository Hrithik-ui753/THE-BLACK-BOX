import json
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, db

BASE_DIR = Path(__file__).resolve().parent

DATABASE_URL = "https://black-box-24537-default-rtdb.firebaseio.com/"
SERVICE_ACCOUNT = BASE_DIR / "serviceAccountKey.json"

print("Database URL:", DATABASE_URL)
print("Service account:", SERVICE_ACCOUNT)

if not SERVICE_ACCOUNT.exists():
    raise FileNotFoundError(
        f"serviceAccountKey.json not found at:\n{SERVICE_ACCOUNT}"
    )

cred = credentials.Certificate(str(SERVICE_ACCOUNT))

if not firebase_admin._apps:
    firebase_admin.initialize_app(
        cred,
        {
            "databaseURL": DATABASE_URL
        }
    )

print("\nFIREBASE CONNECTED ✅")

# Read Firebase root temporarily
data = db.reference("/").get()

print("\n===== FIREBASE DATA =====")
print(json.dumps(data, indent=2))