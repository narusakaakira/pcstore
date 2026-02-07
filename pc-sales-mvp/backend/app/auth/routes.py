from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Role, UserRole
from app.auth import (
    create_access_token,
    hash_password,
    verify_password,
    TokenResponse,
)
from app.middleware import get_current_user as get_current_user_dep, get_current_user_roles
from app.schemas import LoginRequest, RegisterRequest, UserResponse, TokenResponse as TokenSchema
from app.config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])

def get_user_roles(user: User) -> list[str]:
    """Extract role names from user"""
    return get_current_user_roles(user)

@router.post("/register", response_model=TokenSchema, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user
    
    Returns:
        Token response with user details
    """
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.username == request.username) | (User.email == request.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Create new user
    new_user = User(
        username=request.username,
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        is_active=True
    )
    
    db.add(new_user)
    db.flush()  # Get the user ID
    
    # Assign USER role by default
    user_role = db.query(Role).filter(Role.name == "USER").first()
    if not user_role:
        # Create USER role if it doesn't exist
        user_role = Role(name="USER", description="Regular user role")
        db.add(user_role)
        db.flush()
    
    user_role_assignment = UserRole(user_id=new_user.id, role_id=user_role.id)
    db.add(user_role_assignment)
    db.commit()
    db.refresh(new_user)
    
    # Create token
    roles = get_user_roles(new_user)
    access_token = create_access_token(new_user.id, new_user.username, roles)
    
    user_data = UserResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        avatar_url=new_user.avatar_url,
        is_active=new_user.is_active,
        roles=roles
    )
    
    return TokenSchema(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_EXPIRATION_DAYS * 24 * 3600,
        user=user_data
    )

@router.post("/login", response_model=TokenSchema)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login with username and password
    
    Returns:
        Token response with user details
    """
    # Find user by username
    user = db.query(User).filter(User.username == request.username).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Get user roles
    roles = get_user_roles(user)
    
    # Create token
    access_token = create_access_token(user.id, user.username, roles)
    
    user_data = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        roles=roles
    )
    
    return TokenSchema(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_EXPIRATION_DAYS * 24 * 3600,
        user=user_data
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user(user: User = Depends(get_current_user_dep)):
    """Get current authenticated user"""
    roles = get_user_roles(user)

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        roles=roles
    )

@router.post("/logout")
async def logout():
    """
    Logout user (client should remove token)
    
    Note: JWT is stateless, so logout is just a client-side action
    """
    return {"message": "Logged out successfully"}
