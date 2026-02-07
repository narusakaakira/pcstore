from sqlalchemy import Column, String, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel

class User(BaseModel):
    """User model for customer accounts"""
    __tablename__ = "users"
    
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    
    # Relationships
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    shopping_cart = relationship("ShoppingCart", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", foreign_keys="Order.user_id", back_populates="user", cascade="all, delete-orphan")
    role_applications = relationship("RoleApplication", foreign_keys="RoleApplication.user_id", back_populates="user", cascade="all, delete-orphan")
    shipped_orders = relationship("Order", foreign_keys="Order.shipper_id", back_populates="shipper")
    approved_roles = relationship("RoleApplication", foreign_keys="RoleApplication.approved_by", back_populates="approved_by_user")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"
