from fastapi import Request, HTTPException, status
from typing import Callable, List
from app.utils.auth_utils import get_current_user
import re

class AuthMiddleware:
    def __init__(self, public_paths: List[str] = None):
        self.public_paths = public_paths or []
        # Compile regex patterns for public paths
        self.public_patterns = [re.compile(pattern) for pattern in self.public_paths]
    
    async def __call__(self, request: Request, call_next: Callable):
        # Check if path is public
        path = request.url.path
        if self._is_public_path(path):
            return await call_next(request)
            
        # For protected paths, validate authentication
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                    headers={"WWW-Authenticate": "Bearer"},
                )
                
            token = auth_header.replace('Bearer ', '')
            # Store the token in request state for use in endpoints
            request.state.token = token
            # This would normally verify the token, but we'll do that in the endpoint handlers
            
            return await call_next(request)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication error: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def _is_public_path(self, path: str) -> bool:
        """Check if the given path is public"""
        return any(pattern.match(path) for pattern in self.public_patterns)