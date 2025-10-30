from flask import Blueprint, jsonify, request
# later: from app.services.reports_service import get_x_report_today, run_z_report_today

reports_bp = Blueprint("reports", __name__)

@reports_bp.get("/")
def reports_root():
    return jsonify({"ok": True, "area": "reports"}), 200

@reports_bp.get("/x-report")
def x_report():
    # placeholder for X-report (hourly breakdown since last Z close)
    demo = [
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
    return jsonify({"x_report": demo}), 200

@reports_bp.post("/z-report")
def z_report():
    # placeholder for Z-report / closeout
    body = request.get_json(silent=True) or {}
    reset = bool(body.get("reset", False))

    summary = {
        "period_start": "2025-10-29T09:00:00Z",
        "period_end": "2025-10-29T14:03:21Z",
        "gross_sales": 543.20,
        "tax_total": 45.10,
        "orders_total": 38,
        "returns_total": 10.00,
        "voids_total": 0.00,
        "discards_total": 5.00,
        "cash_total": 250.00,
        "card_total": 293.20,
        "other_total": 0.00,
        "reset_performed": reset,
    }

    return jsonify(summary), 200
