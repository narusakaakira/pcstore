from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    price_at_order: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: int
    shipper_id: Optional[int]
    status: str
    total_price: float
    shipping_address: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True


class OrderStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="New order status")


class AssignShipperRequest(BaseModel):
    shipper_id: int
