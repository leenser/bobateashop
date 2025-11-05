from marshmallow import Schema, fields, validate

class InventoryBase(Schema):
    item_name = fields.String(required=True)
    current_stock = fields.Float(required=True, validate=validate.Range(min=0))
    min_threshold = fields.Float(required=True, validate=validate.Range(min=0))
    unit = fields.String(required=True)

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(Schema):
    item_name = fields.String()
    current_stock = fields.Float(validate=validate.Range(min=0))
    min_threshold = fields.Float(validate=validate.Range(min=0))
    unit = fields.String()

class InventoryItem(InventoryBase):
    id = fields.Int(required=True)
    last_restock_date = fields.DateTime(allow_none=True)
    status = fields.String(load_default=None)  # derived: "Low Stock", etc.

class RestockRequest(Schema):
    amount = fields.Float(required=True, validate=validate.Range(min=0.0001))
