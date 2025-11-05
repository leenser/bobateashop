from marshmallow import Schema, fields, validate

Money = fields.Float  # consider decimal-as-string if you want exact money

class PaginationQuery(Schema):
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    page_size = fields.Int(load_default=50, validate=validate.Range(min=1, max=200))

class DateRangeQuery(Schema):
    from_ = fields.Date(load_default=None, data_key="from")
    to = fields.Date(load_default=None)

class MetaOptions(Schema):
    ice_levels = fields.List(fields.String(), required=True)
    sweetness_levels = fields.List(fields.String(), required=True)
    bases = fields.List(fields.String(), required=True)
    toppings = fields.List(fields.Dict(), required=True)       # {key,label}
    flavor_shots = fields.List(fields.Dict(), required=True)   # {key,label}
