from sqlalchemy import Column, String, Enum
from .base import BaseModel
import enum

class RoleEnum(str, enum.Enum):
    """Role enumeration for the system"""
    USER = "USER"
    SHIPPER = "SHIPPER"
    ADMIN = "ADMIN"

class Role(BaseModel):
    """Role model for role management"""
    __tablename__ = "roles"
    
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    
    def __repr__(self):
        return f"<Role(id={self.id}, name='{self.name}')>"
