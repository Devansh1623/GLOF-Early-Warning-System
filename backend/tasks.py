import os
import uuid
from datetime import datetime, timezone

from pymongo import MongoClient

from celery_app import celery_app
from core.logger import get_logger
from core.notifications import send_email


task_log = get_logger("glof.tasks")
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/glof_db")


def get_db():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    return client.glof_db


def enqueue_email_jobs(users, subject: str, text: str, html: str = "", metadata: dict = None):
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


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_backoff_max=600, retry_jitter=True, max_retries=5)
def deliver_email_task(self, notification_id: str):
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
    now = datetime.now(tz=timezone.utc).isoformat()

    update = {
        "last_attempt_at": now,
        "attempts": int(notification.get("attempts", 0)) + 1,
    }
    if result.get("ok"):
        update.update({
            "status": "sent",
            "sent_at": now,
            "provider_id": result.get("id"),
        })
        task_log.info("Email delivered", extra={"notification_id": notification_id, "to": result.get("to", "")})
    else:
        update.update({
            "status": "failed",
            "error": result,
        })
        task_log.warning("Email failed", extra={"notification_id": notification_id, "reason": result.get("reason", "unknown")})

    db.notification_jobs.update_one({"_id": notification_id}, {"$set": update})

    if not result.get("ok"):
        raise RuntimeError(str(result.get("detail") or result.get("reason") or "delivery_failed"))

    return result
