from . import db
from datetime import datetime

class Product(db.Model):
    __tablename__ = "product"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    base_price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String, nullable=False)
    is_popular = db.Column(db.Boolean, default=False)
    description = db.Column(db.String)

class InventoryItem(db.Model):
    __tablename__ = "inventory"
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String, nullable=False)
    current_stock = db.Column(db.Float, nullable=False)
    min_threshold = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String, nullable=False)
    last_restock_date = db.Column(db.DateTime, default=datetime.utcnow)

class ProductIngredient(db.Model):
    __tablename__ = "productinventory"
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), primary_key=True)
    inventory_id = db.Column(db.Integer, db.ForeignKey("inventory.id"), primary_key=True)
    quantity_used = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String, nullable=False)

class Cashier(db.Model):
    __tablename__ = "cashier"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    employee_code = db.Column(db.String, nullable=False)
    role = db.Column(db.String, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    hire_date = db.Column(db.DateTime, default=datetime.utcnow)

class Order(db.Model):
    __tablename__ = "orders"
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, nullable=True)
    cashier_id = db.Column(db.Integer, db.ForeignKey("cashier.id"), nullable=True)
    subtotal = db.Column(db.Float, nullable=False)
    tax = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
    order_time = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String, default="Complete")
    items = db.relationship("OrderItem", backref="order", cascade="all, delete-orphan", lazy="selectin")
    payments = db.relationship("Payment", backref="order", cascade="all, delete-orphan", lazy="selectin")

class OrderItem(db.Model):
    __tablename__ = "orderitem"
    # composite key in Java version, we’ll just give it an id for sanity
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    customizations = db.Column(db.String)  # "50% ice, oat milk, boba"
    line_price = db.Column(db.Float, nullable=False)

class Payment(db.Model):
    __tablename__ = "payments"
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    amount_paid = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String, nullable=False)  # "cash", "card", "other"
    payment_time = db.Column(db.DateTime, default=datetime.utcnow)

class ZClosure(db.Model):
    __tablename__ = "z_closure"
    id = db.Column(db.Integer, primary_key=True)
    closed_at = db.Column(db.DateTime, default=datetime.utcnow)