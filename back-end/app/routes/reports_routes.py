from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from sqlalchemy import text
from app.db import db
from app.db.models import ZClosure

reports_bp = Blueprint("reports", __name__)

@reports_bp.get("/")
def reports_root():
    return jsonify({"ok": True, "reports": ["x-report", "z-report", "summary", "weekly-items", "daily-top"]}), 200

@reports_bp.get("/x-report")
def x_report():
    # Determine start time = last Z close; if none, start of current UTC day
    last_close = db.session.query(ZClosure.closed_at).order_by(ZClosure.closed_at.desc()).first()
    now = datetime.utcnow()
    if last_close and last_close[0] is not None:
        start_ts = last_close[0]
    else:
        start_ts = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Aggregate orders by hour (UTC) since start_ts
    # PostgreSQL uses EXTRACT instead of STRFTIME, and camelCase column names
    orders_sql = text(
        """
        SELECT EXTRACT(HOUR FROM ordertime)::integer AS hr,
               COUNT(1) AS orders_cnt,
               COALESCE(SUM(total), 0.0) AS sales_sum
        FROM orders
        WHERE ordertime >= :start_ts
        GROUP BY hr
        ORDER BY hr
        """
    )
    payments_sql = text(
        """
        SELECT EXTRACT(HOUR FROM paymenttime)::integer AS hr,
               LOWER(paymentmethod) AS method,
               COALESCE(SUM(amountpaid), 0.0) AS amt
        FROM payment
        WHERE paymenttime >= :start_ts
        GROUP BY hr, method
        """
    )

    orders_rows = db.session.execute(orders_sql, {"start_ts": start_ts}).all()
    payments_rows = db.session.execute(payments_sql, {"start_ts": start_ts}).all()

    # Build result keyed by hour with zeroed defaults
    result_map: dict[int, dict] = {}

    for hr, orders_cnt, sales_sum in orders_rows:
        result_map[int(hr)] = {
            "hour": int(hr),
            "sales": float(sales_sum or 0.0),
            "orders": int(orders_cnt or 0),
            "returns": 0.0,
            "voids": 0.0,
            "discards": 0.0,
            "cash": 0.0,
            "card": 0.0,
            "other": 0.0,
        }

    for hr, method, amt in payments_rows:
        hr_i = int(hr)
        row = result_map.get(hr_i)
        if row is None:
            row = {
                "hour": hr_i,
                "sales": 0.0,
                "orders": 0,
                "returns": 0.0,
                "voids": 0.0,
                "discards": 0.0,
                "cash": 0.0,
                "card": 0.0,
                "other": 0.0,
            }
            result_map[hr_i] = row
        m = (method or "").lower()
        if m in ("cash", "card", "other"):
            row[m] = float(amt or 0.0)

    # Return sorted by hour ascending
    data = [result_map[k] for k in sorted(result_map.keys())]
    return jsonify(data), 200

@reports_bp.post("/z-report")
def z_report():
    # Body can include {"reset": true|false} to control whether to persist the closure, default true.
    # Response fields may include totals by tender, gross sales, tax, counts, and the period window.
    body = request.get_json(silent=True) or {}
    reset = body.get("reset", True)

    # Determine reporting window: from last Z close (or start of day) to now
    last_close = db.session.query(ZClosure.closed_at).order_by(ZClosure.closed_at.desc()).first()
    now = datetime.utcnow()
    if last_close and last_close[0] is not None:
        start_ts = last_close[0]
    else:
        start_ts = now.replace(hour=0, minute=0, second=0, microsecond=0)

    end_ts = now

    # Aggregate orders over the window
    # PostgreSQL uses COALESCE instead of IFNULL, and camelCase column names
    orders_sql = text(
        """
        SELECT COALESCE(SUM(total), 0.0) AS gross_sales,
               COALESCE(SUM(tax), 0.0)   AS tax_total,
               COUNT(1)                AS orders_total
        FROM orders
        WHERE ordertime >= :start_ts AND ordertime < :end_ts
        """
    )
    orders_row = db.session.execute(orders_sql, {"start_ts": start_ts, "end_ts": end_ts}).first()
    gross_sales = float(orders_row[0] or 0.0) if orders_row else 0.0
    tax_total = float(orders_row[1] or 0.0) if orders_row else 0.0
    orders_total = int(orders_row[2] or 0) if orders_row else 0

    # Aggregate payments by method over the window
    payments_sql = text(
        """
        SELECT LOWER(paymentmethod) AS method,
               COALESCE(SUM(amountpaid), 0.0) AS amt
        FROM payment
        WHERE paymenttime >= :start_ts AND paymenttime < :end_ts
        GROUP BY method
        """
    )
    payments_rows = db.session.execute(payments_sql, {"start_ts": start_ts, "end_ts": end_ts}).all()
    cash_total = 0.0
    card_total = 0.0
    other_total = 0.0
    for method, amt in payments_rows:
        m = (method or "").lower()
        if m == "cash":
            cash_total = float(amt or 0.0)
        elif m == "card":
            card_total = float(amt or 0.0)
        elif m == "other":
            other_total = float(amt or 0.0)

    # Placeholder zeros for returns/voids/discards 
    returns_total = 0.0
    voids_total = 0.0
    discards_total = 0.0

    # Optionally persist a new Z closure (reset)
    if reset:
        z = ZClosure(closed_at=now)
        db.session.add(z)
        db.session.commit()

    return jsonify({
        "period_start": start_ts.isoformat() + "Z",
        "period_end": end_ts.isoformat() + "Z",
        "gross_sales": gross_sales,
        "tax_total": tax_total,
        "orders_total": orders_total,
        "returns_total": returns_total,
        "voids_total": voids_total,
        "discards_total": discards_total,
        "cash_total": cash_total,
        "card_total": card_total,
        "other_total": other_total,
        "reset_performed": reset
    }), 200

