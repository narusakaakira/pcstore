from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Product

def seed_products():
    db = SessionLocal()
    products = [
        {
            "name": "Intel Core i9-14900K",
            "description": "24-Core (8P+16E) Desktop Processor 36MB Cache",
            "category": "CPU",
            "price": 589.00,
            "stock_quantity": 15,
            "sku": "CPU-INT-14900K",
            "brand": "Intel",
            "model": "i9-14900K"
        },
        {
            "name": "NVIDIA GeForce RTX 4090",
            "description": "24GB GDDR6X Graphics Card",
            "category": "GPU",
            "price": 1599.99,
            "stock_quantity": 5,
            "sku": "GPU-NV-4090",
            "brand": "NVIDIA",
            "model": "RTX 4090"
        },
        {
            "name": "Samsung 990 Pro 2TB",
            "description": "NVMe M.2 SSD PCIe Gen4",
            "category": "SSD",
            "price": 169.99,
            "stock_quantity": 50,
            "sku": "SSD-SAM-990P-2T",
            "brand": "Samsung",
            "model": "990 Pro"
        },
        {
            "name": "ASUS ROG Maximus Z790 Hero",
            "description": "Intel Z790 LGA 1700 ATX Motherboard",
            "category": "MAIN",
            "price": 629.99,
            "stock_quantity": 8,
            "sku": "MB-ASUS-Z790-H",
            "brand": "ASUS",
            "model": "ROG Maximus Z790 Hero"
        }
    ]

    try:
        for p_data in products:
            existing = db.query(Product).filter(Product.sku == p_data["sku"]).first()
            if not existing:
                product = Product(**p_data)
                db.add(product)
        db.commit()
        print("Products seeded successfully")
    except Exception as e:
        db.rollback()
        print(f"Error seeding products: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_products()
