from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid

from app.database import get_db
from app.models import User, Role, RoleApplication, RoleApplicationStatus
from app.middleware import get_current_user, get_current_user_roles
from app.schemas import UserResponse, UserUpdate, PasswordChangeRequest, RoleApplicationCreate, RoleApplicationResponse
from app.auth import verify_password, hash_password
from app.config import settings

router = APIRouter(prefix="/users", tags=["users"])

def _to_user_response(user) -> UserResponse:
    roles = get_current_user_roles(user)
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        address=user.address,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        roles=roles
    )

@router.get("/me", response_model=UserResponse)
async def get_my_profile(user: User = Depends(get_current_user)):
    return _to_user_response(user)

@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    update_data = payload.model_dump(exclude_unset=True)
    
    # Check if email is being updated and if it's already taken
    if "email" in update_data and update_data["email"] != user.email:
        existing = db.query(User).filter(User.email == update_data["email"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already in use"
            )
            
    for key, value in update_data.items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return _to_user_response(user)

@router.put("/me/password")
async def change_my_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")
    
    ext = os.path.splitext(file.filename)[1].lstrip(".").lower()
    if ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image type. Allowed: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}",
        )

    filename = f"avatar_{user.id}_{uuid.uuid4().hex}.{ext}"
    upload_dir = os.path.join("uploads", "avatars")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as out_file:
        out_file.write(file.file.read())

    user.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(user)
    return _to_user_response(user)

@router.post("/apply-role", response_model=RoleApplicationResponse)
async def apply_for_role(
    payload: RoleApplicationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    role = db.query(Role).filter(Role.name == payload.role_name.upper()).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    user_roles = get_current_user_roles(user)
    if payload.role_name.upper() in user_roles:
        raise HTTPException(status_code=400, detail="You already have this role")
    
    existing = db.query(RoleApplication).filter(
        RoleApplication.user_id == user.id,
        RoleApplication.role_id == role.id,
        RoleApplication.status == RoleApplicationStatus.PENDING
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending application for this role")
    
    application = RoleApplication(
        user_id=user.id,
        role_id=role.id,
        reason=payload.reason
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    
    return RoleApplicationResponse(
        id=application.id,
        user_id=application.user_id,
        username=user.username,
        role_name=role.name,
        status=application.status.value,
        reason=application.reason,
        admin_notes=application.admin_notes,
        created_at=application.created_at
    )

@router.get("/my-applications", response_model=List[RoleApplicationResponse])
async def get_my_applications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    apps = db.query(RoleApplication).filter(RoleApplication.user_id == user.id).all()
    return [
        RoleApplicationResponse(
            id=a.id,
            user_id=a.user_id,
            username=user.username,
            role_name=a.role.name,
            status=a.status.value,
            reason=a.reason,
            admin_notes=a.admin_notes,
            created_at=a.created_at
        ) for a in apps
    ]
