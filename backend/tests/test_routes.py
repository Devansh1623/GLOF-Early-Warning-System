"""
Integration tests for auth routes and telemetry pipeline.
"""
import pytest
from unittest.mock import patch, MagicMock


class TestAuthRoutes:
    def test_register_success(self, client):
        r = client.post("/api/auth/register", json={
            "email": "new@test.com", "password": "pass123", "name": "New"
        })
        assert r.status_code == 201

    def test_register_duplicate_email(self, client):
        payload = {"email": "dup@test.com", "password": "pass123", "name": "Dup"}
        client.post("/api/auth/register", json=payload)
        r = client.post("/api/auth/register", json=payload)
        assert r.status_code == 409

    def test_register_invalid_email(self, client):
        r = client.post("/api/auth/register", json={
            "email": "bad-email", "password": "pass123"
        })
        assert r.status_code == 422

    def test_login_success(self, client):
        client.post("/api/auth/register", json={
            "email": "login@test.com", "password": "pass123", "name": "L"
        })
        r = client.post("/api/auth/login", json={
            "email": "login@test.com", "password": "pass123"
        })
        assert r.status_code == 200
        data = r.get_json()
        assert "token" in data
        assert data["user"]["email"] == "login@test.com"

    def test_login_wrong_password(self, client):
        client.post("/api/auth/register", json={
            "email": "wp@test.com", "password": "pass123", "name": "WP"
        })
        r = client.post("/api/auth/login", json={
            "email": "wp@test.com", "password": "wrongpass"
        })
        assert r.status_code == 401

    def test_login_unknown_user(self, client):
        r = client.post("/api/auth/login", json={
            "email": "ghost@test.com", "password": "pass123"
        })
        assert r.status_code == 401


class TestLakeRoutes:
    def test_get_lakes_requires_auth(self, client):
        r = client.get("/api/lakes/")
        assert r.status_code == 401

    def test_get_lakes_with_token(self, client, user_token):
        r = client.get("/api/lakes/", headers={"Authorization": f"Bearer {user_token}"})
        assert r.status_code == 200
        assert isinstance(r.get_json(), list)

    def test_add_lake_admin_only(self, client, user_token, admin_token):
        payload = {
            "id": "GL999", "name": "Test Lake", "lat": 30.0,
            "lon": 78.0, "state": "Uttarakhand"
        }
        # user cannot add
        r = client.post("/api/lakes/", json=payload,
                        headers={"Authorization": f"Bearer {user_token}"})
        assert r.status_code == 403

        # admin can add
        r = client.post("/api/lakes/", json=payload,
                        headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 201

    def test_add_lake_missing_field(self, client, admin_token):
        r = client.post("/api/lakes/", json={"id": "GL998", "name": "Bad"},
                        headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 400


class TestAlertRoutes:
    def test_get_alerts_requires_auth(self, client):
        r = client.get("/api/alerts/")
        assert r.status_code == 401

    def test_get_alerts_authenticated(self, client, user_token):
        r = client.get("/api/alerts/", headers={"Authorization": f"Bearer {user_token}"})
        assert r.status_code == 200

    def test_test_alert_admin_only(self, client, user_token, admin_token):
        r = client.post("/api/alerts/test", json={},
                        headers={"Authorization": f"Bearer {user_token}"})
        assert r.status_code == 403

        r = client.post("/api/alerts/test", json={"type": "Warning"},
                        headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200

    def test_preferences_get_set(self, client, user_token):
        # GET defaults
        r = client.get("/api/alerts/preferences",
                       headers={"Authorization": f"Bearer {user_token}"})
        assert r.status_code == 200

        # PUT update
        r = client.put("/api/alerts/preferences", json={
            "warnings_enabled": False, "emergencies_enabled": True, "email_enabled": False
        }, headers={"Authorization": f"Bearer {user_token}"})
        assert r.status_code == 200
        assert r.get_json()["preferences"]["warnings_enabled"] is False
