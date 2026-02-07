from pydantic import BaseModel, Field
from typing import Optional, List


class CheckoutRequest(BaseModel):
    shipping_address: str = Field(..., min_length=5, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)


class CheckoutItem(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    price_at_order: float


class CheckoutResponse(BaseModel):
    order_id: int
    total_price: float
    items: List[CheckoutItem]

    class Config:
        from_attributes = True
