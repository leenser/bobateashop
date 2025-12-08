# app/routes/products_routes.py
from marshmallow import ValidationError
from app.schemas import ProductCreate, ProductUpdate
from app.services.products_service import create_product as svc_create, update_product as svc_update, delete_product as svc_delete
from app.db.models import Product
from flask import Blueprint, jsonify, request
from app.services.products_service import list_products_grouped_by_category

products_bp = Blueprint("products", __name__)

@products_bp.get("/all")
def list_products_flat():
    items = Product.query.order_by(Product.category, Product.name).all()
    data = [{"id": p.id, "name": p.name, "category": p.category, "base_price": p.base_price,
             "is_popular": p.is_popular, "description": p.description} for p in items]
    return jsonify(data), 200

@products_bp.post("/")
def create_product():
    try:
        body = ProductCreate().load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 400
    except Exception as e:
        print(f"ERROR in create_product validation: {repr(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "validation_error", "message": str(e)}), 400
    
    try:
        res = svc_create(body)
        return jsonify(res), 201
    except Exception as e:
        print(f"ERROR in create_product service: {repr(e)}")
        import traceback
        traceback.print_exc()
        raise  # Re-raise so error handler catches it

@products_bp.put("/<int:product_id>")
def update_product(product_id: int):
    try:
        body = ProductUpdate().load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 400
    res = svc_update(product_id, body)
    return jsonify(res), 200

@products_bp.delete("/<int:product_id>")
def delete_product(product_id: int):
    svc_delete(product_id)
    return ("", 204)

@products_bp.get("/")
def list_products_grouped():
    return jsonify(list_products_grouped_by_category()), 200

@products_bp.get("/<int:product_id>")
def get_product(product_id: int):
    p = Product.query.get(product_id)
    if not p:
        return jsonify({"error":"not_found", "message": f"product {product_id} not found"}), 404
    return jsonify({
        "id": p.id, "name": p.name, "category": p.category,
        "base_price": p.base_price, "is_popular": p.is_popular,
        "description": p.description
    }), 200

from app.services.products_service import (
    list_product_ingredients as svc_list_ing,
    add_product_ingredient as svc_add_ing,
    delete_product_ingredient as svc_del_ing
)
from app.schemas import ProductIngredientLinkCreate

# --- Product <-> Inventory (recipe) ---
@products_bp.get("/<int:product_id>/ingredients")
def list_product_ingredients(product_id: int):
    return jsonify(svc_list_ing(product_id)), 200

@products_bp.post("/<int:product_id>/ingredients")
def add_product_ingredient(product_id: int):
    try:
        body = ProductIngredientLinkCreate().load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({"errors": e.messages}), 400
    svc_add_ing(product_id, body)
    return jsonify({"ok": True}), 201

@products_bp.delete("/<int:product_id>/ingredients/<int:inventory_id>")
def remove_product_ingredient(product_id: int, inventory_id: int):
    svc_del_ing(product_id, inventory_id)
    return ("", 204)

from sqlalchemy import select, distinct
from app.db import db

@products_bp.get("/categories")
def list_categories():
    rows = db.session.execute(select(distinct(Product.category))).all()
    return jsonify([r[0] for r in rows]), 200
