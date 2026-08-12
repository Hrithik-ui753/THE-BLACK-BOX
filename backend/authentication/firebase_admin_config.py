import os
import firebase_admin
from firebase_admin import credentials, auth

def initialize_firebase():
    if not firebase_admin._apps:
        database_url = os.getenv('FIREBASE_DATABASE_URL', 'https://black-box-24537-default-rtdb.firebaseio.com/')
        project_id = os.getenv('FIREBASE_PROJECT_ID', 'black-box-24537')

        private_key = os.getenv("FIREBASE_PRIVATE_KEY")
        client_email = os.getenv("FIREBASE_CLIENT_EMAIL")

        if private_key and client_email:
            formatted_pk = private_key.replace("\\n", "\n")
            cred_dict = {
                "type": "service_account",
                "project_id": project_id,
                "private_key": formatted_pk,
                "client_email": client_email,
            }
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred, {
                'projectId': project_id,
                'databaseURL': database_url
            })
            print(f"[Firebase Admin Python] Initialized with environment variables for project: {project_id}")
        else:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            key_path = os.path.join(current_dir, 'serviceAccountKey.json')
            if os.path.exists(key_path):
                cred = credentials.Certificate(key_path)
                firebase_admin.initialize_app(cred, {
                    'projectId': project_id,
                    'databaseURL': database_url
                })
                print(f"[Firebase Admin Python] Initialized with serviceAccountKey.json for project: {project_id} at {database_url}")
            else:
                cred = credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred, {
                    'projectId': project_id,
                    'databaseURL': database_url
                })
                print(f"[Firebase Admin Python] Initialized with Application Default Credentials for project: {project_id}")

def verify_token(id_token: str):
    initialize_firebase()
    return auth.verify_id_token(id_token)

def get_user_record(uid: str):
    initialize_firebase()
    return auth.get_user(uid)
