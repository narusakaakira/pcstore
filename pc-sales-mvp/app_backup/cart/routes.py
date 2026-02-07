from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import ShoppingCart, Product, User, Order, OrderItem, OrderStatus
from app.schemas import (
    CartAddRequest,
    CartUpdateRequest,
    CartItemResponse,
    CheckoutRequest,
    CheckoutResponse,
    CheckoutItem,
)
from app.middleware import get_current_user
from app.config import settings

router = APIRouter(prefix="/cart", tags=["cart"])


def to_cart_item_response(item: ShoppingCart) -> CartItemResponse:
    is_in_stock = item.product.stock_quantity >= settings.STOCK_THRESHOLD
    is_low_stock = 0 < item.product.stock_quantity < settings.STOCK_THRESHOLD
    return CartItemResponse(
        id=item.id,
        product_id=item.product_id,
        product_name=item.product.name,
        price=item.product.price,
        image_url=item.product.image_url,
        quantity=item.quantity,
        stock_quantity=item.product.stock_quantity,
        is_in_stock=is_in_stock,
        is_low_stock=is_low_stock,
    )


def _validate_stock(product: Product, quantity: int) -> None:
    if product.stock_quantity < settings.STOCK_THRESHOLD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product out of stock (threshold: {settings.STOCK_THRESHOLD})",
        )
    if quantity > product.stock_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested quantity exceeds stock",
        )


@router.get("/", response_model=List[CartItemResponse])
def get_cart(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items = (
        db.query(ShoppingCart)
        .filter(ShoppingCart.user_id == user.id)
        .all()
    )
    return [to_cart_item_response(i) for i in items]


@router.post("/", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    payload: CartAddRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == payload.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    existing = (
        db.query(ShoppingCart)
        .filter(ShoppingCart.user_id == user.id, ShoppingCart.product_id == payload.product_id)
        .first()
    )

    new_quantity = payload.quantity
    if existing:
        new_quantity = existing.quantity + payload.quantity

    _validate_stock(product, new_quantity)

    if existing:
        existing.quantity = new_quantity
        db.commit()
        db.refresh(existing)
        return to_cart_item_response(existing)

    item = ShoppingCart(user_id=user.id, product_id=payload.product_id, quantity=payload.quantity)
    db.add(item)
    db.commit()
    db.refresh(item)
    return to_cart_item_response(item)


@router.put("/{item_id}", response_model=CartItemResponse)
def update_cart_item(
    item_id: int,
    payload: CartUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = (
        db.query(ShoppingCart)
        .filter(ShoppingCart.id == item_id, ShoppingCart.user_id == user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    _validate_stock(item.product, payload.quantity)

    item.quantity = payload.quantity
    db.commit()
    db.refresh(item)
    return to_cart_item_response(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_cart_item(
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = (
        db.query(ShoppingCart)
        .filter(ShoppingCart.id == item_id, ShoppingCart.user_id == user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    db.delete(item)
    db.commit()
    return None


@router.post("/checkout", response_model=CheckoutResponse, status_code=status.HTTP_201_CREATED)
def checkout(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items = (
        db.query(ShoppingCart)
        .filter(ShoppingCart.user_id == user.id)
        .all()
    )

    if not items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    # Validate stock for each item
    for item in items:
        _validate_stock(item.product, item.quantity)

    total_price = sum(item.product.price * item.quantity for item in items)

    order = Order(
        user_id=user.id,
        status=OrderStatus.PENDING,
        total_price=total_price,
        shipping_address=payload.shipping_address,
        notes=payload.notes,
    )
    db.add(order)
    db.flush()

    order_items: list[OrderItem] = []
    response_items: list[CheckoutItem] = []

    for item in items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_order=item.product.price,
        )
        order_items.append(order_item)

        response_items.append(
            CheckoutItem(
                product_id=item.product_id,
                product_name=item.product.name,
                quantity=item.quantity,
                price_at_order=item.product.price,
            )
        )

        # Reduce stock
        item.product.stock_quantity = item.product.stock_quantity - item.quantity

    db.add_all(order_items)

    # Clear cart
    for item in items:
        db.delete(item)

    db.commit()
    db.refresh(order)

    return CheckoutResponse(
        order_id=order.id,
        total_price=total_price,
        items=response_items,
    )
