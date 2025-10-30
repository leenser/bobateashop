from datetime import datetime
from app.db import db
from app.db.models import ZClosure
# we'll fill in SQL-ish aggregates later from Order/Payment

def get_x_report_today():
    # Placeholder hourly buckets
    return [
        {
            "hour": 14,
            "sales": 125.40,
            "orders": 9,
            "returns": 5.00,
            "voids": 0.00,
            "discards": 3.50,
            "cash": 60.00,
            "card": 65.40,
            "other": 0.00
        }
    ]

def run_z_report_today(reset: bool):
    # Placeholder summary for Manager -> Reports tab
    summary = {
        "period_start": "2025-10-29T09:00:00Z",
        "period_end": datetime.utcnow().isoformat() + "Z",
        "gross_sales": 543.20,
        "tax_total": 45.10,
        "orders_total": 38,
        "returns_total": 10.00,
        "voids_total": 0.00,
        "discards_total": 5.00,
        "cash_total": 250.00,
        "card_total": 293.20,
        "other_total": 0.00,
    }

    if reset:
        z = ZClosure(closed_at=datetime.utcnow())
        db.session.add(z)
        db.session.commit()

    return summary
