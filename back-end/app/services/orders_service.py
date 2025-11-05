from datetime import datetime
from app.db import db
from app.db.models import Order, OrderItem, Payment
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
          "line_price": 10.50
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
    subtotal = sum(item["line_price"] for item in items)
    tax = round(subtotal * 0.0825, 2)  # placeholder: 8.25% tax
    total = subtotal + tax

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

    for it in items:
        row = OrderItem(
            order_id=order.id,
            product_id=it["product_id"],
            quantity=it["quantity"],
            customizations=it.get("customizations", ""),
            line_price=it["line_price"],
        )
        db.session.add(row)

    pay_row = Payment(
        order_id=order.id,
        amount_paid=payment["amount"],
        payment_method=payment["method"],
        payment_time=datetime.utcnow(),
    )
    db.session.add(pay_row)

    db.session.commit()

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
