from sqlalchemy import Column, String, Float, Integer, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel

class Product(BaseModel):
    """Product model for PC components and systems"""
    __tablename__ = "products"
    
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)
    price = Column(Float, nullable=False, index=True)
    stock_quantity = Column(Integer, default=0, nullable=False, index=True)
    image_url = Column(String(255), nullable=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    
    # Technical specifications as JSON-like fields
    brand = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    warranty_months = Column(Integer, default=12)
    specifications = Column(JSON, nullable=True)
    
    is_active = Column(Boolean, default=True, index=True)
    
    # Relationships
    shopping_cart_items = relationship("ShoppingCart", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product", cascade="all, delete-orphan")
    
    @property
    def is_in_stock(self):
        """Check if product is in stock (threshold of 6 units as per business rules)"""
        STOCK_THRESHOLD = 6
        return self.stock_quantity >= STOCK_THRESHOLD
    
    @property
    def is_low_stock(self):
        """Check if product is low stock"""
        STOCK_THRESHOLD = 6
        return 0 < self.stock_quantity < STOCK_THRESHOLD
    
    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', stock={self.stock_quantity})>"
