from datetime import datetime

from sqlalchemy import func

from app.db import db
from app.db.models import Order, OrderItem, Payment, Product, InventoryItem
from app.utils.errors import BadRequestError

SIZE_PRICE_DELTAS = {
    "Small": 0.00,
    "Medium": 0.50,
    "Large": 2.00,
}

DISPOSABLE_INVENTORY_ITEMS = [
    "Plastic Cups",
    "Cup Lids",
    "Straws",
]


def _is_drink_category(category: str | None) -> bool:
    """Heuristic: treat anything not explicitly 'snack/food/dessert' as a drink."""
    if not category:
        return True
    c = category.strip().lower()
    return not any(tok in c for tok in ["snack", "snacks", "food", "dessert"])


def _decrement_disposables(drink_count: int):
    """Decrement Plastic Cups / Cup Lids / Straws by drink_count (fails if missing/insufficient)."""
    if drink_count <= 0:
        return

    wanted_lc = [n.lower() for n in DISPOSABLE_INVENTORY_ITEMS]
    rows = (
        InventoryItem.query
        .filter(func.lower(InventoryItem.item_name).in_(wanted_lc))
        .all()
    )
    found = {r.item_name.lower(): r for r in rows}

    missing = [name for name in DISPOSABLE_INVENTORY_ITEMS if name.lower() not in found]
    if missing:
        raise BadRequestError(
            "Missing required inventory item(s): " + ", ".join(missing) +
            ". Add them in Admin → Inventory before checking out."
        )

    # Validate stock before mutating anything
    for name in DISPOSABLE_INVENTORY_ITEMS:
        row = found[name.lower()]
        if float(row.current_stock) < float(drink_count):
            raise BadRequestError(
                f"Insufficient stock for '{name}'. Needed {drink_count}, available {row.current_stock}."
            )

    # Mutate rows (commit happens in create_order)
    for name in DISPOSABLE_INVENTORY_ITEMS:
        row = found[name.lower()]
        row.current_stock = float(row.current_stock) - float(drink_count)


def create_order(payload: dict):
    cashier_id = payload.get("cashier_id")
    items = payload.get("items", [])
    payment = payload.get("payment")

    if not items:
        raise BadRequestError("order must include at least one item")
    if payment is None:
        raise BadRequestError("payment is required")

    product_ids = [it["product_id"] for it in items]
    if not product_ids:
        raise BadRequestError("order must reference valid products")

    rows = Product.query.filter(Product.id.in_(product_ids)).all()
    price_map = {row.id: float(row.base_price) for row in rows}
    category_map = {row.id: (row.category or "") for row in rows}

    missing = sorted({pid for pid in product_ids if pid not in price_map})
    if missing:
        raise BadRequestError(f"product(s) not found: {', '.join(map(str, missing))}")

    # Decrement disposable inventory for each drink in the order
    # (Plastic Cups, Cup Lids, Straws — 1 each per drink)
    drink_count = 0
    for raw in items:
        pid = raw["product_id"]
        qty = int(raw["quantity"])
        if _is_drink_category(category_map.get(pid)):
            drink_count += qty
    _decrement_disposables(drink_count)

    computed_items = []
    subtotal = 0.0
    for raw in items:
        pid = raw["product_id"]
        qty = raw["quantity"]
        base_price = price_map[pid]
        size_label = raw.get("size")
        size_delta = 0.0
        if size_label:
            if size_label not in SIZE_PRICE_DELTAS:
                raise BadRequestError("size must be one of Small, Medium, Large")
            size_delta = SIZE_PRICE_DELTAS[size_label]

        unit_price = base_price + size_delta
        line_total = round(unit_price * qty, 2)
        subtotal += line_total

        customizations = (raw.get("customizations", "") or "").strip()
        if size_label:
            customizations = f"Size: {size_label}" + (f"; {customizations}" if customizations else "")

        computed_items.append(
            {
                "product_id": pid,
                "quantity": qty,
                "customizations": customizations,
                "line_total": line_total,
            }
        )

    subtotal = round(subtotal, 2)
    tax = round(subtotal * 0.0825, 2)
    total = round(subtotal + tax, 2)

    order = Order(
        cashier_id=cashier_id,
        subtotal=subtotal,
        tax=tax,
        total=total,
        order_time=datetime.utcnow(),
        status="Complete",
    )
    db.session.add(order)
    db.session.flush()

    for it in computed_items:
        row = OrderItem(
            order_id=order.id,
            product_id=it["product_id"],
            quantity=it["quantity"],
            customizations=it["customizations"],
        )
        db.session.add(row)

    pay_row = Payment(
        order_id=order.id,
        amount_paid=payment["amount"],
        payment_method=payment["method"],
        payment_time=datetime.utcnow(),
        tip_amount=payment.get("tip_amount", 0.0),
    )
    db.session.add(pay_row)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"ERROR in db.session.commit(): {repr(e)}")
        import traceback
        traceback.print_exc()
        raise

    return {
        "order_id": order.id,
        "subtotal": subtotal,
        "tax": tax,
        "total": total,
    }


def recent_transactions():
    return [
        {
            "title": "Brown Sugar Milk Tea",
            "description": "XTRA boba, 50% ice",
            "status": "Complete",
            "assignee": "Benjamin",
            "time": "2:41 PM",
            "total_money": "$10.49",
        },
        {
            "title": "Strawberry Fruit Tea",
            "description": "25% sweet, no ice",
            "status": "Complete",
            "assignee": "Leenser",
            "time": "2:37 PM",
            "total_money": "$6.25",
        }
    ]
