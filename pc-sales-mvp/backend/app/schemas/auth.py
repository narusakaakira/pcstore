from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional

class LoginRequest(BaseModel):
    """Login request schema"""
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    password: str = Field(..., min_length=6, description="Password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "johndoe",
                "password": "password123"
            }
        }

class RegisterRequest(BaseModel):
    """User registration request schema"""
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=6, description="Password")
    full_name: Optional[str] = Field(None, max_length=100, description="Full name")
    
    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "johndoe",
                "email": "john@example.com",
                "password": "password123",
                "full_name": "John Doe"
            }
        }

class UserResponse(BaseModel):
    """User response schema"""
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    roles: list[str]
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    """User update schema"""
    full_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    """Password change request schema"""
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)

class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 604800,
                "user": {
                    "id": 1,
                    "username": "johndoe",
                    "email": "john@example.com",
                    "full_name": "John Doe",
                    "avatar_url": None,
                    "is_active": True,
                    "roles": ["USER"]
                }
            }
        }

class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str = Field(..., description="Refresh token")
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }
