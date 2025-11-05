from marshmallow import Schema, fields, validate

class OrderItemCreate(Schema):
    product_id = fields.Int(required=True)
    quantity = fields.Int(required=True, validate=validate.Range(min=1))
    customizations = fields.String(load_default="")  # e.g., "50% ice, oat milk, boba"
    line_price = fields.Float(required=True)         # client-side calc OK for now; server will recompute

class PaymentIn(Schema):
    method = fields.String(required=True, validate=validate.OneOf(["cash", "card", "other"]))
    amount = fields.Float(required=True, validate=validate.Range(min=0))

class OrderCreate(Schema):
    cashier_id = fields.Int(load_default=None, allow_none=True)
    items = fields.List(fields.Nested(OrderItemCreate), required=True, validate=validate.Length(min=1))
    payment = fields.Nested(PaymentIn, required=True)

class OrderItemOut(Schema):
    product_id = fields.Int(required=True)
    quantity = fields.Int(required=True)
    customizations = fields.String(required=True)
    line_price = fields.Float(required=True)

class PaymentOut(Schema):
    method = fields.String(required=True)
    amount = fields.Float(required=True)

class Order(Schema):
    id = fields.Int(required=True)
    cashier_id = fields.Int(allow_none=True)
    subtotal = fields.Float(required=True)
    tax = fields.Float(required=True)
    total = fields.Float(required=True)
    order_time = fields.DateTime(required=True)
    status = fields.String(required=True, validate=validate.OneOf(["Complete", "Refunded", "Voided"]))
    items = fields.List(fields.Nested(OrderItemOut), required=True)
    payments = fields.List(fields.Nested(PaymentOut), required=True)

class OrdersList(Schema):
    orders = fields.List(fields.Nested(Order), required=True)
    page = fields.Int(required=True)
    page_size = fields.Int(required=True)
    total = fields.Int(required=True)

class RefundRequest(Schema):
    amount = fields.Float(load_default=None, allow_none=True)  # null → full refund
