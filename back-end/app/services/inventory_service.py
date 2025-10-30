from app.db import db
from app.db.models import InventoryItem
from app.utils.errors import NotFoundError, BadRequestError

def list_inventory():
    items = InventoryItem.query.all()
    # shape this similar to Manager Inventory table in Java app
    return [
        {
            "id": i.id,
            "item_name": i.item_name,
            "current_stock": i.current_stock,
            "min_threshold": i.min_threshold,
            "unit": i.unit,
            "last_restock_date": i.last_restock_date.isoformat() if i.last_restock_date else None,
            # priority fields (Low Stock / High etc.) can be derived here later
        }
        for i in items
    ]

def create_inventory_item(body: dict):
    required = ["item_name", "current_stock", "min_threshold", "unit"]
    for field in required:
        if field not in body:
            raise BadRequestError(f"{field} is required")

    row = InventoryItem(
        item_name=body["item_name"],
        current_stock=body["current_stock"],
        min_threshold=body["min_threshold"],
        unit=body["unit"],
        # allow optional last_restock_date override later
    )
    db.session.add(row)
    db.session.commit()
    return {"id": row.id}

def delete_inventory_item(item_id: int):
    row = InventoryItem.query.get(item_id)
    if row is None:
        raise NotFoundError(f"inventory {item_id} not found")
    db.session.delete(row)
    db.session.commit()
