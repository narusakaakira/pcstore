from sqlalchemy.orm import Session
from typing import Optional

from app.database import SessionLocal
from app.models import User, Role, UserRole
from app.auth import hash_password
from app.config import settings


def ensure_role(db: Session, role_name: str, description: Optional[str] = None) -> Role:
    role = db.query(Role).filter(Role.name == role_name).first()
    if role:
        return role
    role = Role(name=role_name, description=description)
    db.add(role)
    db.flush()
    return role


def ensure_admin_user(db: Session) -> User:
    user = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
    if user:
        # Update password in case it changed
        user.password_hash = hash_password(settings.ADMIN_PASSWORD)
        db.flush()
        return user

    user = User(
        username=settings.ADMIN_USERNAME,
        email=f"{settings.ADMIN_USERNAME}@example.com",
        password_hash=hash_password(settings.ADMIN_PASSWORD),
        full_name="System Admin",
        is_active=True,
    )
    db.add(user)
    db.flush()
    return user


def ensure_user_role(db: Session, user_id: int, role_id: int) -> None:
    existing = (
        db.query(UserRole)
        .filter(UserRole.user_id == user_id, UserRole.role_id == role_id)
        .first()
    )
    if existing:
        return
    db.add(UserRole(user_id=user_id, role_id=role_id))


def seed_admin() -> None:
    db = SessionLocal()
    try:
        user_role = ensure_role(db, "USER", "Regular user role")
        shipper_role = ensure_role(db, "SHIPPER", "Shipper role")
        admin_role = ensure_role(db, "ADMIN", "Administrator role")

        admin_user = ensure_admin_user(db)
        ensure_user_role(db, admin_user.id, admin_role.id)
        ensure_user_role(db, admin_user.id, user_role.id)

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
    print("Admin seed completed")
