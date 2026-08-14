import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

# Load environment variables from backend/.env
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

DEFAULT_BATTERY_ID = os.getenv("DEFAULT_BATTERY_ID", "164de9f0-62ee-411a-b8b9-a73eb2406f97")

# Firebase configuration
FIREBASE_DATABASE_URL = os.getenv(
    "FIREBASE_DATABASE_URL", 
    "https://black-box-9aa5e-default-rtdb.firebaseio.com/"
)
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "black-box-9aa5e")

# Service Account Key search paths
SERVICE_ACCOUNT_PATHS = [
    BASE_DIR / "authentication" / "serviceAccountKey.json",
    BASE_DIR / "serviceAccountKey.json",
    PROJECT_ROOT / "ML" / "firebase" / "serviceAccountKey.json"
]

def get_service_account_path() -> str:
    for path in SERVICE_ACCOUNT_PATHS:
        if path.exists():
            return str(path)
    return str(SERVICE_ACCOUNT_PATHS[0])

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://umfifxbyykzxzodocgtm.supabase.co")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SECRET_KEY")
    or os.getenv("SUPABASE_KEY")
    or ""
)

# Azure OpenAI configuration
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4.1-mini")

# ML Model Paths
ML_DIR = PROJECT_ROOT / "ML" / "models"
SOC_MODEL_PATH = str(ML_DIR / "soc" / "soc_model.joblib")
SOH_MODEL_PATH = str(ML_DIR / "soh" / "soh_model.joblib")
RUL_MODEL_PATH = str(ML_DIR / "rul" / "rul_model.joblib")
ANOMALY_MODEL_PATH = str(ML_DIR / "anomaly" / "anomaly_model.joblib")
ANOMALY_ENCODER_PATH = str(ML_DIR / "anomaly" / "anomaly_label_encoder.joblib")

# Polling Interval for live telemetry background reader
POLL_INTERVAL_SECONDS = float(os.getenv("POLL_INTERVAL_SECONDS", "3.0"))

# Cell Presence Validation Threshold (V)
CELL_ABSENT_THRESHOLD = float(os.getenv("CELL_ABSENT_THRESHOLD", "0.15"))

