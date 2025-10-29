from flask import Blueprint, request, jsonify
from app.services.products_service import (
    list_products_grouped_by_category,
    create_product,
    update_product,
    delete_product,
    list_product_ingredients,
    add_product_ingredient,
    delete_product_ingredient,
)

products_bp = Blueprint("products", __name__)

@products_bp.get("/")
def get_products():
    data = list_products_grouped_by_category()
    return jsonify(data), 200

@products_bp.post("/")
def post_product():
    body = request.get_json()
    new_prod = create_product(body)
    return jsonify(new_prod), 201

@products_bp.put("/<int:product_id>")
def put_product(product_id):
    body = request.get_json()
    updated = update_product(product_id, body)
    return jsonify(updated), 200

@products_bp.delete("/<int:product_id>")
def remove_product(product_id):
    delete_product(product_id)
    return "", 204

@products_bp.get("/<int:product_id>/ingredients")
def get_product_ingredients(product_id):
    data = list_product_ingredients(product_id)
    return jsonify(data), 200

@products_bp.post("/<int:product_id>/ingredients")
def post_product_ingredient(product_id):
    body = request.get_json()
    add_product_ingredient(product_id, body)
    return "", 201

@products_bp.delete("/<int:product_id>/ingredients/<int:inventory_id>")
def remove_product_ingredient(product_id, inventory_id):
    delete_product_ingredient(product_id, inventory_id)
    return "", 204