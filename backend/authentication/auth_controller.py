from pydantic import BaseModel
from fastapi import HTTPException
from .firebase_admin_config import verify_token, get_user_record

class VerifyTokenRequest(BaseModel):
    idToken: str

def handle_verify_google_token(body: VerifyTokenRequest):
    if not body.idToken:
        raise HTTPException(status_code=400, detail="Missing required field: idToken")
    
    try:
        decoded_token = verify_token(body.idToken)
        uid = decoded_token.get('uid')
        user_record = get_user_record(uid)
        
        name = user_record.display_name or decoded_token.get('name') or 'Google User'
        email = user_record.email or decoded_token.get('email') or ''
        photo_url = user_record.photo_url or decoded_token.get('picture') or ''
        
        return {
            "success": True,
            "message": "Google authentication verified successfully via Python REST API",
            "user": {
                "id": uid,
                "name": name,
                "email": email,
                "photoURL": photo_url,
                "emailVerified": user_record.email_verified
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Failed to verify Google authentication token: {str(e)}"
        )
