from datetime import datetime
from app.db import db
from app.db.models import Order, OrderItem, Payment, Product
from app.utils.errors import BadRequestError

def create_order(payload: dict):
    """
    payload is expected to look like:
    {
      "cashier_id": 3,
      "items": [
        {
          "product_id": 12,
          "quantity": 2,
          "customizations": "50% ice, oat milk, boba",
          "line_price": 10.50  # optional; server recomputes using product price
        }
      ],
      "payment": {
        "method": "card",
        "amount": 10.50
      }
    }
    """
    cashier_id = payload.get("cashier_id")
    items = payload.get("items", [])
    payment = payload.get("payment")

    if not items:
        raise BadRequestError("order must include at least one item")
    if payment is None:
        raise BadRequestError("payment is required")

    # compute subtotal / tax / total like Java did
    product_ids = [it["product_id"] for it in items]
    if not product_ids:
        raise BadRequestError("order must reference valid products")

    rows = Product.query.filter(Product.id.in_(product_ids)).all()
    price_map = {row.id: float(row.base_price) for row in rows}
    missing = sorted({pid for pid in product_ids if pid not in price_map})
    if missing:
        raise BadRequestError(f"product(s) not found: {', '.join(map(str, missing))}")

    computed_items = []
    subtotal = 0.0
    for raw in items:
        pid = raw["product_id"]
        qty = raw["quantity"]
        base_price = price_map[pid]
        line_total = round(base_price * qty, 2)
        subtotal += line_total
        computed_items.append(
            {
                "product_id": pid,
                "quantity": qty,
                "customizations": raw.get("customizations", "") or "",
                "line_total": line_total,
            }
        )

    subtotal = round(subtotal, 2)
    tax = round(subtotal * 0.0825, 2)  # placeholder: 8.25% tax
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
    db.session.flush()  # get order.id without full commit yet

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
    """
    Return recent orders in the shape Dashboard needs:
    title, description, status, cashier, time, total_money
    For now, fake it. Later: join Order, OrderItem, Cashier.
    """
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
