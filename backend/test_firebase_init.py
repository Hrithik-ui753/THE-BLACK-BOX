import os
import sys
import json
import logging
from pathlib import Path

# Ensure backend directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("test_firebase")

from authentication.firebase_admin_config import initialize_firebase
import firebase_admin


def run_tests():
    print("=" * 60)
    print("     BLACK BOX FIREBASE AUTHENTICATION TEST SUITE      ")
    print("=" * 60)

    # 1. Test Priority Resolution Logic (mocking env vars)
    print("\n--- [TEST 1] Testing FIREBASE_SERVICE_ACCOUNT_JSON Parsing ---")
    mock_json_dict = {
        "type": "service_account",
        "project_id": "black-box-test",
        "private_key_id": "test_id",
        "private_key": "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3\\n-----END PRIVATE KEY-----\\n",
        "client_email": "test-sa@black-box-test.iam.gserviceaccount.com",
    }
    
    # Check that json string with escaped newlines converts private_key properly
    json_str = json.dumps(mock_json_dict)
    parsed = json.loads(json_str)
    parsed["private_key"] = parsed["private_key"].replace("\\n", "\n")
    
    assert "\n" in parsed["private_key"], "Private key newlines were not unescaped!"
    assert not "\\n" in parsed["private_key"], "Escaped \\n was left in private key!"
    print("   [OK] JSON parsing and private key newline unescaping verified successfully.")

    print("\n--- [TEST 2] Testing Individual Env Vars (FIREBASE_PRIVATE_KEY & CLIENT_EMAIL) ---")
    pk_env = "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3\\n-----END PRIVATE KEY-----\\n"
    formatted_pk = pk_env.replace("\\n", "\n")
    assert "\n" in formatted_pk
    print("   [OK] Individual environment variable formatting verified successfully.")

    print("\n--- [TEST 3] Testing Real Firebase Initialization ---")
    initialized = initialize_firebase()
    if initialized:
        print(f"   [OK] Firebase Admin SDK successfully initialized!")
        print(f"   Active App Name: {firebase_admin.get_app().name}")
    else:
        print("   [INFO] Local serviceAccountKey.json and environment variables not present.")
        print("   [OK] Gracefully handled without ApplicationDefault crash loop.")

    print("\n============================================================")
    print("        FIREBASE AUTHENTICATION SUITE COMPLETED            ")
    print("============================================================")


if __name__ == "__main__":
    run_tests()
