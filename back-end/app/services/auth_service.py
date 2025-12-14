"""
Authentication service for OAuth and user management
"""
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import requests
from app.db import db
from app.db.models import User
from app.utils.errors import BadRequestError, NotFoundError, UnauthorizedError


class AuthService:
    """Handle OAuth authentication and user session management"""

    # In-memory session store (use Redis in production)
    _sessions: Dict[str, Dict[str, Any]] = {}

    @staticmethod
    def get_google_oauth_config() -> Dict[str, str]:
        """Get Google OAuth configuration from environment"""
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "https://bobateashopsite.onrender.com/auth/callback")

        if not client_id or not client_secret:
            raise BadRequestError(
                "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
            )

        return {
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "auth_uri": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "userinfo_uri": "https://www.googleapis.com/oauth2/v2/userinfo",
        }

    @staticmethod
    def get_auth_url(state: Optional[str] = None) -> Dict[str, str]:
        """Generate Google OAuth authorization URL"""
        config = AuthService.get_google_oauth_config()

        if not state:
            state = secrets.token_urlsafe(32)

        params = {
            "client_id": config["client_id"],
            "redirect_uri": config["redirect_uri"],
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }

        auth_url = f"{config['auth_uri']}?" + "&".join(
            f"{k}={v}" for k, v in params.items()
        )

        return {
            "auth_url": auth_url,
            "state": state,
        }

    @staticmethod
    def exchange_code_for_token(code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        config = AuthService.get_google_oauth_config()

        data = {
            "code": code,
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "redirect_uri": config["redirect_uri"],
            "grant_type": "authorization_code",
        }

        response = requests.post(config["token_uri"], data=data)

        if response.status_code != 200:
            raise BadRequestError(f"Failed to exchange code: {response.text}")

        return response.json()

    @staticmethod
    def get_user_info(access_token: str) -> Dict[str, Any]:
        """Get user info from Google using access token"""
        config = AuthService.get_google_oauth_config()

        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(config["userinfo_uri"], headers=headers)

        if response.status_code != 200:
            raise BadRequestError(f"Failed to get user info: {response.text}")

        return response.json()

    @staticmethod
    def get_default_role_for_email(email: str) -> str:
        """Determine default role based on email domain"""
        # TAMU email addresses and special accounts get admin access
        if email.endswith("@tamu.edu") or email == "reveille.bubbletea@gmail.com":
            return "admin"

        # All other emails get customer role
        return "customer"

    @staticmethod
    def find_or_create_user(google_user_info: Dict[str, Any]) -> User:
        """Find or create user from Google user info"""
        email = google_user_info.get("email")
        google_id = google_user_info.get("id")

        if not email:
            raise BadRequestError("Email not provided by Google")

        # Try to find existing user by Google ID
        user = User.query.filter_by(google_id=google_id).first()

        if not user:
            # Try to find by email
            user = User.query.filter_by(email=email).first()

        if user:
            # Update existing user
            user.google_id = google_id
            user.name = google_user_info.get("name", user.name)
            user.picture = google_user_info.get("picture", user.picture)
            user.last_login = datetime.utcnow()
        else:
            # Determine role based on email
            default_role = AuthService.get_default_role_for_email(email)

            # Create new user
            user = User(
                email=email,
                name=google_user_info.get("name"),
                google_id=google_id,
                picture=google_user_info.get("picture"),
                role=default_role,
                is_active=True,
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow(),
            )
            db.session.add(user)

        db.session.commit()
        return user

    @staticmethod
    def create_session(user: User) -> str:
        """Create session token for user"""
        token = secrets.token_urlsafe(32)

        AuthService._sessions[token] = {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=7),
        }

        return token

    @staticmethod
    def get_session(token: str) -> Optional[Dict[str, Any]]:
        """Get session data from token"""
        session = AuthService._sessions.get(token)

        if not session:
            return None

        # Check if session expired
        if datetime.utcnow() > session["expires_at"]:
            del AuthService._sessions[token]
            return None

        return session

    @staticmethod
    def invalidate_session(token: str) -> None:
        """Invalidate session token"""
        if token in AuthService._sessions:
            del AuthService._sessions[token]

    @staticmethod
    def get_user_by_session(token: str) -> Optional[User]:
        """Get user from session token"""
        session = AuthService.get_session(token)

        if not session:
            return None

        user = User.query.get(session["user_id"])

        if not user or not user.is_active:
            return None

        return user

    @staticmethod
    def update_user_role(user_id: int, role: str) -> User:
        """Update user role (admin only)"""
        allowed_roles = ["customer", "cashier", "manager", "admin"]

        if role not in allowed_roles:
            raise BadRequestError(f"Invalid role. Must be one of: {', '.join(allowed_roles)}")

        user = User.query.get(user_id)

        if not user:
            raise NotFoundError(f"User {user_id} not found")

        user.role = role
        db.session.commit()

        return user
