# app/routes/orders_routes.py
from app.db.models import Order, OrderItem, Payment
from app.utils.errors import NotFoundError
from flask import Blueprint, jsonify, request
from marshmallow import ValidationError
from app.schemas import OrderCreate
from app.services.orders_service import create_order as svc_create_order

orders_bp = Blueprint("orders", __name__)

@orders_bp.get("/<int:order_id>")
def get_order(order_id: int):
    o = Order.query.get(order_id)
    if not o:
        raise NotFoundError(f"order {order_id} not found")
    return jsonify({
        "id": o.id,
        "cashier_id": o.cashier_id,
        "subtotal": o.subtotal,
        "tax": o.tax,
        "total": o.total,
        "order_time": o.order_time.isoformat(),
        "status": o.status,
        "items": [
            {"product_id": i.product_id, "quantity": i.quantity, "customizations": i.customizations, "line_price": i.line_price}
            for i in o.items
        ],
        "payments": [
            {"method": p.payment_method, "amount": p.amount_paid}
            for p in o.payments
        ],
    }), 200

from app.services.orders_service import recent_transactions as svc_recent

@orders_bp.get("/recent")
def recent_transactions():
    return jsonify({"transactions": svc_recent()}), 200

@orders_bp.get("/")
def list_orders():
    # TODO: paginate & filter by date/status
    # Query params: page, page_size, from, to, status
    return jsonify({"orders": [], "page": 1, "page_size": 50, "total": 0}), 200

@orders_bp.post("/")
def create_order():
    try:
        payload = OrderCreate().load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 400
    res = svc_create_order(payload)
    return jsonify(res), 201

@orders_bp.get("/<int:order_id>/receipt")
def get_order_receipt(order_id: int):
    # TODO: produce printable receipt payload
    return jsonify({}), 200

@orders_bp.post("/<int:order_id>/refund")
def refund_order(order_id: int):
    # TODO: process full/partial refund, update status, record negative payment
    body = request.get_json() or {}
    return jsonify({"ok": True}), 200

