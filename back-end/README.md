# Bubble Tea POS — Flask API Skeleton (Endpoints Only)

This backend mirrors the JavaFX POS features with Flask routes defined (logic to be filled in). 
Each route contains comments describing the responsibilities to implement.

## Base Prefix
All endpoints are mounted under `/api/*` (see `app/__init__.py`).

## Endpoints Overview

### Meta
- `GET /api/meta/options` — Enumerations for ice/sweetness/base/toppings/flavor shots.
- `GET /api/meta/health` — Readiness check.

### Products
- `GET /api/products/` — Products grouped by category.
- `GET /api/products/all` — Flat list of products.
- `POST /api/products/` — Create product.
- `GET /api/products/{product_id}` — Get product.
- `PUT /api/products/{product_id}` — Update product.
- `DELETE /api/products/{product_id}` — Delete product (+cascade recipe links).
- `GET /api/products/{product_id}/ingredients` — List recipe links (product ↔ inventory).
- `POST /api/products/{product_id}/ingredients` — Add recipe link.
- `DELETE /api/products/{product_id}/ingredients/{inventory_id}` — Remove recipe link.
- `GET /api/products/categories` — Distinct category list.

### Inventory
- `GET /api/inventory/` — List inventory items (with optional derived status).
- `POST /api/inventory/` — Create inventory item.
- `GET /api/inventory/{item_id}` — Get inventory item.
- `PUT /api/inventory/{item_id}` — Update inventory item.
- `DELETE /api/inventory/{item_id}` — Delete inventory item.
- `POST /api/inventory/{item_id}/restock` — Restock an item (increment stock; set last_restock_date).
- `GET /api/inventory/low-stock` — Items at/below threshold.

### Employees (Cashiers)
- `GET /api/employees/` — List employees.
- `POST /api/employees/` — Create employee.
- `GET /api/employees/{employee_id}` — Get employee.
- `PUT /api/employees/{employee_id}` — Update employee.
- `PATCH /api/employees/{employee_id}/active` — Toggle active flag.
- `DELETE /api/employees/{employee_id}` — Delete employee (detach from orders first).

### Orders
- `GET /api/orders/` — (Optional) Paginated order list.
- `POST /api/orders/` — Create order (checkout).
- `GET /api/orders/recent` — Dashboard-friendly recent transactions list.
- `GET /api/orders/{order_id}` — Get order with items & payments.
- `GET /api/orders/{order_id}/receipt` — Receipt payload.
- `POST /api/orders/{order_id}/refund` — Refund/void order (full/partial).

### Reports
- `GET /api/reports/` — Report catalog/status.
- `GET /api/reports/x-report` — Hourly since last Z close.
- `POST /api/reports/z-report` — Close period; return Z summary; optionally reset.
- `GET /api/reports/summary?from=...&to=...` — Aggregate sales for a date range.
- `GET /api/reports/weekly-items` — Dashboard pie chart data.
- `GET /api/reports/daily-top` — Dashboard bar chart data.

> Implementation is intentionally omitted inside handlers. Follow comments to wire services & DB.