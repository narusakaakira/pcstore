from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, Role, RoleApplication, RoleApplicationStatus, UserRole
from app.middleware import require_roles, get_current_user_roles
from app.schemas import UserResponse, RoleApplicationResponse, RoleApplicationUpdate

router = APIRouter(prefix="/admin", tags=["admin"])

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

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    _admin = Depends(require_roles(["ADMIN"]))
):
    users = db.query(User).all()
    return [_to_user_response(u) for u in users]

@router.get("/role-applications", response_model=List[RoleApplicationResponse])
async def list_role_applications(
    db: Session = Depends(get_db),
    _admin = Depends(require_roles(["ADMIN"]))
):
    apps = db.query(RoleApplication).all()
    return [
        RoleApplicationResponse(
            id=a.id,
            user_id=a.user_id,
            username=a.user.username,
            role_name=a.role.name,
            status=a.status.value,
            reason=a.reason,
            admin_notes=a.admin_notes,
            created_at=a.created_at
        ) for a in apps
    ]

@router.put("/users/{user_id}/roles", response_model=UserResponse)
async def update_user_roles(
    user_id: int,
    payload: List[str],
    db: Session = Depends(get_db),
    _admin = Depends(require_roles(["ADMIN"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Clear current roles
    db.query(UserRole).filter(UserRole.user_id == user_id).delete()
    
    # Add new roles
    for role_name in payload:
        role = db.query(Role).filter(Role.name == role_name.upper()).first()
        if role:
            db.add(UserRole(user_id=user_id, role_id=role.id))
            
    db.commit()
    db.refresh(user)
    return _to_user_response(user)

@router.put("/role-applications/{app_id}", response_model=RoleApplicationResponse)
async def update_role_application(
    app_id: int,
    payload: RoleApplicationUpdate,
    db: Session = Depends(get_db),
    admin = Depends(require_roles(["ADMIN"]))
):
    app = db.query(RoleApplication).filter(RoleApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    app.status = RoleApplicationStatus(payload.status)
    app.admin_notes = payload.admin_notes
    app.approved_by = admin.id
    
    if app.status == RoleApplicationStatus.APPROVED:
        # Assign role to user
        existing_role = db.query(UserRole).filter(
            UserRole.user_id == app.user_id,
            UserRole.role_id == app.role_id
        ).first()
        if not existing_role:
            db.add(UserRole(user_id=app.user_id, role_id=app.role_id))
            
    db.commit()
    db.refresh(app)
    
    return RoleApplicationResponse(
        id=app.id,
        user_id=app.user_id,
        username=app.user.username,
        role_name=app.role.name,
        status=app.status.value,
        reason=app.reason,
        admin_notes=app.admin_notes,
        created_at=app.created_at
    )
