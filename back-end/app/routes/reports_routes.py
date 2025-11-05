from flask import Blueprint, jsonify, request

reports_bp = Blueprint("reports", __name__)

@reports_bp.get("/")
def reports_root():
    # TODO: Optionally list available reports or give a brief status.
    return jsonify({"ok": True, "reports": ["x-report", "z-report", "summary", "weekly-items", "daily-top"]}), 200

@reports_bp.get("/x-report")
def x_report():
    # TODO: Return hourly breakdown since last Z close (X report).
    # Shape: [{"hour": 14, "sales": 125.40, "orders": 9, "returns": 5.00, "voids": 0.00, "discards": 3.50, "cash": 60.00, "card": 65.40, "other": 0.00}, ...]
    # Implementation: Aggregate Orders/Payments grouped by hour, bounded by last ZClosure timestamp.
    return jsonify([]), 200

@reports_bp.post("/z-report")
def z_report():
    # TODO: Produce a Z-report summary over the period since the last Z close, and then reset (create a new ZClosure row).
    # Body can include {"reset": true|false} to control whether to persist the closure, default true.
    # Response fields may include totals by tender, gross sales, tax, counts, and the period window.
    body = request.get_json(silent=True) or {}
    reset = body.get("reset", True)
    return jsonify({
        "period_start": None,
        "period_end": None,
        "gross_sales": 0.0,
        "tax_total": 0.0,
        "orders_total": 0,
        "returns_total": 0.0,
        "voids_total": 0.0,
        "discards_total": 0.0,
        "cash_total": 0.0,
        "card_total": 0.0,
        "other_total": 0.0,
        "reset_performed": reset
    }), 200

@reports_bp.get("/summary")
def summary():
    # TODO: Return an aggregate sales summary for a date range.
    # Accept query params: from=YYYY-MM-DD, to=YYYY-MM-DD.
    # Used by dashboard KPIs or analytics pages.
    return jsonify({"from": None, "to": None, "gross_sales": 0.0, "orders": 0}), 200

@reports_bp.get("/weekly-items")
def weekly_items():
    # TODO: Return data for the dashboard pie chart: item mix over the last 7 days.
    # Shape: [{"name":"Brown Sugar Milk Tea","value":42}, ...]
    return jsonify([]), 200

@reports_bp.get("/daily-top")
def daily_top_item():
    # TODO: Return data for the dashboard bar chart: top-selling item by day for the last N days.
    # Shape: [{"day":"Mon","item":"Brown Sugar Milk Tea","value":12}, ...]
    return jsonify([]), 200