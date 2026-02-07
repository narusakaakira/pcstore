from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from pydantic import BaseModel
from app.config import settings

class TokenData(BaseModel):
    """Token payload data"""
    user_id: int
    username: str
    roles: list[str]

class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int

def create_access_token(user_id: int, username: str, roles: list[str]) -> str:
    """
    Create a JWT access token
    
    Args:
        user_id: User ID
        username: Username
        roles: List of role names
        
    Returns:
        Encoded JWT token
    """
    to_encode: Dict[str, Any] = {
        "user_id": user_id,
        "username": username,
        "roles": roles,
        "exp": datetime.utcnow() + timedelta(days=settings.JWT_EXPIRATION_DAYS),
        "iat": datetime.utcnow(),
        "type": "access"
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def verify_token(token: str) -> Optional[TokenData]:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        TokenData if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Verify token type
        if payload.get("type") != "access":
            return None
        
        user_id = payload.get("user_id")
        username = payload.get("username")
        roles = payload.get("roles", [])
        
        if user_id is None or username is None:
            return None
        
        return TokenData(user_id=user_id, username=username, roles=roles)
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    except Exception:
        return None

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode token without validation (for debugging)
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded payload dictionary
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except Exception:
        return None
