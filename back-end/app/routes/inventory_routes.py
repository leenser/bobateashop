from flask import Blueprint, jsonify, request
# later: from app.services.inventory_service import list_inventory, create_inventory_item, etc.

inventory_bp = Blueprint("inventory", __name__)

@inventory_bp.get("/")
def inventory_root():
    return jsonify({"ok": True, "area": "inventory"}), 200
