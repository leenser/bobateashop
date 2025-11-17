from . import db
from datetime import datetime

class Product(db.Model):
    __tablename__ = "product"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    base_price = db.Column("baseprice", db.Float, nullable=False)  # PostgreSQL uses camelCase
    category = db.Column(db.String, nullable=False)
    is_popular = db.Column("ispopular", db.Boolean, default=False)  # PostgreSQL uses camelCase
    description = db.Column(db.String)

class InventoryItem(db.Model):
    __tablename__ = "inventory"
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column("itemname", db.String, nullable=False)  # PostgreSQL uses camelCase
    current_stock = db.Column("currentstock", db.Float, nullable=False)  # PostgreSQL uses camelCase
    min_threshold = db.Column("minthreshold", db.Float, nullable=False)  # PostgreSQL uses camelCase
    unit = db.Column(db.String, nullable=False)
    last_restock_date = db.Column("date", db.Date, default=datetime.utcnow)  # PostgreSQL uses 'date' not 'last_restock_date'

class ProductIngredient(db.Model):
    __tablename__ = "productinventory"
    product_id = db.Column("productid", db.Integer, db.ForeignKey("product.id"), primary_key=True)  # PostgreSQL uses camelCase
    inventory_id = db.Column("inventoryid", db.Integer, db.ForeignKey("inventory.id"), primary_key=True)  # PostgreSQL uses camelCase
    quantity_used = db.Column("quantityused", db.Float, nullable=False)  # PostgreSQL uses camelCase
    unit = db.Column(db.String, nullable=False)

class Cashier(db.Model):
    __tablename__ = "cashier"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    employee_code = db.Column("employeecode", db.String, nullable=False)  # PostgreSQL uses camelCase
    role = db.Column(db.String, nullable=False)
    is_active = db.Column("isactive", db.Boolean, default=True)  # PostgreSQL uses camelCase
    hire_date = db.Column("hiredate", db.Date, default=datetime.utcnow)  # PostgreSQL uses camelCase

class Order(db.Model):
    __tablename__ = "orders"
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column("customerid", db.Integer, nullable=True)  # PostgreSQL uses camelCase
    cashier_id = db.Column("cashierid", db.Integer, db.ForeignKey("cashier.id"), nullable=True)  # PostgreSQL uses camelCase
    subtotal = db.Column(db.Float, nullable=False)
    tax = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
    order_time = db.Column("ordertime", db.DateTime, default=datetime.utcnow)  # PostgreSQL uses camelCase
    status = db.Column(db.String, default="Complete")
    items = db.relationship("OrderItem", backref="order", cascade="all, delete-orphan", lazy="selectin")
    payments = db.relationship("Payment", backref="order", cascade="all, delete-orphan", lazy="selectin")

class OrderItem(db.Model):
    __tablename__ = "orderitem"
    # composite key in Java version, we'll just give it an id for sanity
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column("orderid", db.Integer, db.ForeignKey("orders.id"), nullable=False)  # PostgreSQL uses camelCase
    product_id = db.Column("productid", db.Integer, db.ForeignKey("product.id"), nullable=False)  # PostgreSQL uses camelCase
    quantity = db.Column(db.Integer, nullable=False)
    customizations = db.Column(db.String)  # "50% ice, oat milk, boba"
    line_price = db.Column("lineprice", db.Float, nullable=False)  # PostgreSQL uses camelCase

class Payment(db.Model):
    __tablename__ = "payment"  # PostgreSQL uses 'payment' not 'payments'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column("orderid", db.Integer, db.ForeignKey("orders.id"), nullable=False)  # PostgreSQL uses camelCase
    amount_paid = db.Column("amountpaid", db.Float, nullable=False)  # PostgreSQL uses camelCase
    payment_method = db.Column("paymentmethod", db.String, nullable=False)  # PostgreSQL uses camelCase
    payment_time = db.Column("paymenttime", db.DateTime, default=datetime.utcnow)  # PostgreSQL uses camelCase

class ZClosure(db.Model):
    __tablename__ = "z_closure"
    id = db.Column(db.Integer, primary_key=True)
    closed_at = db.Column(db.DateTime, default=datetime.utcnow)