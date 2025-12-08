from app.db import db
from app.db.models import Product, ProductIngredient, InventoryItem
from app.utils.errors import NotFoundError, BadRequestError


def list_products_grouped_by_category():
    # TEMP IMPLEMENTATION:
    # Return hardcoded structure like AppStore.getProductsByCategory() fallback
    # Later: query Product table, group by category.
    return {
        "Milk Tea": [
            {
                "id": 1,
                "name": "Brown Sugar Milk Tea",
                "price": 5.50,
                "is_popular": True,
                "description": "Classic brown sugar boba drink"
            }
        ],
        "Fruit Tea": [
            {
                "id": 2,
                "name": "Strawberry Fruit Tea",
                "price": 5.25,
                "is_popular": False,
                "description": "Strawberry + jasmine green tea"
            }
        ]
    }


def create_product(body: dict):
    # Validate required fields
    name = body.get("name")
    category = body.get("category")
    base_price = body.get("base_price")

    if name is None or category is None or base_price is None:
        raise BadRequestError("name, category, and base_price are required")
    
    # Ensure name and category are not empty strings
    if not isinstance(name, str) or not name.strip():
        raise BadRequestError("name must be a non-empty string")
    if not isinstance(category, str) or not category.strip():
        raise BadRequestError("category must be a non-empty string")
    
    # Ensure base_price is a valid number
    try:
        base_price = float(base_price)
        if base_price <= 0:
            raise BadRequestError("base_price must be greater than 0")
    except (ValueError, TypeError):
        raise BadRequestError("base_price must be a valid number")

    # Ensure is_popular is a boolean
    is_popular = body.get("is_popular", False)
    if not isinstance(is_popular, bool):
        is_popular = bool(is_popular)
    
    # Ensure description is a string (can be empty)
    description = body.get("description", "")
    if description is None:
        description = ""
    if not isinstance(description, str):
        description = str(description)

    p = Product(
        name=name.strip(),
        category=category.strip(),
        base_price=base_price,
        is_popular=is_popular,
        description=description
    )
    db.session.add(p)
    db.session.commit()

    return {
        "id": p.id,
        "name": p.name,
        "category": p.category,
        "base_price": p.base_price,
        "is_popular": p.is_popular,
        "description": p.description,
    }


def update_product(product_id: int, body: dict):
    p: Product | None = Product.query.get(product_id)
    if p is None:
        raise NotFoundError(f"product {product_id} not found")

    # update allowed fields
    if "name" in body:
        p.name = body["name"]
    if "category" in body:
        p.category = body["category"]
    if "base_price" in body:
        p.base_price = body["base_price"]
    if "is_popular" in body:
        p.is_popular = body["is_popular"]
    if "description" in body:
        p.description = body["description"]

    db.session.commit()

    return {
        "id": p.id,
        "name": p.name,
        "category": p.category,
        "base_price": p.base_price,
        "is_popular": p.is_popular,
        "description": p.description,
    }


def delete_product(product_id: int):
    p: Product | None = Product.query.get(product_id)
    if p is None:
        raise NotFoundError(f"product {product_id} not found")

    # also delete any ingredient links for this product
    ProductIngredient.query.filter_by(product_id=product_id).delete()

    db.session.delete(p)
    db.session.commit()


def list_product_ingredients(product_id: int):
    # later: join ProductIngredient -> InventoryItem to show "oat milk 200 ml"
    links = ProductIngredient.query.filter_by(product_id=product_id).all()

    # build a friendly response
    result = []
    for link in links:
        inv: InventoryItem | None = InventoryItem.query.get(link.inventory_id)
        result.append({
            "inventory_id": link.inventory_id,
            "item_name": inv.item_name if inv else None,
            "quantity_used": link.quantity_used,
            "unit": link.unit,
        })

    return result


def add_product_ingredient(product_id: int, body: dict):
    inventory_id = body.get("inventory_id")
    quantity_used = body.get("quantity_used")
    unit = body.get("unit")

    if inventory_id is None or quantity_used is None or unit is None:
        raise BadRequestError("inventory_id, quantity_used, and unit are required")

    # sanity check product / inventory exist
    if Product.query.get(product_id) is None:
        raise NotFoundError(f"product {product_id} not found")
    if InventoryItem.query.get(inventory_id) is None:
        raise NotFoundError(f"inventory {inventory_id} not found")

    link = ProductIngredient(
        product_id=product_id,
        inventory_id=inventory_id,
        quantity_used=quantity_used,
        unit=unit,
    )
    db.session.add(link)
    db.session.commit()


def delete_product_ingredient(product_id: int, inventory_id: int):
    row = ProductIngredient.query.filter_by(
        product_id=product_id,
        inventory_id=inventory_id
    ).first()

    if row is None:
        # idempotent delete is fine - just return
        return

    db.session.delete(row)
    db.session.commit()
