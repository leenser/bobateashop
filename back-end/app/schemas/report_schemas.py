from marshmallow import Schema, fields

class XReportRow(Schema):
    hour = fields.Int(required=True)
    sales = fields.Float(required=True)
    orders = fields.Int(required=True)
    returns = fields.Float(required=True)
    voids = fields.Float(required=True)
    discards = fields.Float(required=True)
    cash = fields.Float(required=True)
    card = fields.Float(required=True)
    other = fields.Float(required=True)

class XReport(Schema):
    data = fields.List(fields.Nested(XReportRow), required=True)

class ZReportRequest(Schema):
    reset = fields.Bool(load_default=True)

class ZReport(Schema):
    period_start = fields.DateTime(allow_none=True)
    period_end = fields.DateTime(allow_none=True)
    gross_sales = fields.Float(required=True)
    tax_total = fields.Float(required=True)
    orders_total = fields.Int(required=True)
    returns_total = fields.Float(required=True)
    voids_total = fields.Float(required=True)
    discards_total = fields.Float(required=True)
    cash_total = fields.Float(required=True)
    card_total = fields.Float(required=True)
    other_total = fields.Float(required=True)
    reset_performed = fields.Bool(required=True)

class WeeklyItemsPoint(Schema):
    name = fields.String(required=True)
    value = fields.Int(required=True)

class DailyTopPoint(Schema):
    day = fields.String(required=True)
    item = fields.String(required=True)
    value = fields.Int(required=True)

class Summary(Schema):
    from_ = fields.Date(data_key="from")
    to = fields.Date()
    gross_sales = fields.Float(required=True)
    orders = fields.Int(required=True)
