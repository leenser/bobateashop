# app/routes/orders_routes.py
from app.db.models import Order, OrderItem, Payment
from app.utils.errors import NotFoundError, BadRequestError
from app.db import db
from flask import Blueprint, jsonify, request
from marshmallow import ValidationError
from app.schemas import OrderCreate
from datetime import datetime, timedelta
from sqlalchemy.orm import selectinload
from app.services.orders_service import create_order as svc_create_order

orders_bp = Blueprint("orders", __name__)

def _format_order_items(items):
    data = []
    for itm in items:
        line_price = itm.line_price if itm.line_price is not None else 0.0
        data.append({
            "product_id": itm.product_id,
            "quantity": itm.quantity,
            "customizations": itm.customizations,
            "line_price": line_price,
        })
    return data

def _format_payments(payments, include_time=False):
    result = []
    for p in payments:
        entry = {
            "method": p.payment_method,
            "amount": p.amount_paid,
        }
        if include_time:
            entry["time"] = p.payment_time.isoformat() if p.payment_time else None
        result.append(entry)
    return result

@orders_bp.get("/<int:order_id>")
def get_order(order_id: int):
    o = (
        Order.query.options(
            selectinload(Order.items),
            selectinload(Order.payments),
        ).get(order_id)
    )
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
        "items": _format_order_items(o.items),
        "payments": _format_payments(o.payments),
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
            "items": _format_order_items(o.items),
            "payments": _format_payments(o.payments),
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
    except Exception as e:
        print(f"ERROR in create_order validation: {repr(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "validation_error", "message": str(e)}), 400
    
    try:
        res = svc_create_order(payload)
        return jsonify(res), 201
    except Exception as e:
        print(f"ERROR in create_order service: {repr(e)}")
        import traceback
        traceback.print_exc()
        raise  # Re-raise so error handler catches it

@orders_bp.get("/<int:order_id>/receipt")
def get_order_receipt(order_id: int):
    o = (
        Order.query.options(
            selectinload(Order.items),
            selectinload(Order.payments),
        ).get(order_id)
    )
    if not o:
        raise NotFoundError(f"order {order_id} not found")

    items = _format_order_items(o.items)
    payments = _format_payments(o.payments, include_time=True)

    receipt = {
        "order_id": o.id,
        "cashier_id": o.cashier_id,
        "status": o.status,
        "order_time": o.order_time.isoformat(),
        "subtotal": o.subtotal,
        "tax": o.tax,
        "total": o.total,
        "items": items,
        "payments": payments,
    }

    return jsonify(receipt), 200

@orders_bp.post("/<int:order_id>/refund")
def refund_order(order_id: int):
    body = request.get_json(silent=True) or {}
    o = (
        Order.query.options(
            selectinload(Order.payments)
        ).get(order_id)
    )
    if not o:
        raise NotFoundError(f"order {order_id} not found")

    # Determine refundable remaining based on net payments already made
    net_paid = float(sum(p.amount_paid for p in o.payments))
    refundable_remaining = max(0.0, net_paid)

    # amount: if omitted, refund remaining; must be > 0
    amount = body.get("amount")
    if amount is None:
        amount = refundable_remaining
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        raise BadRequestError("amount must be a number")

    if amount <= 0.0:
        raise BadRequestError("amount must be greater than 0")

    if refundable_remaining <= 0.0:
        raise BadRequestError("nothing left to refund")

    # Cap refund to remaining refundable
    if amount > refundable_remaining:
        amount = refundable_remaining

    method = body.get("method", "other")

    refund_payment = Payment(
        order_id=o.id,
        amount_paid=-amount,
        payment_method=method,
        payment_time=datetime.utcnow(),
    )
    db.session.add(refund_payment)

    # Update order status if fully refunded
    new_net_paid = net_paid - amount
    if new_net_paid <= 0.00001:
        o.status = "Refunded"

    db.session.commit()

    return jsonify({
        "ok": True,
        "refunded": amount,
        "remaining_refundable": max(0.0, new_net_paid),
        "status": o.status,
    }), 200
