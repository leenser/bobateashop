from flask import Blueprint, jsonify, request
# later we'll import real service functions from app.services.employees_service
# for now we just stub

employees_bp = Blueprint("employees", __name__)

@employees_bp.get("/")
def employees_root():
    # basic placeholder so frontend can hit /api/employees/
    return jsonify({"ok": True, "area": "employees"}), 200
