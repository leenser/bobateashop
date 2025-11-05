from marshmallow import Schema, fields

class Health(Schema):
    ok = fields.Bool(required=True)
