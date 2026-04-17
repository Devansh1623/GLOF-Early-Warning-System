"""
Authentication routes — register + login with JWT + audit logging + validation.
"""
from datetime import datetime, timezone, timedelta
import random
import string
import os

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import bcrypt
import resend

from core.schemas import (
    RegisterSchema, LoginSchema, 
    ForgotPasswordSchema, ResetPasswordSchema, 
    validate_json
)

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


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    raw = request.get_json() or {}
    data, errors = validate_json(ForgotPasswordSchema, raw)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 422

    email = data["email"].strip().lower()
    user = _db.users.find_one({"email": email})
    
    if not user:
        # Avoid user enumeration by returning success regardless
        return jsonify({"message": "If that email exists, a reset code has been sent."}), 200

    # Generate 6 digit code
    code = "".join(random.choices(string.digits, k=6))
    
    # Store in MongoDB password_resets collection
    _db.password_resets.update_one(
        {"email": email},
        {"$set": {
            "code": code,
            "created_at": datetime.now(tz=timezone.utc),
            "expires_at": datetime.now(tz=timezone.utc) + timedelta(minutes=15)
        }},
        upsert=True
    )
    
    # Check if RESEND_API_KEY is available
    resend.api_key = os.environ.get("RESEND_API_KEY", "")
    
    try:
        if resend.api_key:
            resend.Emails.send({
                "from": "GLOFWatch <onboarding@resend.dev>",
                "to": [email],
                "subject": "GLOFWatch - Password Reset Request",
                "html": f"""
                <div style="font-family: monospace; max-width: 600px; padding: 20px;">
                    <h2>GLOFWatch Command Center</h2>
                    <p>We received a request to reset your password. Use the code below to complete the process.</p>
                    <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
                        {code}
                    </div>
                    <p>This code will expire in 15 minutes.</p>
                    <p>If you did not request this, you can safely ignore this email.</p>
                </div>
                """
            })
            auth_log.info("Sent reset email via Resend", extra={"user": email})
        else:
            auth_log.warning(f"No Resend API Key found! Reset code for {email} is {code}", extra={"user": email})
            
    except Exception as e:
        auth_log.error(f"Failed to send email to {email}: {str(e)}", extra={"user": email})

    return jsonify({"message": "If that email exists, a reset code has been sent."}), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    raw = request.get_json() or {}
    data, errors = validate_json(ResetPasswordSchema, raw)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 422

    email = data["email"].strip().lower()
    code = data["code"].strip()
    new_password = data["password"]

    reset_doc = _db.password_resets.find_one({"email": email})
    
    if not reset_doc:
        return jsonify({"error": "Invalid or expired reset code."}), 400

    # Ensure tz-aware comparison
    expires_at = reset_doc["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if expires_at < datetime.now(tz=timezone.utc):
        return jsonify({"error": "Reset code has expired."}), 400
        
    if reset_doc["code"] != code:
        return jsonify({"error": "Invalid reset code."}), 400

    hashed = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())
    _db.users.update_one({"email": email}, {"$set": {"password": hashed}})
    _db.password_resets.delete_one({"email": email})
    
    auth_log.info("Password reset successfully", extra={"user": email})
    return jsonify({"message": "Password has been successfully reset. You can now log in."}), 200



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
