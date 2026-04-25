import os
import uuid
from datetime import datetime, timezone

from pymongo import MongoClient

from celery_app import celery_app
from core.logger import get_logger
from core.notifications import send_email, send_alert_email
from core.push import send_web_push
from core.sms import send_sms, send_whatsapp



task_log = get_logger("glof.tasks")
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/glof_db")


def get_db():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    return client.glof_db


# ── Alert email queue ─────────────────────────────────────────────────────────

def enqueue_alert_emails(users, alert_payload: dict):
    """
    Queue rich GLOF alert emails for every opted-in user.
    alert_payload must contain:
      lake_name, risk_level, risk_score, alert_type, alert_message,
      breakdown, timestamp, lake_state (opt), lake_elevation (opt)
    """
    db = get_db()
    queued = 0
    skipped = []

    for user in users:
        email = (user.get("email") or "").strip().lower()
        if not email:
            skipped.append({"email": "", "reason": "missing_email"})
            continue

        notification_id = str(uuid.uuid4())
        db.notification_jobs.insert_one({
            "_id": notification_id,
            "channel": "email",
            "kind": "alert",
            "to": email,
            "subject": (
                f"[GLOFWatch {alert_payload.get('alert_type','Alert')}] "
                f"{alert_payload.get('lake_name','Lake')} — "
                f"Risk Score {alert_payload.get('risk_score', 0):.1f}"
            ),
            "payload": alert_payload,
            "status": "queued",
            "attempts": 0,
            "metadata": {
                "kind": "risk_alert",
                "lake_id": alert_payload.get("lake_id", ""),
                "risk_score": alert_payload.get("risk_score", 0),
                "alert_type": alert_payload.get("alert_type", ""),
            },
            "created_at": datetime.now(tz=timezone.utc).isoformat(),
        })
        deliver_alert_email_task.delay(notification_id)
        queued += 1

    return {"queued": queued, "skipped": skipped}


# ── Web Push queue ────────────────────────────────────────────────────────────

def enqueue_alert_push_notifications(alert_payload: dict):
    """
    Queue Web Push notifications for all subscribed devices.
    """
    db = get_db()
    queued = 0

    subscriptions = list(db.push_subscriptions.find({}))
    
    for sub in subscriptions:
        notification_id = str(uuid.uuid4())
        db.notification_jobs.insert_one({
            "_id": notification_id,
            "channel": "web_push",
            "kind": "alert",
            "to": sub.get("endpoint", ""),
            "subscription_info": sub.get("subscription_info", {}),
            "payload": alert_payload,
            "status": "queued",
            "attempts": 0,
            "metadata": {
                "kind": "risk_alert",
                "lake_id": alert_payload.get("lake_id", ""),
                "risk_score": alert_payload.get("risk_score", 0),
                "alert_type": alert_payload.get("alert_type", ""),
            },
            "created_at": datetime.now(tz=timezone.utc).isoformat(),
        })
        deliver_push_task.delay(notification_id)
        queued += 1

    return {"queued": queued}


# ── SMS queue ─────────────────────────────────────────────────────────────────

def enqueue_alert_sms(users, alert_payload: dict):
    """
    Queue Twilio SMS alerts for opted-in users with valid phone numbers.
    """
    db = get_db()
    queued = 0
    skipped = []

    # Simplified message for SMS
    message_body = (
        f"GLOF {alert_payload.get('alert_type', 'Alert')}: {alert_payload.get('lake_name', 'Lake')}\n"
        f"Risk: {alert_payload.get('risk_score', 0):.1f}/100\n"
        f"{alert_payload.get('alert_message', '')}\n"
        f"Check Dashboard immediately."
    )

    for user in users:
        phone = (user.get("phone") or "").strip()
        # Fallback to a test number or specific structure if no phone field
        if not phone:
            skipped.append({"email": user.get("email"), "reason": "missing_phone"})
            continue

        notification_id = str(uuid.uuid4())
        db.notification_jobs.insert_one({
            "_id": notification_id,
            "channel": "sms",
            "kind": "alert",
            "to": phone,
            "payload": alert_payload,
            "message_body": message_body,
            "status": "queued",
            "attempts": 0,
            "metadata": {
                "kind": "risk_alert",
                "lake_id": alert_payload.get("lake_id", ""),
                "risk_score": alert_payload.get("risk_score", 0),
                "alert_type": alert_payload.get("alert_type", ""),
            },
            "created_at": datetime.now(tz=timezone.utc).isoformat(),
        })
        deliver_sms_task.delay(notification_id)
        queued += 1

    return {"queued": queued, "skipped": skipped}




# ── Broadcast email queue (admin broadcasts) ──────────────────────────────────


def enqueue_email_jobs(users, subject: str, text: str, html: str = "", metadata: dict = None):
    """Queue generic broadcast emails via the generic send_email path."""
    db = get_db()
    metadata = metadata or {}
    queued = 0
    skipped = []

    for user in users:
        email = (user.get("email") or "").strip().lower()
        if not email:
            skipped.append({"email": "", "reason": "missing_email"})
            continue

        notification_id = str(uuid.uuid4())
        db.notification_jobs.insert_one({
            "_id": notification_id,
            "channel": "email",
            "kind": "broadcast",
            "to": email,
            "subject": subject,
            "message": text,
            "html": html,
            "status": "queued",
            "attempts": 0,
            "metadata": metadata,
            "created_at": datetime.now(tz=timezone.utc).isoformat(),
        })
        deliver_email_task.delay(notification_id)
        queued += 1

    return {"queued": queued, "skipped": skipped}


