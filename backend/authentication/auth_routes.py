from fastapi import APIRouter, Depends
from .auth_controller import VerifyTokenRequest, handle_verify_google_token
from .auth_middleware import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/verify-token")
def verify_token_endpoint(body: VerifyTokenRequest):
    return handle_verify_google_token(body)

@router.get("/me")
def get_me_endpoint(current_user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "user": current_user
    }
