# app/routes/inventory_routes.py
from marshmallow import ValidationError
from app.schemas import InventoryCreate, InventoryUpdate, RestockRequest
from app.services.inventory_service import list_inventory as svc_list, create_inventory_item as svc_create, delete_inventory_item as svc_delete
from app.db.models import InventoryItem
from datetime import datetime
from app.db import db
from flask import Blueprint, jsonify, request

inventory_bp = Blueprint("inventory", __name__)

@inventory_bp.get("/")
def list_inventory():
    return jsonify(svc_list()), 200

@inventory_bp.post("/")
def create_inventory_item():
    try:
        body = InventoryCreate().load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 400
    return jsonify(svc_create(body)), 201

@inventory_bp.post("/<int:item_id>/restock")
def restock_inventory_item(item_id: int):
    try:
        body = RestockRequest().load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 400
    row = InventoryItem.query.get(item_id)
    if not row:
        return jsonify({"error": "not_found", "message": f"inventory {item_id} not found"}), 404
    row.current_stock += body["amount"]
    row.last_restock_date = datetime.utcnow()
    db.session.commit()
    return jsonify({"ok": True}), 200

@inventory_bp.get("/low-stock")
def list_low_stock():
    rows = InventoryItem.query.filter(InventoryItem.current_stock <= InventoryItem.min_threshold) \
                              .order_by((InventoryItem.current_stock - InventoryItem.min_threshold)).all()
    data = [{"id": r.id, "item_name": r.item_name, "current_stock": r.current_stock,
             "min_threshold": r.min_threshold, "unit": r.unit,
             "last_restock_date": r.last_restock_date.isoformat() if r.last_restock_date else None} for r in rows]
    return jsonify(data), 200

@inventory_bp.get("/<int:item_id>")
def get_inventory_item(item_id: int):
    row = InventoryItem.query.get(item_id)
    if not row:
        return jsonify({"error": "not_found", "message": f"inventory {item_id} not found"}), 404
    return jsonify({
        "id": row.id, "item_name": row.item_name, "current_stock": row.current_stock,
        "min_threshold": row.min_threshold, "unit": row.unit,
        "last_restock_date": row.last_restock_date.isoformat() if row.last_restock_date else None
    }), 200

@inventory_bp.put("/<int:item_id>")
def update_inventory_item(item_id: int):
    from marshmallow import ValidationError
    try:
        body = InventoryUpdate().load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 400
    row = InventoryItem.query.get(item_id)
    if not row:
        return jsonify({"error": "not_found", "message": f"inventory {item_id} not found"}), 404
    for k, v in body.items():
        setattr(row, k, v)
    db.session.commit()
    return jsonify({"ok": True}), 200


@inventory_bp.delete("/<int:item_id>")
def delete_inventory_item(item_id: int):
    svc_delete(item_id)
    return ("", 204)
