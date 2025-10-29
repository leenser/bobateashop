from flask import Blueprint, jsonify

inventory_bp = Blueprint("inventory", __name__)

@inventory_bp.get("/")
def inventory_root():
    return jsonify({"ok": True, "area": "inventory"}), 200