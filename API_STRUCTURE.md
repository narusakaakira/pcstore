# Backend API Structure

Base URL: http://localhost:8000

## Health & Root
- GET /health
  - Response: { status, message }
- GET /
  - Response: { message, docs, health }

## Authentication (tag: authentication)
- POST /auth/register
  - Body: RegisterRequest
  - Response: TokenResponse
  - Notes: Creates user and assigns USER role.
- POST /auth/login
  - Body: LoginRequest
  - Response: TokenResponse
- GET /auth/me
  - Auth: Bearer token
  - Response: UserResponse
- POST /auth/logout
  - Response: { message }
  - Notes: Stateless JWT logout (client clears token).

## Products (tag: products)
- GET /products/
  - Query: category, min_price, max_price, in_stock, is_active
  - Response: ProductResponse[]
- GET /products/low-stock
  - Response: ProductResponse[]
- GET /products/{product_id}
  - Response: ProductResponse
- POST /products/
  - Auth: ADMIN
  - Body: ProductCreate
  - Response: ProductResponse
- PUT /products/{product_id}
  - Auth: ADMIN
  - Body: ProductUpdate
  - Response: ProductResponse
- PUT /products/{product_id}/stock
  - Auth: ADMIN
  - Body: ProductStockUpdate
  - Response: ProductResponse
- DELETE /products/{product_id}
  - Auth: ADMIN
  - Response: 204 No Content
- POST /products/{product_id}/image
  - Auth: ADMIN
  - Body: multipart/form-data (file)
  - Response: ProductResponse

## Cart (tag: cart)
- GET /cart/
  - Auth: Bearer token
  - Response: CartItemResponse[]
- POST /cart/
  - Auth: Bearer token
  - Body: CartAddRequest
  - Response: CartItemResponse
- PUT /cart/{item_id}
  - Auth: Bearer token
  - Body: CartUpdateRequest
  - Response: CartItemResponse
- DELETE /cart/{item_id}
  - Auth: Bearer token
  - Response: 204 No Content
- POST /cart/checkout
  - Auth: Bearer token
  - Body: CheckoutRequest
  - Response: CheckoutResponse

## Orders (tag: orders)
- GET /orders/my
  - Auth: Bearer token
  - Response: OrderResponse[]
- GET /orders/assigned
  - Auth: SHIPPER
  - Response: OrderResponse[]
- GET /orders/{order_id}
  - Auth: Bearer token
  - Notes: Admin can view any; shipper only if assigned; users only their own.
  - Response: OrderResponse
- PUT /orders/{order_id}/cancel
  - Auth: Bearer token
  - Notes: Only PENDING/CONFIRMED; user must own order.
  - Response: OrderResponse
- GET /orders/
  - Auth: ADMIN or SHIPPER
  - Response: OrderResponse[]
- PUT /orders/{order_id}/status
  - Auth: ADMIN or SHIPPER
  - Body: OrderStatusUpdateRequest
  - Notes: Shipper can only set SHIPPED/DELIVERED.
  - Response: OrderResponse
- PUT /orders/{order_id}/assign-shipper
  - Auth: ADMIN
  - Body: AssignShipperRequest
  - Response: OrderResponse

## Auth Header
Use Bearer token for protected endpoints:

Authorization: Bearer <access_token>

## Static Files
- GET /uploads/products/{filename}
- GET /uploads/avatars/{filename}
