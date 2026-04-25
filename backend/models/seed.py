"""
Database seeding — populates MongoDB with lake data and historical events on startup.
"""
from core.lake_data import LAKES, GLOF_EVENTS


def seed_database(db):
    """Seed lakes and GLOF events if collections are empty."""

    # Seed lakes
    if db.lakes.count_documents({}) == 0:
        db.lakes.insert_many([{**lake} for lake in LAKES])
        print(f"[SEED] Inserted {len(LAKES)} glacial lakes.")
    else:
        print(f"[SEED] Lakes collection already populated ({db.lakes.count_documents({})} docs).")

    # Seed events
    if db.glof_events.count_documents({}) == 0:
        db.glof_events.insert_many([{**event} for event in GLOF_EVENTS])
        print(f"[SEED] Inserted {len(GLOF_EVENTS)} historical GLOF events.")
    else:
        print(f"[SEED] Events collection already populated ({db.glof_events.count_documents({})} docs).")

    # Create indexes for performance
    try:
        db.telemetry.create_index([("lake_id", 1), ("timestamp", -1)])
        db.alerts.create_index([("lake_id", 1), ("timestamp", -1)])
        db.notification_jobs.create_index([("channel", 1), ("status", 1), ("created_at", -1)])
        db.lakes.create_index("id", unique=True)
        print("[SEED] Indexes ensured.")
    except Exception as e:
        if "OperationFailure" in str(type(e)):
            print(f"[SEED] Index conflict detected, dropping 'id_1' and recreating...")
            try:
                db.lakes.drop_index("id_1")
                db.lakes.create_index("id", unique=True)
                print("[SEED] Indexes recreated successfully.")
            except Exception as e2:
                print(f"[SEED] Failed to recreate index: {e2}")
        else:
            print(f"[SEED] Index creation skipped: {e}")
