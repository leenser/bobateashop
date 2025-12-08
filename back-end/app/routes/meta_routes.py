from flask import Blueprint, jsonify
from app.db import db

meta_bp = Blueprint("meta", __name__)

@meta_bp.get("/options")
def get_options():
    # Static for now; you can move these to DB later if you want
    return jsonify({
        "ice_levels": ["No Ice", "25%", "50%", "75%", "Normal"],
        "sweetness_levels": ["0%", "25%", "50%", "75%", "100%"],
        "sizes": ["Small", "Medium", "Large"],
        "bases": ["Whole Milk", "Oat Milk", "Almond Milk", "Soy Milk", "Tea Base"],
        "toppings": [
            {"key": "boba", "label": "Boba"},
            {"key": "lychee_jelly", "label": "Lychee Jelly"},
            {"key": "pudding", "label": "Egg Pudding"},
            {"key": "grass_jelly", "label": "Grass Jelly"}
        ],
        "flavor_shots": [
            {"key": "vanilla", "label": "Vanilla"},
            {"key": "caramel", "label": "Caramel"},
            {"key": "hazelnut", "label": "Hazelnut"}
        ]
    }), 200

@meta_bp.get("/health")
def health():
    # Simple DB probe so deploys/readiness checks catch DB issues
    from app.db import db
    try:
        db.session.execute(db.text("SELECT 1"))
        return jsonify({"ok": True}), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
