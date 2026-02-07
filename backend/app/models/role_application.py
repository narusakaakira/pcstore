from sqlalchemy import Column, Integer, ForeignKey, String, Enum, Text
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum

class RoleApplicationStatus(str, enum.Enum):
    """Role application status enumeration"""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class RoleApplication(BaseModel):
    """RoleApplication model for user role upgrade requests"""
    __tablename__ = "role_applications"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(RoleApplicationStatus), default=RoleApplicationStatus.PENDING, nullable=False, index=True)
    reason = Column(Text, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="role_applications")
    role = relationship("Role")
    approved_by_user = relationship("User", foreign_keys=[approved_by], back_populates="approved_roles")
    
    def __repr__(self):
        return f"<RoleApplication(user_id={self.user_id}, role_id={self.role_id}, status={self.status.value})>"
