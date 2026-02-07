from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Order, OrderItem, Product, User, OrderStatus
from app.middleware import get_current_user, require_roles
from app.schemas import (
    OrderResponse,
    OrderItemResponse,
    OrderStatusUpdateRequest,
    AssignShipperRequest,
)

router = APIRouter(prefix="/orders", tags=["orders"])


def _to_order_item_response(item: OrderItem) -> OrderItemResponse:
    return OrderItemResponse(
        id=item.id,
        product_id=item.product_id,
        product_name=item.product.name if item.product else "",
        quantity=item.quantity,
        price_at_order=item.price_at_order,
    )


def _to_order_response(order: Order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        shipper_id=order.shipper_id,
        status=order.status.value if hasattr(order.status, "value") else str(order.status),
        total_price=order.total_price,
        shipping_address=order.shipping_address,
        notes=order.notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=[_to_order_item_response(i) for i in order.order_items],
    )


@router.get("/my", response_model=List[OrderResponse])
def list_my_orders(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_to_order_response(o) for o in orders]


@router.get("/assigned", response_model=List[OrderResponse])
def list_assigned_orders(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    _=Depends(require_roles(["SHIPPER"]))
):
    orders = (
        db.query(Order)
        .filter(Order.shipper_id == user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_to_order_response(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Users can only see their own orders.
    # Admins can see all orders.
    # Shippers can only see orders assigned to them.
    if order.user_id != user.id:
        user_roles = [ur.role.name for ur in user.user_roles]
        if "ADMIN" in user_roles:
            return _to_order_response(order)
        if "SHIPPER" in user_roles and order.shipper_id == user.id:
            return _to_order_response(order)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    return _to_order_response(order)


@router.put("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    if order.status not in {OrderStatus.PENDING, OrderStatus.CONFIRMED}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PENDING/CONFIRMED orders can be cancelled",
        )

    order.status = OrderStatus.CANCELLED

    # Restock items (checkout already reduced stock)
    for item in order.order_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity

    db.commit()
    db.refresh(order)
    return _to_order_response(order)


@router.get("/", response_model=List[OrderResponse])
def list_all_orders(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["ADMIN", "SHIPPER"]))
):
    user_roles = [ur.role.name for ur in user.user_roles]
    q = db.query(Order).order_by(Order.created_at.desc())
    if "ADMIN" not in user_roles:
        q = q.filter(Order.shipper_id == user.id)
    orders = q.all()
    return [_to_order_response(o) for o in orders]


@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    user_roles = [ur.role.name for ur in user.user_roles]

    # Admin can set any status, shipper can only move shipped/delivered
    new_status = payload.status.upper()
    allowed_statuses = {s.value for s in OrderStatus}
    if new_status not in allowed_statuses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

    if "ADMIN" in user_roles:
        order.status = OrderStatus(new_status)
    elif "SHIPPER" in user_roles:
        if order.shipper_id is not None and order.shipper_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Order is assigned to another shipper")
        if new_status not in {OrderStatus.SHIPPED.value, OrderStatus.DELIVERED.value}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Shipper can only set SHIPPED or DELIVERED")
        order.status = OrderStatus(new_status)
        order.shipper_id = user.id
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    db.commit()
    db.refresh(order)
    return _to_order_response(order)


@router.put("/{order_id}/assign-shipper", response_model=OrderResponse)
def assign_shipper(
    order_id: int,
    payload: AssignShipperRequest,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["ADMIN"]))
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    shipper = db.query(User).filter(User.id == payload.shipper_id).first()
    if not shipper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipper not found")

    shipper_roles = [ur.role.name for ur in shipper.user_roles]
    if "SHIPPER" not in shipper_roles and "ADMIN" not in shipper_roles:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not a shipper")

    order.shipper_id = shipper.id
    db.commit()
    db.refresh(order)
    return _to_order_response(order)
