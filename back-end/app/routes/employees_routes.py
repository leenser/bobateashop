from flask import Blueprint, jsonify, request
from app.services.employees_service import (
    list_cashiers as svc_list,
    create_cashier as svc_create,
    toggle_cashier_active as svc_toggle_active,
    delete_cashier as svc_delete,
)
from app.db.models import Cashier
from app.db import db
from app.utils.errors import BadRequestError, NotFoundError

employees_bp = Blueprint("employees", __name__)

@employees_bp.get("/")
def list_employees():
    return jsonify(svc_list()), 200

@employees_bp.post("/")
def create_employee():
    body = request.get_json() or {}
    result = svc_create(body)
    return jsonify(result), 201

@employees_bp.get("/<int:employee_id>")
def get_employee(employee_id: int):
    c = Cashier.query.get(employee_id)
    if not c:
        return jsonify({
            "error": "not_found",
            "message": f"employee {employee_id} not found",
        }), 404
    return jsonify({
        "id": c.id,
        "name": c.name,
        "employee_code": c.employee_code,
        "role": c.role,
        "is_active": c.is_active,
        "hire_date": c.hire_date.isoformat() if c.hire_date else None,
    }), 200

@employees_bp.put("/<int:employee_id>")
def update_employee(employee_id: int):
    body = request.get_json() or {}
    c = Cashier.query.get(employee_id)
    if not c:
        return jsonify({
            "error": "not_found",
            "message": f"employee {employee_id} not found",
        }), 404

    # Update allowed fields only
    if "name" in body:
        c.name = body["name"]
    if "employee_code" in body:
        c.employee_code = body["employee_code"]
    if "role" in body:
        c.role = body["role"]
    if "is_active" in body:
        c.is_active = body["is_active"]

    db.session.commit()

    return jsonify({
        "id": c.id,
        "name": c.name,
        "employee_code": c.employee_code,
        "role": c.role,
        "is_active": c.is_active,
        "hire_date": c.hire_date.isoformat() if c.hire_date else None,
    }), 200

@employees_bp.patch("/<int:employee_id>/active")
def toggle_employee_active(employee_id: int):
    body = request.get_json() or {}
    if "is_active" not in body:
        raise BadRequestError("is_active is required")
    if not isinstance(body["is_active"], bool):
        raise BadRequestError("is_active must be boolean")
    svc_toggle_active(employee_id, body["is_active"])
    return jsonify({"ok": True}), 200

@employees_bp.delete("/<int:employee_id>")
def delete_employee(employee_id: int):
    try:
        svc_delete(employee_id)
    except NotFoundError:
        # Idempotent: deleting a non-existent employee still returns 204
        pass
    return ("", 204)
