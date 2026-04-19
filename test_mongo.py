import os
import pymongo
import sys

uri = os.environ.get("MONGO_URI", "")
if not uri:
    print("ERROR: Set MONGO_URI env var before running this script")
    sys.exit(1)

try:
    print("Connecting to MongoDB...")
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("SUCCESS: Connection and authentication succeeded!")
except Exception as e:
    print(f"FAILED: {e}")
    sys.exit(1)
