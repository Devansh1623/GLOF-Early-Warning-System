"""
Data routes — Lakes, Events, Alerts CRUD APIs + Test Alerts + User Preferences.
"""
import json
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from bson import ObjectId
from core.logger import alert_log
from core.schemas import validate_json, AdminEmailAlertSchema
from tasks import enqueue_email_jobs, enqueue_alert_push_notifications

lakes_bp  = Blueprint("lakes",  __name__)
events_bp = Blueprint("events", __name__)
alerts_bp = Blueprint("alerts", __name__)

_db_lakes  = None
_db_events = None
_db_alerts = None
_redis_client = None


def _serialize(doc):
    """Convert MongoDB document to JSON-safe dict."""
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ─── Lakes ──────────────────────────────────────────────

def init_lakes(db):
    global _db_lakes
    _db_lakes = db
    return lakes_bp


@lakes_bp.route("/", methods=["GET"])
@jwt_required()
def get_lakes():
    lakes = list(_db_lakes.lakes.find({}, {"_id": 0}))
    return jsonify(lakes), 200


@lakes_bp.route("/<lake_id>", methods=["GET"])
@jwt_required()
def get_lake(lake_id):
    lake = _db_lakes.lakes.find_one({"id": lake_id}, {"_id": 0})
    if not lake:
        return jsonify({"error": "Lake not found"}), 404
    return jsonify(lake), 200


