from pydantic import BaseModel, Field
from typing import Optional


class CartAddRequest(BaseModel):
    product_id: int
    quantity: int = Field(1, ge=1)


class CartUpdateRequest(BaseModel):
    quantity: int = Field(..., ge=1)


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    price: float
    image_url: Optional[str]
    quantity: int
    stock_quantity: int
    is_in_stock: bool
    is_low_stock: bool

    class Config:
        from_attributes = True
