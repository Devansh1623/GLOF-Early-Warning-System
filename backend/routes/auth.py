"""
Authentication routes — register + login with JWT + audit logging + validation.
"""
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import bcrypt

from core.schemas import RegisterSchema, LoginSchema, validate_json
from core.logger import auth_log

auth_bp = Blueprint("auth", __name__)
_db = None


def init_auth(db):
    global _db
    _db = db
    return auth_bp


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Register a new user account.
    ---
    tags:
      - Auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          properties:
            email: {type: string, example: user@example.com}
            password: {type: string, example: mysecret123}
            name: {type: string}
            role: {type: string, enum: [user, admin], default: user}
    responses:
      201:
        description: Account created
      400:
        description: Validation error
      409:
        description: Email already registered
    """
    raw = request.get_json() or {}
    data, errors = validate_json(RegisterSchema, raw)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 422

    email = data["email"].strip().lower()
    if _db.users.find_one({"email": email}):
        return jsonify({"error": "An account with this email already exists."}), 409

    hashed = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt())
    _db.users.insert_one({
        "email": email,
        "name": data["name"] or email.split("@")[0],
        "role": data["role"],
        "password": hashed,
        "created_at": datetime.now(tz=timezone.utc),
    })

    auth_log.info("User registered", extra={"user": email})
    return jsonify({"message": "Account created successfully."}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Authenticate with email + password. Returns JWT.
    ---
    tags:
      - Auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          properties:
            email: {type: string, example: admin@glof.in}
            password: {type: string, example: admin123}
    responses:
      200:
        description: JWT token + user info
      401:
        description: Invalid credentials
    """
    raw = request.get_json() or {}
    data, errors = validate_json(LoginSchema, raw)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 422

    email = data["email"].strip().lower()
    user = _db.users.find_one({"email": email})
    if not user:
        auth_log.warning("Failed login attempt", extra={"user": email})
        return jsonify({"error": "Invalid credentials."}), 401

    stored_hash = user["password"]
    if isinstance(stored_hash, str):
        stored_hash = stored_hash.encode("utf-8")

    if not bcrypt.checkpw(data["password"].encode("utf-8"), stored_hash):
        auth_log.warning("Failed login attempt (bad password)", extra={"user": email})
        return jsonify({"error": "Invalid credentials."}), 401

    token = create_access_token(
        identity=email,
        additional_claims={"role": user.get("role", "user"), "name": user.get("name", "")},
    )

    auth_log.info("User logged in", extra={"user": email})
    return jsonify({
        "token": token,
        "user": {"email": user["email"], "name": user.get("name", ""), "role": user.get("role", "user")},
    }), 200


@auth_bp.route("/me", methods=["GET"])
def me():
    """
    Return current user profile (for token validation check).
    ---
    tags:
      - Auth
    responses:
      200:
        description: Public endpoint check
    """
    return jsonify({"message": "GLOF Auth API v2"}), 200
