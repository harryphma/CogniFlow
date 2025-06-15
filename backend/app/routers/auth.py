from fastapi import APIRouter, HTTPException, Depends, Request
from app.utils.auth_utils import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

@router.get("/validate")
async def validate_token(current_user = Depends(get_current_user)):
    """Endpoint to validate authentication token"""
    return {"valid": True, "user_id": current_user.id}

@router.get("/me")
async def get_user_info(current_user = Depends(get_current_user)):
    """Return current user information"""
    return {
        "id": current_user.user.id,
        "email": current_user.user.email,
        "user_metadata": current_user.user.user_metadata
    }