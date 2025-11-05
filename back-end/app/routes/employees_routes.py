from flask import Blueprint, jsonify, request

employees_bp = Blueprint("employees", __name__)

@employees_bp.get("/")
def list_employees():
    # TODO: Return all cashiers/employees (id, name, employee_code, role, is_active, hire_date).
    return jsonify([]), 200

@employees_bp.post("/")
def create_employee():
    # TODO: Create a cashier/employee with fields: name, employee_code, role, is_active (default True).
    body = request.get_json() or {}
    return jsonify({"id": None}), 201

@employees_bp.get("/<int:employee_id>")
def get_employee(employee_id: int):
    # TODO: Return a single employee by id; 404 if missing.
    return jsonify({}), 200

@employees_bp.put("/<int:employee_id>")
def update_employee(employee_id: int):
    # TODO: Update employee fields (name, employee_code, role, is_active).
    body = request.get_json() or {}
    return jsonify({}), 200

@employees_bp.patch("/<int:employee_id>/active")
def toggle_employee_active(employee_id: int):
    # TODO: Toggle an employee's active status. Body: {"is_active": true/false}
    body = request.get_json() or {}
    return jsonify({"ok": True}), 200

@employees_bp.delete("/<int:employee_id>")
def delete_employee(employee_id: int):
    # TODO: Delete employee; before delete, detach from any linked orders (set cashier_id = NULL).
    # Return 204; idempotent OK.
    return ("", 204)