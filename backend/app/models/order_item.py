from sqlalchemy import Column, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship
from .base import BaseModel

class OrderItem(BaseModel):
    """OrderItem model for individual items in an order"""
    __tablename__ = "order_items"
    
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    price_at_order = Column(Float, nullable=False)  # Store price at time of order
    
    # Relationships
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")
    
    def __repr__(self):
        return f"<OrderItem(order_id={self.order_id}, product_id={self.product_id}, qty={self.quantity})>"
