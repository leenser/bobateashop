from marshmallow import Schema, fields, validate

class EmployeeBase(Schema):
    name = fields.String(required=True)
    employee_code = fields.String(required=True)
    role = fields.String(required=True, validate=validate.OneOf(["cashier", "manager", "admin"]))
    is_active = fields.Bool(load_default=True)

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(Schema):
    name = fields.String()
    employee_code = fields.String()
    role = fields.String(validate=validate.OneOf(["cashier", "manager", "admin"]))
    is_active = fields.Bool()

class Employee(EmployeeBase):
    id = fields.Int(required=True)
    hire_date = fields.DateTime(allow_none=True)

class EmployeeActiveToggle(Schema):
    is_active = fields.Bool(required=True)
