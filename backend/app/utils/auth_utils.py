from fastapi import Depends, HTTPException, status, Request, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from typing import Optional
import os
from supabase import create_client, Client

from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Security utilities
security = HTTPBearer()

async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Extract the JWT token
        token = credentials.credentials
        
        # Verify token with Supabase
        # This uses JWT verification with Supabase's JWT secret
        # For production, retrieve the user data from Supabase
        user = supabase.auth.get_user(token)
        
        if user is None:
            raise credentials_exception
            
        return user
    except JWTError:
        raise credentials_exception

async def get_optional_user(authorization: Optional[str] = Header(None)):
    """Optional authentication - doesn't require auth but provides user if available"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        if user and user.user:
            return user.user
        return None
    except Exception:
        return None