@reports_bp.get("/summary")
def summary():
    start_str = request.args.get("from")
    end_str = request.args.get("to")
    if not start_str or not end_str:
        return jsonify({"error": "Missing required query params 'from' and 'to' (YYYY-MM-DD)."}), 400

    try:
        start_date = datetime.strptime(start_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_str, "%Y-%m-%d")
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    start_ts = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_ts = (end_date + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)

    # PostgreSQL uses COALESCE and camelCase column names
    sql = text(
        """
        SELECT COALESCE(SUM(total), 0.0) AS gross_sales,
               COUNT(1)                AS orders_cnt
        FROM orders
        WHERE ordertime >= :start_ts AND ordertime < :end_ts
        """
    )
    row = db.session.execute(sql, {"start_ts": start_ts, "end_ts": end_ts}).first()
    gross_sales = float(row[0] or 0.0) if row else 0.0
    orders_cnt = int(row[1] or 0) if row else 0

    return jsonify({
        "from": start_str,
        "to": end_str,
        "gross_sales": gross_sales,
        "orders": orders_cnt,
    }), 200

@reports_bp.get("/weekly-items")
def weekly_items():
    now = datetime.utcnow()
    start_ts = now - timedelta(days=7)

    # PostgreSQL uses COALESCE and camelCase column names
    sql = text(
        """
        SELECT p.name AS name,
               COALESCE(SUM(oi.quantity), 0) AS qty
        FROM orderitem oi
        JOIN product p ON p.id = oi.productid
        JOIN orders o  ON o.id = oi.orderid
        WHERE o.ordertime >= :start_ts
        GROUP BY p.name
        ORDER BY qty DESC
        """
    )

    rows = db.session.execute(sql, {"start_ts": start_ts}).all()
    data = [{"name": r[0], "value": int(r[1] or 0)} for r in rows]
    return jsonify(data), 200

@reports_bp.get("/daily-top")
def daily_top_item():
    days_param = request.args.get("days")
    try:
        days = int(days_param) if days_param is not None else 7
    except ValueError:
        days = 7
    if days < 1:
        days = 1
    if days > 31:
        days = 31

    now = datetime.utcnow()
    start_ts = now - timedelta(days=days)

    # PostgreSQL uses COALESCE and camelCase column names
    # Use DATE() or CAST for date conversion
    sql = text(
        """
        SELECT t.day, t.name, t.qty
        FROM (
            SELECT DATE(o.ordertime) AS day,
                   p.name AS name,
                   COALESCE(SUM(oi.quantity), 0) AS qty
            FROM orderitem oi
            JOIN product p ON p.id = oi.productid
            JOIN orders  o ON o.id = oi.orderid
            WHERE o.ordertime >= :start_ts
            GROUP BY day, p.name
        ) AS t
        JOIN (
            SELECT day, MAX(qty) AS max_qty
            FROM (
                SELECT DATE(o.ordertime) AS day,
                       p.name AS name,
                       COALESCE(SUM(oi.quantity), 0) AS qty
                FROM orderitem oi
                JOIN product p ON p.id = oi.productid
                JOIN orders  o ON o.id = oi.orderid
                WHERE o.ordertime >= :start_ts
                GROUP BY day, p.name
            ) x
            GROUP BY day
        ) AS m
        ON m.day = t.day AND m.max_qty = t.qty
        ORDER BY t.day ASC, t.name ASC
        """
    )

    rows = db.session.execute(sql, {"start_ts": start_ts}).all()

    # If multiple items tie for a day, pick the first alphabetically
    seen_days = set()
    data = []
    for day_str, name, qty in rows:
        if day_str in seen_days:
            continue
        seen_days.add(day_str)
        try:
            day_label = datetime.strptime(day_str, "%Y-%m-%d").strftime("%a")
        except Exception:
            day_label = day_str
        data.append({
            "day": day_label,
            "item": name,
            "value": int(qty or 0)
        })

    return jsonify(data), 200
