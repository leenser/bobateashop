from app.db import db
from app.db.models import Cashier, Order
from app.utils.errors import NotFoundError, BadRequestError

def list_cashiers():
    people = Cashier.query.all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "employee_code": c.employee_code,
            "role": c.role,
            "is_active": c.is_active,
            "hire_date": c.hire_date.isoformat() if c.hire_date else None,
        }
        for c in people
    ]

def create_cashier(body: dict):
    required = ["name", "employee_code", "role"]
    for field in required:
        if field not in body:
            raise BadRequestError(f"{field} is required")

    c = Cashier(
        name=body["name"],
        employee_code=body["employee_code"],
        role=body["role"],
        is_active=body.get("is_active", True),
    )
    db.session.add(c)
    db.session.commit()
    return {"id": c.id}

def toggle_cashier_active(cashier_id: int, active: bool):
    c = Cashier.query.get(cashier_id)
    if c is None:
        raise NotFoundError(f"cashier {cashier_id} not found")
    c.is_active = active
    db.session.commit()

def delete_cashier(cashier_id: int):
    c = Cashier.query.get(cashier_id)
    if c is None:
        raise NotFoundError(f"cashier {cashier_id} not found")

    # mirror Java logic: before deleting cashier, detach from orders
    Order.query.filter_by(cashier_id=cashier_id).update({"cashier_id": None})
    db.session.delete(c)
    db.session.commit()
