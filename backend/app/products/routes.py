from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
import os
import uuid

from app.database import get_db
from app.models import Product
from app.schemas import ProductCreate, ProductUpdate, ProductStockUpdate, ProductResponse
from app.middleware import require_roles
from app.config import settings

router = APIRouter(prefix="/products", tags=["products"])


def _validate_image(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")

    ext = os.path.splitext(file.filename)[1].lstrip(".").lower()
    if ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image type. Allowed: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}",
        )

    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)

    if size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE} bytes",
        )


def _save_image(file: UploadFile) -> str:
    ext = os.path.splitext(file.filename)[1].lower()
    filename = f"{uuid.uuid4().hex}{ext}"
    upload_dir = os.path.join("uploads", "products")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as out_file:
        out_file.write(file.file.read())

    return f"/uploads/products/{filename}"


def to_product_response(product: Product) -> ProductResponse:
    is_in_stock = product.stock_quantity >= settings.STOCK_THRESHOLD
    is_low_stock = 0 < product.stock_quantity < settings.STOCK_THRESHOLD
    return ProductResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        category=product.category,
        price=product.price,
        stock_quantity=product.stock_quantity,
        image_url=product.image_url,
        sku=product.sku,
        brand=product.brand,
        model=product.model,
        warranty_months=product.warranty_months,
        specifications=product.specifications,
        is_active=product.is_active,
        is_in_stock=is_in_stock,
        is_low_stock=is_low_stock,
    )


@router.get("/", response_model=List[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    in_stock: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(True),
):
    query = db.query(Product)

    if category:
        query = query.filter(Product.category == category)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    if in_stock is not None:
        if in_stock:
            query = query.filter(Product.stock_quantity >= settings.STOCK_THRESHOLD)
        else:
            query = query.filter(Product.stock_quantity < settings.STOCK_THRESHOLD)

    products = query.order_by(Product.created_at.desc()).all()
    return [to_product_response(p) for p in products]


@router.get("/low-stock", response_model=List[ProductResponse])
def list_low_stock_products(db: Session = Depends(get_db)):
    products = (
        db.query(Product)
        .filter(Product.stock_quantity < settings.STOCK_THRESHOLD)
        .order_by(Product.stock_quantity.asc())
        .all()
    )
    return [to_product_response(p) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return to_product_response(product)


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["ADMIN"]))
):
    print(f"DEBUG: Creating product with payload: {payload.model_dump()}")
    existing = db.query(Product).filter(Product.sku == payload.sku).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already exists")

    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return to_product_response(product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["ADMIN"]))
):
    print(f"DEBUG: Updating product {product_id} with payload: {payload.model_dump()}")
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "sku" in update_data:
        existing = db.query(Product).filter(Product.sku == update_data["sku"], Product.id != product_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already exists")

    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return to_product_response(product)


@router.put("/{product_id}/stock", response_model=ProductResponse)
def update_stock(
    product_id: int,
    payload: ProductStockUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["ADMIN"]))
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    product.stock_quantity = payload.stock_quantity
    db.commit()
    db.refresh(product)
    return to_product_response(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["ADMIN"]))
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    db.delete(product)
    db.commit()
    return None


@router.post("/{product_id}/image", response_model=ProductResponse)
def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["ADMIN"]))
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    _validate_image(file)
    image_url = _save_image(file)

    product.image_url = image_url
    db.commit()
    db.refresh(product)
    return to_product_response(product)
