from datetime import datetime
from app.db import db
from app.db.models import (
    Product, InventoryItem, ProductIngredient,
    Cashier, Order, OrderItem, Payment, ZClosure
)

def seed():
    # PRODUCTS
    milk_tea = Product(name="Brown Sugar Milk Tea", base_price=5.50, category="Milk Tea",
                       is_popular=True, description="Classic brown sugar boba drink")
    fruit_tea = Product(name="Strawberry Fruit Tea", base_price=5.25, category="Fruit Tea",
                        is_popular=False, description="Strawberry + jasmine green tea")
    db.session.add_all([milk_tea, fruit_tea])

    # INVENTORY
    boba   = InventoryItem(item_name="Boba Pearls",          current_stock=5000,  min_threshold=1000, unit="g")
    oat    = InventoryItem(item_name="Oat Milk",             current_stock=10000, min_threshold=2000, unit="ml")
    sugar  = InventoryItem(item_name="Brown Sugar Syrup",    current_stock=8000,  min_threshold=1500, unit="ml")
    tea    = InventoryItem(item_name="Jasmine Green Tea",    current_stock=12000, min_threshold=3000, unit="ml")
    db.session.add_all([boba, oat, sugar, tea])
    db.session.flush()

    # PRODUCT RECIPES
    db.session.add_all([
        ProductIngredient(product_id=milk_tea.id,  inventory_id=boba.id,  quantity_used=80,  unit="g"),
        ProductIngredient(product_id=milk_tea.id,  inventory_id=oat.id,   quantity_used=250, unit="ml"),
        ProductIngredient(product_id=milk_tea.id,  inventory_id=sugar.id, quantity_used=30,  unit="ml"),
        ProductIngredient(product_id=fruit_tea.id, inventory_id=tea.id,   quantity_used=300, unit="ml"),
        ProductIngredient(product_id=fruit_tea.id, inventory_id=sugar.id, quantity_used=20,  unit="ml"),
    ])

    # EMPLOYEES
    ben  = Cashier(name="Benjamin", employee_code="CASH001", role="cashier", is_active=True)
    leen = Cashier(name="Leenser",  employee_code="CASH002", role="cashier", is_active=True)
    db.session.add_all([ben, leen])
    db.session.flush()

    # ONE SAMPLE ORDER
    order = Order(cashier_id=ben.id, subtotal=5.50, tax=0.45, total=5.95, status="Complete")
    db.session.add(order); db.session.flush()
    db.session.add(OrderItem(order_id=order.id, product_id=milk_tea.id, quantity=1,
                             customizations="50% ice, boba"))
    db.session.add(Payment(order_id=order.id, amount_paid=5.95, payment_method="cash", payment_time=datetime.utcnow()))
    db.session.commit()

    cups   = InventoryItem(item_name="Plastic Cups", current_stock=500, min_threshold=100, unit="count")
    lids   = InventoryItem(item_name="Cup Lids",     current_stock=500, min_threshold=100, unit="count")
    straws = InventoryItem(item_name="Straws",       current_stock=500, min_threshold=100, unit="count")
    db.session.add_all([boba, oat, sugar, tea, cups, lids, straws])

def clear_all():
    # Dev helper: wipe all tables (SQLite safe)
    for table in reversed(db.metadata.sorted_tables):
        db.session.execute(table.delete())
    db.session.commit()
