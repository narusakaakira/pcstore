from pydantic import BaseModel, Field
from typing import Optional

class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    category: str = Field(..., min_length=2, max_length=100)
    price: float = Field(..., gt=0)
    stock_quantity: int = Field(..., ge=0)
    image_url: Optional[str] = None
    sku: str = Field(..., min_length=2, max_length=100)
    brand: Optional[str] = None
    model: Optional[str] = None
    warranty_months: Optional[int] = Field(12, ge=0)
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    price: Optional[float] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None
    sku: Optional[str] = Field(None, min_length=2, max_length=100)
    brand: Optional[str] = None
    model: Optional[str] = None
    warranty_months: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class ProductStockUpdate(BaseModel):
    stock_quantity: int = Field(..., ge=0)

class ProductResponse(ProductBase):
    id: int
    is_in_stock: bool
    is_low_stock: bool

    class Config:
        from_attributes = True
