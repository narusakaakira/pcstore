from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="PC Sales MVP API",
    description="Multi-role e-commerce platform for PC sales",
    version="1.0.0"
)

# CORS Middleware - Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file directories for uploads
if not os.path.exists("uploads"):
    os.makedirs("uploads/products", exist_ok=True)
    os.makedirs("uploads/avatars", exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "PC Sales MVP API is running"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "PC Sales MVP API",
        "docs": "/docs",
        "health": "/health"
    }

# Include routers
from app.auth.routes import router as auth_router
from app.products.routes import router as product_router
from app.cart.routes import router as cart_router
from app.orders.routes import router as orders_router
app.include_router(auth_router)
app.include_router(product_router)
app.include_router(cart_router)
app.include_router(orders_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
