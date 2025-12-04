"""
Authentication routes for OAuth and user session management
"""
from flask import Blueprint, jsonify, request
from app.services.auth_service import AuthService
from app.utils.errors import BadRequestError, UnauthorizedError

auth_bp = Blueprint("auth", __name__)


@auth_bp.get("/google/url")
def get_google_auth_url():
    """Get Google OAuth authorization URL"""
    try:
        result = AuthService.get_auth_url()
        return jsonify(result), 200
    except BadRequestError as e:
        return jsonify({"error": "configuration_error", "message": str(e)}), 500


@auth_bp.post("/google/callback")
def google_callback():
    """Handle Google OAuth callback"""
    body = request.get_json() or {}
    code = body.get("code")
    state = body.get("state")

    if not code:
        raise BadRequestError("Authorization code is required")

    try:
        # Exchange code for token
        token_data = AuthService.exchange_code_for_token(code)
        access_token = token_data.get("access_token")

        if not access_token:
            raise BadRequestError("Failed to get access token")

        # Get user info from Google
        user_info = AuthService.get_user_info(access_token)

        # Find or create user in database
        user = AuthService.find_or_create_user(user_info)

        # Create session
        session_token = AuthService.create_session(user)

        return jsonify({
            "token": session_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "picture": user.picture,
                "role": user.role,
            }
        }), 200

    except Exception as e:
        return jsonify({
            "error": "authentication_failed",
            "message": str(e)
        }), 400


@auth_bp.get("/me")
def get_current_user():
    """Get current authenticated user"""
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise UnauthorizedError("Missing or invalid authorization header")

    token = auth_header.replace("Bearer ", "")
    user = AuthService.get_user_by_session(token)

    if not user:
        raise UnauthorizedError("Invalid or expired session")

    return jsonify({
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
    }), 200


@auth_bp.post("/logout")
def logout():
    """Logout current user"""
    auth_header = request.headers.get("Authorization")

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        AuthService.invalidate_session(token)

    return jsonify({"ok": True, "message": "Logged out successfully"}), 200


@auth_bp.put("/users/<int:user_id>/role")
def update_user_role(user_id: int):
    """Update user role (admin only)"""
    # Check if requester is admin
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise UnauthorizedError("Missing or invalid authorization header")

    token = auth_header.replace("Bearer ", "")
    current_user = AuthService.get_user_by_session(token)

    if not current_user or current_user.role != "admin":
        raise UnauthorizedError("Admin access required")

    body = request.get_json() or {}
    role = body.get("role")

    if not role:
        raise BadRequestError("Role is required")

    user = AuthService.update_user_role(user_id, role)

    return jsonify({
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
    }), 200


@auth_bp.get("/users")
def list_users():
    """List all users (admin only)"""
    # Check if requester is admin
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise UnauthorizedError("Missing or invalid authorization header")

    token = auth_header.replace("Bearer ", "")
    current_user = AuthService.get_user_by_session(token)

    if not current_user or current_user.role != "admin":
        raise UnauthorizedError("Admin access required")

    from app.db.models import User
    users = User.query.all()

    return jsonify([{
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
    } for user in users]), 200
