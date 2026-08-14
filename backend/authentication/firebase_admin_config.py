import os
import json
import logging
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, auth

from config import get_service_account_path, FIREBASE_DATABASE_URL, FIREBASE_PROJECT_ID

logger = logging.getLogger("firebase_admin_config")

_firebase_initialized = False


def log_startup_diagnostics():
    """Logs the presence/absence of Firebase environment variables without exposing secret values."""
    sa_json_env = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    creds_env = os.getenv("FIREBASE_CREDENTIALS")
    pk_env = os.getenv("FIREBASE_PRIVATE_KEY")
    email_env = os.getenv("FIREBASE_CLIENT_EMAIL")
    gac_env = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

    local_key_path = get_service_account_path()
    local_file_exists = Path(local_key_path).exists()

    logger.info("[FirebaseAdmin] Environment variables status:")
    logger.info(f"  FIREBASE_SERVICE_ACCOUNT_JSON present: {bool(sa_json_env)}")
    logger.info(f"  FIREBASE_CREDENTIALS present: {bool(creds_env)}")
    logger.info(f"  FIREBASE_PRIVATE_KEY present: {bool(pk_env)}")
    logger.info(f"  FIREBASE_CLIENT_EMAIL present: {bool(email_env)}")
    logger.info(f"  GOOGLE_APPLICATION_CREDENTIALS present: {bool(gac_env)}")
    logger.info(f"  local serviceAccountKey.json file present: {local_file_exists}")


def initialize_firebase() -> bool:
    """
    Authoritative single Firebase Admin SDK initialization routine.
    Priority order:
    1. FIREBASE_SERVICE_ACCOUNT_JSON environment variable (full JSON string)
    2. FIREBASE_CREDENTIALS environment variable (full JSON string)
    3. Individual environment variables (FIREBASE_PRIVATE_KEY & FIREBASE_CLIENT_EMAIL)
    4. Local serviceAccountKey.json file when running locally
    5. GOOGLE_APPLICATION_CREDENTIALS file path if present on disk

    Do NOT fall back to credentials.ApplicationDefault() or google.auth.default().
    """
    global _firebase_initialized

    if firebase_admin._apps:
        _firebase_initialized = True
        return True

    log_startup_diagnostics()

    database_url = os.getenv("FIREBASE_DATABASE_URL", FIREBASE_DATABASE_URL)
    project_id = os.getenv("FIREBASE_PROJECT_ID", FIREBASE_PROJECT_ID)

    cred = None
    cred_source = ""

    # Priority 1 & 2: FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_CREDENTIALS (complete JSON string)
    json_env = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON") or os.getenv("FIREBASE_CREDENTIALS")
    if json_env:
        try:
            json_str = json_env.strip()
            if (json_str.startswith('"') and json_str.endswith('"')) or (json_str.startswith("'") and json_str.endswith("'")):
                json_str = json_str[1:-1]
            service_account_info = json.loads(json_str)
            if isinstance(service_account_info, dict):
                if "private_key" in service_account_info and isinstance(service_account_info["private_key"], str):
                    service_account_info["private_key"] = service_account_info["private_key"].replace("\\n", "\n")
                cred = credentials.Certificate(service_account_info)
                var_name = "FIREBASE_SERVICE_ACCOUNT_JSON" if os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON") else "FIREBASE_CREDENTIALS"
                cred_source = f"environment variable ({var_name})"
            else:
                logger.error("[FirebaseAdmin] Environment JSON variable is not a valid JSON dictionary object.")
        except Exception as e:
            logger.error(f"[FirebaseAdmin] Failed to parse JSON environment variable: {e}")

    # Priority 3: Individual environment variables (FIREBASE_PRIVATE_KEY & FIREBASE_CLIENT_EMAIL)
    if not cred:
        private_key = os.getenv("FIREBASE_PRIVATE_KEY")
        client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
        if private_key and client_email:
            try:
                pk_clean = private_key.strip()
                if (pk_clean.startswith('"') and pk_clean.endswith('"')) or (pk_clean.startswith("'") and pk_clean.endswith("'")):
                    pk_clean = pk_clean[1:-1]
                formatted_pk = pk_clean.replace("\\n", "\n")
                cred_dict = {
                    "type": "service_account",
                    "project_id": project_id,
                    "private_key": formatted_pk,
                    "client_email": client_email.strip(),
                }
                cred = credentials.Certificate(cred_dict)
                cred_source = "individual environment variables (FIREBASE_PRIVATE_KEY & FIREBASE_CLIENT_EMAIL)"
            except Exception as e:
                logger.error(f"[FirebaseAdmin] Failed to create certificate from individual environment variables: {e}")

    # Priority 4: Local serviceAccountKey.json file when running locally
    if not cred:
        try:
            key_path = get_service_account_path()
            if Path(key_path).exists():
                file_content = Path(key_path).read_text(encoding="utf-8")
                key_dict = json.loads(file_content)
                if isinstance(key_dict, dict) and "project_info" in key_dict:
                    proj_info = key_dict["project_info"]
                    if "firebase_url" in proj_info:
                        database_url = proj_info["firebase_url"]
                    if "project_id" in proj_info:
                        project_id = proj_info["project_id"]
                    logger.info(f"[FirebaseAdmin] Extracted RTDB URL '{database_url}' and Project ID '{project_id}' from local key file.")

                if isinstance(key_dict, dict) and key_dict.get("type") == "service_account":
                    cred = credentials.Certificate(key_path)
                    cred_source = f"local serviceAccountKey.json file at '{key_path}'"
                else:
                    logger.info(f"[FirebaseAdmin] Local file at '{key_path}' contains client configuration for project '{project_id}'.")
        except Exception as e:
            logger.warning(f"[FirebaseAdmin] Could not load certificate from local key file: {e}")

    # Priority 5: GOOGLE_APPLICATION_CREDENTIALS file path if present on disk
    if not cred:
        gac_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if gac_path and Path(gac_path).exists():
            try:
                cred = credentials.Certificate(gac_path)
                cred_source = f"GOOGLE_APPLICATION_CREDENTIALS file at '{gac_path}'"
            except Exception as e:
                logger.warning(f"[FirebaseAdmin] Could not load certificate from GOOGLE_APPLICATION_CREDENTIALS: {e}")

    # Initialization
    if cred:
        try:
            firebase_admin.initialize_app(cred, {
                'projectId': project_id,
                'databaseURL': database_url
            })
            logger.info(f"[FirebaseAdmin] Credential source selected: {cred_source}")
            logger.info(f"[FirebaseAdmin] Firebase initialized successfully for project: {project_id}.")
            _firebase_initialized = True
            return True
        except Exception as e:
            logger.error(f"[FirebaseAdmin] Error initializing firebase_admin App: {e}")
            _firebase_initialized = False
            return False
    else:
        logger.error("[FirebaseAdmin] Service account key file not found locally and environment variables not set.")
        logger.error("[FirebaseAdmin] Live Firebase RTDB polling and Admin token authentication will be suspended.")
        _firebase_initialized = False
        return False


def verify_token(id_token: str):
    if not firebase_admin._apps:
        if not initialize_firebase():
            raise RuntimeError("Firebase Admin SDK is not initialized. Check server environment variables.")
    return auth.verify_id_token(id_token)


def get_user_record(uid: str):
    if not firebase_admin._apps:
        if not initialize_firebase():
            raise RuntimeError("Firebase Admin SDK is not initialized. Check server environment variables.")
    return auth.get_user(uid)
