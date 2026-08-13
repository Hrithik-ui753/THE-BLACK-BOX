import os
import sys
import time
import asyncio
import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import POLL_INTERVAL_SECONDS, DEFAULT_BATTERY_ID
from authentication.auth_routes import router as auth_router
from authentication.firebase_admin_config import initialize_firebase

from alert_routes import router as alert_router
from chat_routes import router as chat_router
from supabase_routes import router as supabase_router

from routes.telemetry_routes import router as telemetry_router
from routes.battery_routes import router as battery_router
from routes.prediction_routes import router as prediction_router
from routes.analytics_routes import router as analytics_router
from routes.ai_routes import router as ai_router

from services.prediction_service import prediction_service
from services.ml_service import ml_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

load_dotenv()

# Initialize Firebase Admin SDK
logger.info("[Startup] Initializing Firebase Admin SDK...")
initialize_firebase()

# Warm up ML models at startup
logger.info("[Startup] Loading ML models into memory...")
ml_service.load_models()

app = FastAPI(
    title="THE BLACK BOX - Battery Intelligence REST API",
    description="FastAPI backend powering live telemetry processing, feature engineering, ML models, Supabase storage, Azure OpenAI chatbot, and Gmail alerts.",
    version="2.0.0"
)

# CORS Configuration
client_origin = os.getenv("CLIENT_ORIGIN", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[client_origin, "http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router)
app.include_router(telemetry_router)
app.include_router(battery_router)
app.include_router(prediction_router)
app.include_router(analytics_router)
app.include_router(alert_router)
app.include_router(chat_router)
app.include_router(ai_router)
app.include_router(supabase_router)


from services.firebase_service import firebase_service


async def background_firebase_polling_loop():
    """
    Non-blocking background worker loop:
    Polls Firebase Realtime Database every 2-5 seconds for new telemetry readings,
    calculates derived features, runs ML models, stores records in Supabase, and evaluates alerts.
    """
    if not firebase_service.initialized:
        logger.warning("[Background Task] Firebase Admin SDK is not initialized. Live RTDB polling suspended.")
        return

    logger.info(f"[Background Task] Started live Firebase polling loop (Interval: {POLL_INTERVAL_SECONDS}s)...")
    while True:
        try:
            prediction_service.poll_and_process_firebase(battery_id=DEFAULT_BATTERY_ID)
        except Exception as e:
            logger.error(f"[Background Task] Firebase polling error: {e}")
        await asyncio.sleep(POLL_INTERVAL_SECONDS)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(background_firebase_polling_loop())


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "techstack": "Python REST API (FastAPI)",
        "project": "black-box-24537",
        "firebase_sdk": "python-firebase-admin",
        "ml_service": "loaded" if ml_service.loaded else "error",
        "supabase_connected": True
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
