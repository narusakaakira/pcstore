from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel

class UserRole(BaseModel):
    """UserRole junction table for many-to-many relationship between users and roles"""
    __tablename__ = "user_roles"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="user_roles")
    role = relationship("Role")
    
    def __repr__(self):
        return f"<UserRole(user_id={self.user_id}, role_id={self.role_id})>"
