"""
Marshmallow validation schemas for all API inputs.
"""
from marshmallow import Schema, fields, validate, ValidationError


class TelemetrySchema(Schema):
    lake_id = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    lake_name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    temperature = fields.Float(required=True, validate=validate.Range(min=-50, max=80))
    rainfall = fields.Float(
        required=True, validate=validate.Range(min=0, max=2000)
    )
    water_level_rise = fields.Float(
        required=True, validate=validate.Range(min=0, max=1000)
    )
    timestamp = fields.Str(load_default=None)


class RegisterSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(
        required=True, validate=validate.Length(min=6, max=128)
    )
    name = fields.Str(validate=validate.Length(max=100), load_default="")
    role = fields.Str(
        validate=validate.OneOf(["admin", "user"]), load_default="user"
    )


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)


class LakeCreateSchema(Schema):
    id = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    lat = fields.Float(required=True, validate=validate.Range(min=-90, max=90))
    lon = fields.Float(required=True, validate=validate.Range(min=-180, max=180))
    state = fields.Str(required=True)
    elevation_m = fields.Float(load_default=0.0)
    area_ha = fields.Float(load_default=0.0)
    dam_type = fields.Str(load_default="Unknown")
    river_basin = fields.Str(load_default="")
    cwc_monitoring = fields.Bool(load_default=False)
    notes = fields.Str(load_default="")


class AlertPreferencesSchema(Schema):
    warnings_enabled = fields.Bool(load_default=True)
    emergencies_enabled = fields.Bool(load_default=True)


class TestAlertSchema(Schema):
    lake_id = fields.Str(load_default="GL001")
    lake_name = fields.Str(load_default="South Lhonak Lake")
    type = fields.Str(
        validate=validate.OneOf(["Warning", "Emergency", "Info"]),
        load_default="Warning",
    )
    message = fields.Str(load_default=None)


def validate_json(schema_class, data, partial=False):
    """
    Validate data against a schema.
    Returns (cleaned_data, None) or (None, error_dict).
    """
    schema = schema_class()
    try:
        result = schema.load(data, partial=partial)
        return result, None
    except ValidationError as err:
        return None, err.messages
