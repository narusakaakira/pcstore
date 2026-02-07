from sqlalchemy import Column, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship
from .base import BaseModel

class ShoppingCart(BaseModel):
    """ShoppingCart model for user's shopping cart items"""
    __tablename__ = "shopping_cart"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, default=1, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="shopping_cart")
    product = relationship("Product", back_populates="shopping_cart_items")
    
    def __repr__(self):
        return f"<ShoppingCart(user_id={self.user_id}, product_id={self.product_id}, qty={self.quantity})>"
