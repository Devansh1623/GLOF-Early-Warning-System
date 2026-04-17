"""
Tests for marshmallow validation schemas.
"""
import pytest

from core.schemas import (
    validate_json, TelemetrySchema, RegisterSchema,
    LoginSchema, AlertPreferencesSchema,
)


class TestTelemetrySchema:
    VALID = {
        "lake_id": "GL001", "lake_name": "South Lhonak",
        "temperature": 10.5, "rainfall": 20.0, "water_level_rise": 80.0,
    }

    def test_valid(self):
        data, err = validate_json(TelemetrySchema, self.VALID)
        assert err is None
        assert data["lake_id"] == "GL001"

    def test_missing_lake_id(self):
        bad = {**self.VALID}
        del bad["lake_id"]
        _, err = validate_json(TelemetrySchema, bad)
        assert "lake_id" in err

    def test_temperature_out_of_range(self):
        _, err = validate_json(TelemetrySchema, {**self.VALID, "temperature": 999})
        assert "temperature" in err

    def test_negative_rainfall(self):
        _, err = validate_json(TelemetrySchema, {**self.VALID, "rainfall": -1})
        assert "rainfall" in err

    def test_optional_timestamp(self):
        data, err = validate_json(TelemetrySchema, {**self.VALID, "timestamp": "2024-01-01T00:00:00Z"})
        assert err is None


class TestRegisterSchema:
    VALID = {"email": "test@example.com", "password": "secret123", "name": "Tester"}

    def test_valid(self):
        data, err = validate_json(RegisterSchema, self.VALID)
        assert err is None
        assert data["role"] == "user"   # default

    def test_invalid_email(self):
        _, err = validate_json(RegisterSchema, {**self.VALID, "email": "not-an-email"})
        assert "email" in err

    def test_short_password(self):
        _, err = validate_json(RegisterSchema, {**self.VALID, "password": "abc"})
        assert "password" in err

    def test_invalid_role(self):
        _, err = validate_json(RegisterSchema, {**self.VALID, "role": "superuser"})
        assert "role" in err


class TestLoginSchema:
    def test_valid(self):
        data, err = validate_json(LoginSchema, {"email": "a@b.com", "password": "pass"})
        assert err is None

    def test_missing_password(self):
        _, err = validate_json(LoginSchema, {"email": "a@b.com"})
        assert "password" in err
