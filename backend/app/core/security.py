"""Password hashing, JWTs, session cookies, and API key helpers."""

from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi import HTTPException, Response, status
from pydantic import BaseModel

from app.core.config import settings

# ── Password hashing ──────────────────────────────────────────────────


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ── JWT ───────────────────────────────────────────────────────────────


class TokenPayload(BaseModel):
    sub: str  # user id (UUID)
    exp: datetime
    iat: datetime
    jti: str
    type: str = "access"


def create_access_token(user_id: str) -> str:
    now = datetime.now(UTC)
    expire = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": now,
        "jti": str(uuid.uuid4()),
        "type": "access",
    }
    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        return TokenPayload(**payload)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


# ── Browser session cookies ───────────────────────────────────────────


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=settings.secure_cookies,
        samesite="lax",
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        httponly=True,
        secure=settings.secure_cookies,
        samesite="lax",
        path="/",
    )


# ── API keys ──────────────────────────────────────────────────────────


def generate_api_key() -> str:
    return f"brev_{secrets.token_urlsafe(32)}"


def hash_api_key(token: str) -> str:
    peppered = f"{settings.jwt_secret}:{token}".encode()
    return hashlib.sha256(peppered).hexdigest()


def constant_time_equal(left: str, right: str) -> bool:
    return secrets.compare_digest(left, right)
