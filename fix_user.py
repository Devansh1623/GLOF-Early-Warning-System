import os
from pymongo import MongoClient
import bcrypt
from datetime import datetime, timezone

MONGO_URI = os.environ.get("MONGO_URI", "")
if not MONGO_URI:
    raise RuntimeError("Set MONGO_URI env var before running this script")

client = MongoClient(MONGO_URI)
db = client['glof_db']

new_password = os.environ.get("ADMIN_PASSWORD", "")
if not new_password:
    raise RuntimeError("Set ADMIN_PASSWORD env var before running this script")

admin_email = os.environ.get("ADMIN_EMAIL", "")
if not admin_email:
    raise RuntimeError("Set ADMIN_EMAIL env var before running this script")

hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt())

result = db.users.update_one(
    {'email': admin_email},
    {'$set': {
        'password': hashed,
        'role': 'admin',
        'name': 'Devansh Geria',
        'updated_at': datetime.now(tz=timezone.utc)
    }}
)
print('Modified count:', result.modified_count)

user = db.users.find_one({'email': admin_email}, {'email': 1, 'role': 1, 'name': 1, '_id': 0})
print('Updated user:', user)

check = bcrypt.checkpw(new_password.encode(), hashed)
print('Password hash verification:', check)

print('\n=== ALL USERS ===')
for u in db.users.find({}, {'email': 1, 'role': 1, '_id': 0}):
    print(u)
