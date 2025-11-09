# app/routes/orders_routes.py
from app.db.models import Order, OrderItem, Payment
from app.utils.errors import NotFoundError
from flask import Blueprint, jsonify, request
from marshmallow import ValidationError
from app.schemas import OrderCreate
from datetime import datetime, timedelta
from sqlalchemy.orm import selectinload
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
    # Query params: page, page_size, from, to, status
    # page/page_size defaults align with PaginationQuery schema
    page_param = request.args.get("page")
    size_param = request.args.get("page_size")
    try:
        page = int(page_param) if page_param is not None else 1
    except ValueError:
        page = 1
    try:
        page_size = int(size_param) if size_param is not None else 50
    except ValueError:
        page_size = 50
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 1
    if page_size > 200:
        page_size = 200

    # Date filters: inclusive start, exclusive end-of-day for 'to'
    from_str = request.args.get("from")
    to_str = request.args.get("to")
    start_ts = None
    end_ts = None
    try:
        if from_str:
            d = datetime.strptime(from_str, "%Y-%m-%d")
            start_ts = d.replace(hour=0, minute=0, second=0, microsecond=0)
        if to_str:
            d = datetime.strptime(to_str, "%Y-%m-%d")
            end_ts = (d + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    except ValueError:
        return jsonify({"error": "invalid_date", "message": "Use YYYY-MM-DD for 'from'/'to'."}), 400

    # Status filter (case-insensitive)
    status_param = request.args.get("status")
    valid_status = {"complete", "refunded", "voided"}
    status_filter = None
    if status_param:
        s = status_param.strip().lower()
        if s not in valid_status:
            return jsonify({"error": "invalid_status", "message": "status must be Complete, Refunded, or Voided"}), 400
        status_filter = s.capitalize()

    q = Order.query
    if start_ts is not None:
        q = q.filter(Order.order_time >= start_ts)
    if end_ts is not None:
        q = q.filter(Order.order_time < end_ts)
    if status_filter is not None:
        q = q.filter(Order.status == status_filter)

    total = q.count()

    rows = (
        q.options(
            selectinload(Order.items),
            selectinload(Order.payments),
        )
        .order_by(Order.order_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    data = [
        {
            "id": o.id,
            "cashier_id": o.cashier_id,
            "subtotal": o.subtotal,
            "tax": o.tax,
            "total": o.total,
            "order_time": o.order_time.isoformat(),
            "status": o.status,
            "items": [
                {
                    "product_id": i.product_id,
                    "quantity": i.quantity,
                    "customizations": i.customizations,
                    "line_price": i.line_price,
                }
                for i in o.items
            ],
            "payments": [
                {"method": p.payment_method, "amount": p.amount_paid}
                for p in o.payments
            ],
        }
        for o in rows
    ]

    return jsonify({"orders": data, "page": page, "page_size": page_size, "total": total}), 200

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
