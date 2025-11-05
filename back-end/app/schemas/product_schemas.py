from marshmallow import Schema, fields, validate

class ProductBase(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1))
    category = fields.String(required=True)
    base_price = fields.Float(required=True)  # or Decimal-as-string
    is_popular = fields.Bool(load_default=False)
    description = fields.String(load_default="")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(Schema):
    name = fields.String()
    category = fields.String()
    base_price = fields.Float()
    is_popular = fields.Bool()
    description = fields.String()

class Product(ProductBase):
    id = fields.Int(required=True)

class ProductFlatList(Schema):
    items = fields.List(fields.Nested(Product), required=True)

class ProductByCategory(Schema):
    # {"Milk Tea": [Product...], "Fruit Tea": [...]}
    # For docs, you can describe as Dict[str, List[Product]]
    # Marshmallow tip: use fields.Dict
    data = fields.Dict(keys=fields.String(), values=fields.List(fields.Nested(Product)))

class ProductIngredientLinkCreate(Schema):
    inventory_id = fields.Int(required=True)
    quantity_used = fields.Float(required=True)
    unit = fields.String(required=True)

class ProductIngredientLink(Schema):
    inventory_id = fields.Int(required=True)
    item_name = fields.String(required=True)
    quantity_used = fields.Float(required=True)
    unit = fields.String(required=True)
