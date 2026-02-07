from sqlalchemy import Column, Integer, ForeignKey, Float, String, Enum, Text
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum

class OrderStatus(str, enum.Enum):
    """Order status enumeration"""
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class Order(BaseModel):
    """Order model for customer orders"""
    __tablename__ = "orders"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    shipper_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    total_price = Column(Float, nullable=False)
    shipping_address = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="orders")
    shipper = relationship("User", foreign_keys=[shipper_id], back_populates="shipped_orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order(id={self.id}, user_id={self.user_id}, status={self.status.value})>"
