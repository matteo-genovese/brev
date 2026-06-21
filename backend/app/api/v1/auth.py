"""Auth router — register, login, me."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.rate_limit import rate_limit
from app.core.security import clear_session_cookie, set_session_cookie
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationResponse,
    VerifyEmailResponse,
)
from app.schemas.user import UserOut
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=201,
    dependencies=[Depends(rate_limit("auth-register", 10, 3600))],
)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.register(db, body)


@router.post(
    "/login",
    response_model=LoginResponse,
    dependencies=[Depends(rate_limit("auth-login", 20, 900))],
)
async def login(
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    login_response = await auth_service.login(db, body.email, body.password)
    set_session_cookie(response, login_response.access_token)
    return login_response


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=str(current_user.id),
        email=current_user.email,
        display_name=current_user.display_name,
        is_verified=current_user.is_verified,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at,
    )


@router.post("/logout", status_code=204)
async def logout(response: Response):
    clear_session_cookie(response)


@router.post("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(
    token: str = Query(min_length=16),
    db: AsyncSession = Depends(get_db),
):
    user = await auth_service.verify_email(db, token)
    return VerifyEmailResponse(email=user.email, is_verified=user.is_verified)


@router.post("/resend-verification", response_model=ResendVerificationResponse)
async def resend_verification(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    token = await auth_service.resend_verification(db, current_user)
    if token is None:
        return ResendVerificationResponse(message="Email is already verified")
    return ResendVerificationResponse(
        verification_token=token,
        message="Verification token generated",
    )
