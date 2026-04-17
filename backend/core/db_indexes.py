"""
MongoDB index creation for GLOF database.
Call ensure_indexes(db) on startup.
"""
from pymongo import ASCENDING, DESCENDING


def ensure_indexes(db):
    """Create all indexes. Safe to call on every startup (idempotent)."""

    # telemetry: fast lake+time queries, TTL auto-expire after 90 days
    db.telemetry.create_index([("lake_id", ASCENDING), ("timestamp", DESCENDING)])
    db.telemetry.create_index([("timestamp", DESCENDING)])
    db.telemetry.create_index(
        "created_at",
        expireAfterSeconds=90 * 24 * 3600,
        sparse=True,
    )

    # alerts: filter by status quickly
    db.alerts.create_index([("status", ASCENDING), ("timestamp", DESCENDING)])
    db.alerts.create_index([("lake_id", ASCENDING), ("timestamp", DESCENDING)])

    # audit_logs: time-ordered with TTL (30 days)
    db.audit_logs.create_index([("timestamp", DESCENDING)])
    db.audit_logs.create_index(
        "timestamp",
        expireAfterSeconds=30 * 24 * 3600,
    )

    # users: unique email
    db.users.create_index("email", unique=True, sparse=True)

    # lakes: fast lookup by id
    db.lakes.create_index("id", unique=True, sparse=True)

    # glof_events: sorted by date
    db.glof_events.create_index([("date", DESCENDING)])
