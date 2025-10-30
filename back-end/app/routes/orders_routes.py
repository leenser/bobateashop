from flask import Blueprint, jsonify, request
# later: from app.services.orders_service import create_order, recent_transactions

orders_bp = Blueprint("orders", __name__)

@orders_bp.get("/")
def orders_root():
    # simple stub so /api/orders/ doesn't 404
    return jsonify({"ok": True, "area": "orders"}), 200

@orders_bp.post("/")
def orders_create():
    # eventually this will call create_order(request.json)
    return jsonify({"message": "checkout stub"}), 201

@orders_bp.get("/recent")
def orders_recent():
    # eventually this will call recent_transactions()
    return jsonify({"transactions": []}), 200