# ── Celery tasks ──────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    max_retries=5,
)
def deliver_alert_email_task(self, notification_id: str):
    """Deliver a rich GLOF alert email using send_alert_email()."""
    db = get_db()
    notification = db.notification_jobs.find_one({"_id": notification_id})
    if not notification:
        task_log.warning("Alert notification job missing", extra={"notification_id": notification_id})
        return {"ok": False, "reason": "job_missing"}

    payload = notification.get("payload", {})
    result = send_alert_email(
        to_email        = notification.get("to", ""),
        lake_name       = payload.get("lake_name", "Unknown Lake"),
        risk_level      = payload.get("risk_level", "High"),
        risk_score      = float(payload.get("risk_score", 0)),
        alert_type      = payload.get("alert_type", "Warning"),
        alert_message   = payload.get("alert_message", ""),
        breakdown       = payload.get("breakdown", {}),
        timestamp       = payload.get("timestamp", datetime.now(tz=timezone.utc).isoformat()),
        lake_state      = payload.get("lake_state", ""),
        lake_elevation  = payload.get("lake_elevation", ""),
    )
    _record_result(db, notification_id, notification, result)
    if not result.get("ok"):
        raise RuntimeError(str(result.get("detail") or result.get("reason") or "delivery_failed"))
    return result


@celery_app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    max_retries=5,
)
def deliver_email_task(self, notification_id: str):
    """Deliver a generic broadcast email using send_email()."""
    db = get_db()
    notification = db.notification_jobs.find_one({"_id": notification_id})
    if not notification:
        task_log.warning("Notification job missing", extra={"notification_id": notification_id})
        return {"ok": False, "reason": "job_missing"}

    result = send_email(
        notification.get("to", ""),
        notification.get("subject", ""),
        notification.get("message", ""),
        notification.get("html", ""),
    )
    _record_result(db, notification_id, notification, result)
    if not result.get("ok"):
        raise RuntimeError(str(result.get("detail") or result.get("reason") or "delivery_failed"))
    return result


def _record_result(db, notification_id, notification, result):
    """Write delivery outcome back to the notification_jobs document."""
    now = datetime.now(tz=timezone.utc).isoformat()
    update = {
        "last_attempt_at": now,
        "attempts": int(notification.get("attempts", 0)) + 1,
    }
    if result.get("ok"):
        update.update({"status": "sent", "sent_at": now, "provider_id": result.get("id")})
        task_log.info(
            "Email delivered",
            extra={"notification_id": notification_id, "to": result.get("to", "")},
        )
    else:
        update.update({"status": "failed", "error": result})
        task_log.warning(
            "Email failed",
            extra={"notification_id": notification_id, "reason": result.get("reason", "unknown")},
        )
    db.notification_jobs.update_one({"_id": notification_id}, {"$set": update})


@celery_app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    max_retries=5,
)
def deliver_push_task(self, notification_id: str):
    """Deliver a web push notification using send_web_push()."""
    db = get_db()
    notification = db.notification_jobs.find_one({"_id": notification_id})
    if not notification:
        task_log.warning("Notification job missing", extra={"notification_id": notification_id})
        return {"ok": False, "reason": "job_missing"}

    sub_info = notification.get("subscription_info", {})
    payload = notification.get("payload", {})
    
    # Format message for the service worker
    message_data = {
        "title": f"GLOF {payload.get('alert_type', 'Alert')}: {payload.get('lake_name', 'Lake')}",
        "body": payload.get("alert_message", "A new alert has been triggered."),
        "url": "/notifications", 
        "icon": "/logo192.png",
        "data": payload
    }
    
    result = send_web_push(sub_info, message_data)
    
    if not result.get("ok"):
        status_code = result.get("status_code")
        if status_code in [404, 410]:
            # Subscription is gone
            db.push_subscriptions.delete_one({"endpoint": sub_info.get("endpoint")})
            task_log.info("Removed expired push subscription", extra={"endpoint": sub_info.get("endpoint")})
            return result
        raise RuntimeError(str(result.get("reason") or "delivery_failed"))
        
    return result


@celery_app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    max_retries=5,
)
def deliver_sms_task(self, notification_id: str):
    """Deliver a text message using Twilio send_sms()."""
    db = get_db()
    notification = db.notification_jobs.find_one({"_id": notification_id})
    if not notification:
        task_log.warning("Notification job missing", extra={"notification_id": notification_id})
        return {"ok": False, "reason": "job_missing"}

    result = send_sms(
        notification.get("to", ""),
        notification.get("message_body", "")
    )
    
    _record_result(db, notification_id, notification, result)
    if not result.get("ok"):
        raise RuntimeError(str(result.get("reason") or "delivery_failed"))
    return result