@lakes_bp.route("/<lake_id>/telemetry", methods=["GET"])
@jwt_required()
def get_telemetry(lake_id):
    limit = min(int(request.args.get("limit", 100)), 500)
    page = max(int(request.args.get("page", 1)), 1)
    skip = (page - 1) * limit
    total = _db_lakes.telemetry.count_documents({"lake_id": lake_id})
    readings = list(
        _db_lakes.telemetry
        .find({"lake_id": lake_id}, {"_id": 0})
        .sort("timestamp", -1)
        .skip(skip)
        .limit(limit)
    )
    readings.reverse()
    return jsonify({
        "data": readings,
        "page": page,
        "limit": limit,
        "total": total,
        "pages": max(1, -(-total // limit)),  # ceiling division
    }), 200


@lakes_bp.route("/", methods=["POST"])
@jwt_required()
def add_lake():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    required = ["id", "name", "lat", "lon", "state"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    if _db_lakes.lakes.find_one({"id": data["id"]}):
        return jsonify({"error": "Lake with this ID already exists"}), 409

    lake_doc = {
        "id": data["id"],
        "name": data["name"],
        "state": data.get("state", ""),
        "lat": float(data["lat"]),
        "lon": float(data["lon"]),
        "elevation_m": float(data.get("elevation_m", 0)),
        "area_ha": float(data.get("area_ha", 0)),
        "dam_type": data.get("dam_type", "Unknown"),
        "river_basin": data.get("river_basin", ""),
        "cwc_monitoring": data.get("cwc_monitoring", False),
        "current_risk_level": "Low",
        "current_risk_score": 0,
        "notes": data.get("notes", ""),
        "created_at": datetime.now(tz=timezone.utc).isoformat(),
    }
    _db_lakes.lakes.insert_one(lake_doc)
    return jsonify({"message": "Lake added", "id": data["id"]}), 201


# ─── Events ─────────────────────────────────────────────

def init_events(db):
    global _db_events
    _db_events = db
    return events_bp


@events_bp.route("/", methods=["GET"])
@jwt_required()
def get_events():
    state    = request.args.get("state")
    severity = request.args.get("severity")
    query = {}
    if state:
        query["state"] = {"$regex": state, "$options": "i"}
    if severity:
        query["severity"] = severity

    events = list(_db_events.glof_events.find(query, {"_id": 0}).sort("date", -1))
    return jsonify(events), 200


@events_bp.route("/", methods=["POST"])
@jwt_required()
def add_event():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    required = ["event_id", "title", "location", "date", "severity", "impact_summary"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    _db_events.glof_events.insert_one({
        **data,
        "created_at": datetime.utcnow().isoformat()
    })
    return jsonify({"message": "Event added"}), 201


# ─── Alerts ─────────────────────────────────────────────

def init_alerts(db, redis_client=None):
    global _db_alerts, _redis_client
    _db_alerts = db
    _redis_client = redis_client
    return alerts_bp


@alerts_bp.route("/", methods=["GET"])
@jwt_required()
def get_alerts():
    limit = int(request.args.get("limit", 50))
    status_filter = request.args.get("status")  # OPEN | ACKNOWLEDGED | RESOLVED

    query = {}
    if status_filter:
        query["status"] = status_filter.upper()

    alerts = [
        _serialize(doc) for doc in _db_alerts.alerts.find(query).sort("timestamp", -1).limit(limit)
    ]
    return jsonify(alerts), 200


@alerts_bp.route("/resolve/<alert_id>", methods=["PATCH"])
@jwt_required()
def resolve_alert(alert_id):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    user = get_jwt_identity()
    try:
        result = _db_alerts.alerts.update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": {
                "resolved": True,
                "status": "RESOLVED",
                "resolved_by": user,
                "resolved_at": datetime.now(tz=timezone.utc).isoformat(),
            }},
        )
    except Exception:
        return jsonify({"error": "Invalid alert ID"}), 400

    if result.modified_count == 0:
        return jsonify({"error": "Alert not found"}), 404
    alert_log.info("Alert resolved", extra={"user": user, "alert_id": alert_id})
    return jsonify({"message": "Alert resolved", "resolved_by": user}), 200


@alerts_bp.route("/test", methods=["POST"])
@jwt_required()
def send_test_alert():
    """Admin-only: Send a test alert that broadcasts via Redis pub/sub."""
    try:
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403

        data = request.get_json() or {}
        lake_id   = data.get("lake_id", "GL001")
        lake_name = data.get("lake_name", "South Lhonak Lake")
        alert_type = data.get("type", "Warning")
        message   = data.get("message", f"[TEST] This is a test {alert_type} alert sent by admin.")

        timestamp = datetime.utcnow().isoformat() + "Z"
        test_score = 85.0 if alert_type == "Emergency" else 70.0

        alert_doc = {
            "lake_id": lake_id,
            "lake_name": lake_name,
            "type": alert_type,
            "message": message,
            "risk_score": test_score,
            "risk_level": "Critical" if alert_type == "Emergency" else "High",
            "timestamp": timestamp,
            "resolved": False,
            "is_test": True,
        }
        _db_alerts.alerts.insert_one({**alert_doc})

        # Broadcast via Redis pub/sub so SSE clients receive it
        if _redis_client:
            payload = {
                "lake_id": lake_id,
                "lake_name": lake_name,
                "timestamp": timestamp,
                "temperature": 0,
                "rainfall": 0,
                "water_level_rise": 0,
                "risk_score": test_score,
                "risk_level": alert_doc["risk_level"],
                "risk_color": "#991b1b" if alert_type == "Emergency" else "#dc2626",
                "breakdown": {
                    "temperature_contribution": 0,
                    "rainfall_contribution": 0,
                    "water_level_contribution": 0,
                },
                "alert": {
                    "alert": True,
                    "type": alert_type,
                    "message": message,
                    "severity": "critical" if alert_type == "Emergency" else "high",
                    "is_test": True,
                }
            }
            _redis_client.publish("glof_stream", json.dumps(payload))
            
        # Trigger test push notifications
        enqueue_alert_push_notifications({
            "lake_id": lake_id,
            "lake_name": lake_name,
            "risk_level": "Critical" if alert_type == "Emergency" else "High",
            "risk_score": test_score,
            "alert_type": alert_type,
            "alert_message": message,
            "timestamp": timestamp,
        })

        return jsonify({"message": f"Test {alert_type} alert sent for {lake_name}.", "alert": alert_doc}), 200
    except Exception as e:
        import traceback
        alert_log.error(f"Internal server error: {e}\n{traceback.format_exc()}")
        return jsonify({"error": "Internal server error"}), 500


# ─── User Preferences ──────────────────────────────────

@alerts_bp.route("/preferences", methods=["GET"])
@jwt_required()
def get_preferences():
    """Get current user's alert preferences."""
    email = get_jwt_identity()
    user = _db_alerts.users.find_one({"email": email}, {"_id": 0, "password": 0})
    prefs = user.get("alert_preferences", {
        "warnings_enabled": True,
        "emergencies_enabled": True,
        "email_enabled": True,
    }) if user else {}
    return jsonify(prefs), 200


@alerts_bp.route("/preferences", methods=["PUT"])
@jwt_required()
def update_preferences():
    """Update current user's alert preferences."""
    email = get_jwt_identity()
    data = request.get_json() or {}

    prefs = {
        "warnings_enabled": bool(data.get("warnings_enabled", True)),
        "emergencies_enabled": bool(data.get("emergencies_enabled", True)),
        "email_enabled": bool(data.get("email_enabled", True)),
    }

    _db_alerts.users.update_one(
        {"email": email},
        {"$set": {"alert_preferences": prefs}}
    )
    return jsonify({"message": "Preferences updated", "preferences": prefs}), 200


@alerts_bp.route("/email/broadcast", methods=["POST"])
@jwt_required()
def admin_email_broadcast():
    """Admin-only: send an email to opt-in users."""
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    raw = request.get_json() or {}
    data, errors = validate_json(AdminEmailAlertSchema, raw)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 422

    # Fetch users who opted in OR never set preferences (default = opted in)
    users = list(_db_alerts.users.find(
        {
            "email": {"$ne": ""},
            "$or": [
                {"alert_preferences.email_enabled": True},
                {"alert_preferences":  {"$exists": False}},  # never set → default opt-in
            ]
        },
        {"email": 1, "_id": 0}
    ))

    alert_log.info("Email broadcast user fetch", extra={"user_count": len(users)})

    if not users:
        return jsonify({
            "message": "No opted-in users found. Broadcast skipped.",
            "queued": 0,
            "skipped": [],
        }), 200

    queue_result = enqueue_email_jobs(
        users,
        data["subject"],
        data["message"],
        metadata={"kind": "admin_broadcast"},
    )

    alert_log.info("Admin email broadcast queued", extra={"queued": queue_result["queued"]})
    return jsonify({
        "message": "Email broadcast queued",
        "queued": queue_result["queued"],
        "skipped": queue_result["skipped"],
    }), 200


@alerts_bp.route("/email/jobs", methods=["GET"])
@jwt_required()
def list_email_jobs():
    """Admin-only: inspect recent email delivery jobs for debugging."""
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    jobs = list(
        _db_alerts.notification_jobs
        .find({"channel": "email"}, {"_id": 0})
        .sort("created_at", -1)
        .limit(min(int(request.args.get("limit", 50)), 200))
    )
    return jsonify(jobs), 200


# ── Web Push Subscriptions ──────────────────────────────────────────────────
import os

@alerts_bp.route("/push/public-key", methods=["GET"])
def get_push_public_key():
    # Provide the VAPID public key to the frontend for subscription
    public_key = os.environ.get("VAPID_PUBLIC_KEY", "BBNOZOeBo9BwRnnr2O4DJHeT2hikkxejeF65wlVyNUvMGMzkoWBxYFb3sxRJnP2gRGjwZG_sMTZoicNnpGVEvag")
    return jsonify({"publicKey": public_key}), 200

@alerts_bp.route("/push/subscribe", methods=["POST"])
def subscribe_push():
    """Save a push subscription sent by the frontend Service Worker."""
    subscription = request.get_json()
    if not subscription or not subscription.get("endpoint"):
        return jsonify({"error": "Invalid subscription payload"}), 400
        
    _db_alerts.push_subscriptions.update_one(
        {"endpoint": subscription["endpoint"]},
        {"$set": {
            "subscription_info": subscription, 
            "updated_at": datetime.now(tz=timezone.utc).isoformat()
        }},
        upsert=True
    )
    return jsonify({"message": "Subscribed to push notifications successfully"}), 201


@alerts_bp.route("/push/broadcast", methods=["POST"])
@jwt_required()
def push_broadcast():
    """Admin-only: send a custom push notification to all subscribed devices."""
    try:
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403

        data = request.get_json() or {}
        title   = data.get("title", "GLOFWatch Alert")
        body    = data.get("body", "")
        lake_id = data.get("lake_id", "GL001")
        lake_name = data.get("lake_name", "Glacial Lake")

        if not body:
            return jsonify({"error": "Message body is required"}), 400

        # Count subscribed devices
        count = _db_alerts.push_subscriptions.count_documents({})
        if count == 0:
            return jsonify({"message": "No subscribed devices found.", "sent": 0}), 200

        timestamp = datetime.utcnow().isoformat() + "Z"

        # Reuse the existing push notification pipeline
        enqueue_alert_push_notifications({
            "lake_id": lake_id,
            "lake_name": lake_name,
            "risk_level": "Critical",
            "risk_score": 80.0,
            "alert_type": title,
            "alert_message": body,
            "timestamp": timestamp,
        })

        alert_log.info("Admin push broadcast sent", extra={"title": title, "device_count": count})
        return jsonify({"message": f"Push notification queued for {count} device(s).", "sent": count}), 200

    except Exception as e:
        import traceback
        alert_log.error(f"Internal server error: {e}\n{traceback.format_exc()}")
        return jsonify({"error": "Internal server error"}), 500

