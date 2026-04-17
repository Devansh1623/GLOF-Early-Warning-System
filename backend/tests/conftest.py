"""
conftest.py — shared pytest fixtures for GLOF backend tests.
Uses mongomock so no real MongoDB is needed.
"""
import pytest
from unittest.mock import MagicMock, patch
import sys, os

# Ensure backend root is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ── Mock heavy optional deps before any import ───────────────────────────────
for mod in ["celery", "celery_app", "flasgger", "prometheus_flask_exporter",
            "prometheus_client"]:
    sys.modules.setdefault(mod, MagicMock())

import mongomock


@pytest.fixture
def mock_db():
    """In-memory MongoDB using mongomock."""
    client = mongomock.MongoClient()
    return client["glof_test"]


@pytest.fixture
def app(mock_db):
    """Minimal Flask app with blueprints registered against mock DB."""
    from flask import Flask
    from flask_jwt_extended import JWTManager
    from routes.auth import init_auth
    from routes.data import init_lakes, init_events, init_alerts

    _app = Flask(__name__)
    _app.config["JWT_SECRET_KEY"] = "test-secret"
    _app.config["TESTING"] = True
    JWTManager(_app)

    _app.register_blueprint(init_auth(mock_db),     url_prefix="/api/auth")
    _app.register_blueprint(init_lakes(mock_db),    url_prefix="/api/lakes")
    _app.register_blueprint(init_events(mock_db),   url_prefix="/api/events")
    _app.register_blueprint(init_alerts(mock_db, None), url_prefix="/api/alerts")

    return _app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def admin_token(client):
    """Register + login an admin user, return JWT token."""
    client.post("/api/auth/register", json={
        "email": "admin@test.com", "password": "admin123",
        "name": "Admin", "role": "admin"
    })
    r = client.post("/api/auth/login", json={
        "email": "admin@test.com", "password": "admin123"
    })
    return r.get_json()["token"]


@pytest.fixture
def user_token(client):
    """Register + login a regular user, return JWT token."""
    client.post("/api/auth/register", json={
        "email": "user@test.com", "password": "user123",
        "name": "User", "role": "user"
    })
    r = client.post("/api/auth/login", json={
        "email": "user@test.com", "password": "user123"
    })
    return r.get_json()["token"]
