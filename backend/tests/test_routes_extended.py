"""
Extended route tests: lakes, events, alerts admin actions, push, password reset, profile.
"""
from datetime import datetime, timedelta, timezone

import mongomock
import pytest
from bson import ObjectId
from flask import Flask

import routes.data as data_routes


def auth(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def stub_queues(monkeypatch):
    """Replace background job enqueuers so tests never touch Celery/Mongo workers."""
    calls = {"email": [], "push": []}

    def fake_email(users, subject, message, metadata=None):
        calls["email"].append((users, subject, message))
        return {"queued": len(users), "skipped": []}

    monkeypatch.setattr(data_routes, "enqueue_email_jobs", fake_email)
    monkeypatch.setattr(data_routes, "enqueue_alert_push_notifications",
                        lambda payload: calls["push"].append(payload))
    return calls


# ── Auth ─────────────────────────────────────────────────────────────────────
class TestRegistrationRole:
    def test_self_registration_cannot_grant_admin(self, client, mock_db):
        r = client.post("/api/auth/register", json={
            "email": "sneaky@test.com", "password": "pass123", "name": "S", "role": "admin"
        })
        assert r.status_code == 422
        assert mock_db.users.find_one({"email": "sneaky@test.com"}) is None


class TestPasswordReset:
    def test_forgot_password_unknown_email_is_generic(self, client):
        r = client.post("/api/auth/forgot-password", json={"email": "nobody@test.com"})
        assert r.status_code == 200
        assert "reset code" in r.get_json()["message"]

    def test_forgot_password_invalid_email(self, client):
        r = client.post("/api/auth/forgot-password", json={"email": "not-an-email"})
        assert r.status_code == 422

    def test_forgot_password_creates_code(self, client, mock_db, user_token, monkeypatch):
        monkeypatch.delenv("RESEND_API_KEY", raising=False)
        r = client.post("/api/auth/forgot-password", json={"email": "user@test.com"})
        assert r.status_code == 200
        doc = mock_db.password_resets.find_one({"email": "user@test.com"})
        assert doc is not None and len(doc["code"]) == 6

    def test_reset_password_full_flow(self, client, mock_db, user_token):
        mock_db.password_resets.insert_one({
            "email": "user@test.com", "code": "123456",
            "expires_at": datetime.now(tz=timezone.utc) + timedelta(minutes=10),
        })
        r = client.post("/api/auth/reset-password", json={
            "email": "user@test.com", "code": "123456", "password": "newpass1"
        })
        assert r.status_code == 200
        login = client.post("/api/auth/login", json={"email": "user@test.com", "password": "newpass1"})
        assert login.status_code == 200
        assert mock_db.password_resets.find_one({"email": "user@test.com"}) is None

    def test_reset_password_wrong_code(self, client, mock_db, user_token):
        mock_db.password_resets.insert_one({
            "email": "user@test.com", "code": "123456",
            "expires_at": datetime.now(tz=timezone.utc) + timedelta(minutes=10),
        })
        r = client.post("/api/auth/reset-password", json={
            "email": "user@test.com", "code": "654321", "password": "newpass1"
        })
        assert r.status_code == 400

    def test_reset_password_expired_code(self, client, mock_db, user_token):
        mock_db.password_resets.insert_one({
            "email": "user@test.com", "code": "123456",
            "expires_at": datetime.now(tz=timezone.utc) - timedelta(minutes=1),
        })
        r = client.post("/api/auth/reset-password", json={
            "email": "user@test.com", "code": "123456", "password": "newpass1"
        })
        assert r.status_code == 400
        assert "expired" in r.get_json()["error"]

    def test_reset_password_no_request(self, client):
        r = client.post("/api/auth/reset-password", json={
            "email": "user@test.com", "code": "123456", "password": "newpass1"
        })
        assert r.status_code == 400

    def test_reset_password_validation(self, client):
        r = client.post("/api/auth/reset-password", json={"email": "user@test.com", "code": "1"})
        assert r.status_code == 422


class TestProfile:
    def test_me_endpoint(self, client):
        assert client.get("/api/auth/me").status_code == 200

    def test_profile_requires_auth(self, client):
        assert client.patch("/api/auth/profile", json={"name": "X"}).status_code == 401

    def test_profile_update(self, client, mock_db, user_token):
        r = client.patch("/api/auth/profile", json={"name": "New Name", "phone": "+919876543210"},
                         headers=auth(user_token))
        assert r.status_code == 200
        user = mock_db.users.find_one({"email": "user@test.com"})
        assert user["name"] == "New Name"
        assert user["phone"] == "+919876543210"

    def test_profile_bad_phone(self, client, user_token):
        r = client.patch("/api/auth/profile", json={"phone": "12345"}, headers=auth(user_token))
        assert r.status_code == 422

    def test_profile_no_fields(self, client, user_token):
        r = client.patch("/api/auth/profile", json={}, headers=auth(user_token))
        assert r.status_code == 400


# ── Lakes ────────────────────────────────────────────────────────────────────
class TestLakes:
    def test_get_lake_found_and_missing(self, client, mock_db, user_token):
        mock_db.lakes.insert_one({"id": "GL001", "name": "South Lhonak"})
        r = client.get("/api/lakes/GL001", headers=auth(user_token))
        assert r.status_code == 200
        assert r.get_json()["name"] == "South Lhonak"
        assert client.get("/api/lakes/NOPE", headers=auth(user_token)).status_code == 404

    def test_telemetry_pagination(self, client, mock_db, user_token):
        for i in range(5):
            mock_db.telemetry.insert_one({"lake_id": "GL001", "timestamp": f"2026-01-0{i + 1}"})
        r = client.get("/api/lakes/GL001/telemetry?limit=2&page=1", headers=auth(user_token))
        body = r.get_json()
        assert r.status_code == 200
        assert body["total"] == 5 and body["pages"] == 3
        assert [d["timestamp"] for d in body["data"]] == ["2026-01-04", "2026-01-05"]

    def test_add_lake_duplicate(self, client, admin_token):
        payload = {"id": "GL777", "name": "Dup", "lat": 30, "lon": 78, "state": "Sikkim"}
        assert client.post("/api/lakes/", json=payload, headers=auth(admin_token)).status_code == 201
        assert client.post("/api/lakes/", json=payload, headers=auth(admin_token)).status_code == 409


# ── Events ───────────────────────────────────────────────────────────────────
class TestEvents:
    EVENT = {
        "event_id": "EV1", "title": "Chorabari", "location": "Kedarnath", "date": "2013-06-16",
        "severity": "Catastrophic", "impact_summary": "Major flood", "state": "Uttarakhand",
    }

    def test_add_and_filter_events(self, client, admin_token, user_token):
        r = client.post("/api/events/", json=self.EVENT, headers=auth(admin_token))
        assert r.status_code == 201
        r = client.get("/api/events/?state=uttara&severity=Catastrophic", headers=auth(user_token))
        assert r.status_code == 200
        assert len(r.get_json()) == 1
        r = client.get("/api/events/?severity=Minor", headers=auth(user_token))
        assert r.get_json() == []

    def test_add_event_user_forbidden(self, client, user_token):
        assert client.post("/api/events/", json=self.EVENT, headers=auth(user_token)).status_code == 403

    def test_add_event_missing_field(self, client, admin_token):
        r = client.post("/api/events/", json={"event_id": "EV2"}, headers=auth(admin_token))
        assert r.status_code == 400


# ── Alerts ───────────────────────────────────────────────────────────────────
class TestAlertAdmin:
    def _seed(self, mock_db, n=2):
        return [mock_db.alerts.insert_one({
            "lake_id": "GL001", "resolved": False, "status": "OPEN", "timestamp": f"t{i}"
        }).inserted_id for i in range(n)]

    def test_status_filter(self, client, mock_db, user_token):
        self._seed(mock_db, 2)
        mock_db.alerts.insert_one({"status": "RESOLVED", "resolved": True, "timestamp": "t9"})
        r = client.get("/api/alerts/?status=open", headers=auth(user_token))
        assert len(r.get_json()) == 2

    def test_resolve_alert(self, client, mock_db, admin_token, user_token):
        ids = self._seed(mock_db, 1)
        assert client.patch(f"/api/alerts/resolve/{ids[0]}", headers=auth(user_token)).status_code == 403
        r = client.patch(f"/api/alerts/resolve/{ids[0]}", headers=auth(admin_token))
        assert r.status_code == 200
        assert mock_db.alerts.find_one({"_id": ids[0]})["status"] == "RESOLVED"

    def test_resolve_alert_bad_and_missing_id(self, client, admin_token):
        assert client.patch("/api/alerts/resolve/not-an-id", headers=auth(admin_token)).status_code == 400
        assert client.patch(f"/api/alerts/resolve/{ObjectId()}", headers=auth(admin_token)).status_code == 404

    def test_resolve_all(self, client, mock_db, admin_token, user_token):
        self._seed(mock_db, 3)
        assert client.post("/api/alerts/resolve-all", headers=auth(user_token)).status_code == 403
        r = client.post("/api/alerts/resolve-all", headers=auth(admin_token))
        assert r.get_json()["resolved_count"] == 3

    def test_test_alert_publishes_to_redis(self, mock_db, stub_queues):
        published = []

        class FakeRedis:
            def publish(self, channel, msg):
                published.append(channel)

        from flask_jwt_extended import JWTManager, create_access_token
        app = Flask(__name__)
        app.config["JWT_SECRET_KEY"] = "test-secret"
        JWTManager(app)
        app.register_blueprint(data_routes.init_alerts(mock_db, FakeRedis()), url_prefix="/api/alerts")
        with app.app_context():
            token = create_access_token(identity="a@test.com", additional_claims={"role": "admin"})
        r = app.test_client().post("/api/alerts/test", json={"type": "Emergency"}, headers=auth(token))
        assert r.status_code == 200
        assert r.get_json()["alert"]["risk_level"] == "Critical"
        assert published == ["glof_stream"]
        assert stub_queues["push"]


class TestEmailBroadcast:
    def test_forbidden_for_users(self, client, user_token):
        r = client.post("/api/alerts/email/broadcast", json={"subject": "s", "message": "m"},
                        headers=auth(user_token))
        assert r.status_code == 403

    def test_validation(self, client, admin_token):
        r = client.post("/api/alerts/email/broadcast", json={"subject": ""}, headers=auth(admin_token))
        assert r.status_code == 422

    def test_queues_opted_in_users(self, client, mock_db, admin_token, user_token, stub_queues):
        mock_db.users.insert_one({"email": "optout@test.com",
                                  "alert_preferences": {"email_enabled": False}})
        r = client.post("/api/alerts/email/broadcast", json={"subject": "Hi", "message": "Body"},
                        headers=auth(admin_token))
        assert r.status_code == 200
        emails = {u["email"] for u in stub_queues["email"][0][0]}
        assert "user@test.com" in emails and "optout@test.com" not in emails

    def test_no_users(self, mock_db, stub_queues):
        from flask_jwt_extended import JWTManager, create_access_token
        app = Flask(__name__)
        app.config["JWT_SECRET_KEY"] = "test-secret"
        JWTManager(app)
        app.register_blueprint(data_routes.init_alerts(mongomock.MongoClient()["empty"]), url_prefix="/a")
        with app.app_context():
            token = create_access_token(identity="a@test.com", additional_claims={"role": "admin"})
        r = app.test_client().post("/a/email/broadcast", json={"subject": "s", "message": "m"},
                                   headers=auth(token))
        assert r.get_json()["queued"] == 0

    def test_list_jobs(self, client, mock_db, admin_token, user_token):
        mock_db.notification_jobs.insert_one({"channel": "email", "created_at": "2026-01-01"})
        assert client.get("/api/alerts/email/jobs", headers=auth(user_token)).status_code == 403
        r = client.get("/api/alerts/email/jobs", headers=auth(admin_token))
        assert len(r.get_json()) == 1


class TestPush:
    def test_public_key(self, client):
        r = client.get("/api/alerts/push/public-key")
        assert r.status_code == 200 and r.get_json()["publicKey"]

    def test_subscribe(self, client, mock_db):
        assert client.post("/api/alerts/push/subscribe", json={}).status_code == 400
        r = client.post("/api/alerts/push/subscribe", json={"endpoint": "https://push.example/1"})
        assert r.status_code == 201
        assert mock_db.push_subscriptions.count_documents({}) == 1

    def test_broadcast(self, client, mock_db, admin_token, user_token, stub_queues):
        assert client.post("/api/alerts/push/broadcast", json={"body": "x"},
                           headers=auth(user_token)).status_code == 403
        assert client.post("/api/alerts/push/broadcast", json={},
                           headers=auth(admin_token)).status_code == 400
        r = client.post("/api/alerts/push/broadcast", json={"body": "x"}, headers=auth(admin_token))
        assert r.get_json()["sent"] == 0
        mock_db.push_subscriptions.insert_one({"endpoint": "e"})
        r = client.post("/api/alerts/push/broadcast", json={"body": "x"}, headers=auth(admin_token))
        assert r.get_json()["sent"] == 1
        assert stub_queues["push"]


# ── Core helpers ─────────────────────────────────────────────────────────────
class TestCoreHelpers:
    def test_ensure_indexes(self, mock_db):
        from core.db_indexes import ensure_indexes
        ensure_indexes(mock_db)
        assert "email_1" in mock_db.users.index_information()

    def test_security_headers_and_error_handlers(self):
        from core.middleware import register_security_headers, register_error_handlers
        app = Flask(__name__)
        register_security_headers(app)
        register_error_handlers(app)

        @app.route("/boom")
        def boom():
            from flask import abort
            abort(403)

        c = app.test_client()
        r = c.get("/missing")
        assert r.status_code == 404
        assert r.get_json()["error"] == "Resource not found"
        assert r.headers["X-Frame-Options"] == "DENY"
        assert c.get("/boom").get_json()["error"] == "Forbidden"
