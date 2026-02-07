# PC Sales MVP - Multi-Role E-commerce Platform

A student project for learning e-commerce development, systems operations, and database design.

## Overview

**PC Sales MVP** is a role-based e-commerce platform for selling computer components (PCs). It features:

- **3-tier role system:** User → Shipper → Admin
- **Product management:** Browse, filter, add to cart
- **Order tracking:** From purchase to delivery
- **Role approval workflow:** Users can apply to become Shippers/Admins
- **Responsive UI:** Material-UI with Vietnamese labels
- **Containerized deployment:** Docker Compose for local development

## Tech Stack

- **Frontend:** React 18 + Vite + Material-UI
- **Backend:** FastAPI (Python)
- **Database:** MySQL 8.0
- **Deployment:** Docker Compose
- **CI/CD:** GitHub Actions

## Project Structure

```
pc-sales-mvp/
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── context/       # Auth & state management
│   │   ├── hooks/         # Custom React hooks
│   │   └── services/      # API client
│   └── Dockerfile
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── main.py       # FastAPI app entry
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── auth/         # Authentication & JWT
│   │   ├── middleware/   # Auth middleware, CORS
│   │   ├── products/     # Product management routes
│   │   ├── users/        # User management routes
│   │   ├── cart/         # Shopping cart routes
│   │   ├── orders/       # Order management routes
│   │   ├── roles/        # Role & permission routes
│   │   └── admin/        # Admin-only routes
│   ├── tests/            # Unit & integration tests
│   ├── uploads/          # Product images & avatars storage
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile
├── docker-compose.yml    # Multi-container orchestration
└── .env.example         # Environment variables template
```

## Quick Start

### Prerequisites

- Docker & Docker Compose installed
- Git
- (Optional) Python 3.9+ and Node.js 18+ for local development

### Setup & Run

1. **Clone or initialize project:**
   ```bash
   cd pc-sales-mvp
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Wait for services to be healthy:**
   ```bash
   docker-compose ps
   # All services should show "Up"
   ```

5. **Run database migrations:**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

6. **Access the application:**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:8000
   - **API Docs:** http://localhost:8000/docs

7. **Admin login credentials:**
   - Username: `admin`
   - Password: `123`

## Development

### Frontend Development

```bash
# Install dependencies
cd frontend
npm install

# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

### Backend Development

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run server with hot reload
uvicorn app.main:app --reload

# Run tests
pytest

# Run migrations
alembic upgrade head
```

## Database

### Tables

1. **users** - User accounts
2. **roles** - Role definitions (User, Shipper, Admin)
3. **user_roles** - Junction table (role assignments)
4. **products** - Product catalog
5. **shopping_cart** - User shopping carts
6. **orders** - Customer orders
7. **order_items** - Items in each order
8. **role_applications** - Pending role approvals

### Migrations

Migrations are handled by Alembic and run automatically on backend startup.

To create a new migration:
```bash
alembic revision --autogenerate -m "Description of changes"
```

## Features

### User Role

- View product catalog
- Browse by category (CPU, RAM, SSD, GPU, PSU, CASE)
- Add items to shopping cart
- Place orders
- Track order status
- Edit profile & change password
- Apply to become Shipper or Admin

### Shipper Role

- All User features
- View order queue
- Accept & track deliveries
- Mark orders as delivered

### Admin Role

- All User & Shipper features
- Manage product catalog (add/delete/edit)
- Approve role applications
- Change password
- Admin-only dashboard

## Stock Management

Products display as "Out of Stock" when inventory falls below **6 units** (safety threshold for small store).

- Stock >= 6: "In Stock" - Add to cart enabled
- Stock < 6: "Out of Stock" - Add to cart disabled, shows error message

## API Endpoints

### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Login with username/password
- `POST /auth/logout` - Logout (frontend clears token)

### Products
- `GET /products` - List all products
- `GET /products/{id}` - Get product details
- `POST /products` - Add product (Admin only)
- `DELETE /products/{id}` - Delete product (Admin only)

### Cart
- `GET /cart` - Get user's shopping cart
- `POST /cart/add` - Add item to cart
- `DELETE /cart/remove/{product_id}` - Remove item
- `PATCH /cart/update` - Update item quantity

### Orders
- `GET /orders` - List user's orders
- `POST /orders/checkout` - Create order from cart
- `PATCH /orders/{order_id}/status` - Update order status

### Roles
- `POST /roles/apply` - Apply for new role
- `GET /roles/applications` - View pending applications (Admin)
- `PATCH /roles/applications/{app_id}/approve` - Approve application (Admin)

## Testing

### Run all tests
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
```

### Coverage report
```bash
pytest --cov=app backend/tests/
```

## Deployment

See `production-request-document.md` for production deployment guide.

## Learning Goals

This project teaches:

- **Full-stack development:** Frontend + Backend + Database
- **Database design:** Schema design, relationships, migrations
- **API design:** RESTful APIs, CORS, authentication
- **DevOps:** Docker, Docker Compose, containerization
- **CI/CD:** GitHub Actions pipeline, automated testing
- **UI/UX:** Material-UI, responsive design, user flows
- **Testing:** Unit tests, integration tests, coverage

## Timeline

- **Days 1-2:** Foundation (Docker, Database, Authentication)
- **Days 3-4:** Core features (Products, Cart, Orders)
- **Days 5-6:** Admin & Shipper features, Testing
- **Day 7:** Polish, Documentation, Deployment

## Support

For questions or issues:
1. Check API docs: http://localhost:8000/docs
2. Review tech-spec: See `tech-spec-pc-sales-mvp-multi-role-ecommerce.md`
3. Check logs: `docker-compose logs [service_name]`

## License

Personal learning project - Use freely for educational purposes.

---

**Created:** February 2, 2026  
**Language:** English (Interface: Vietnamese)  
**Status:** MVP Development in Progress
