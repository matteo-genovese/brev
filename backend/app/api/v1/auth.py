"""Auth router — register, login, me."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.rate_limit import rate_limit
from app.core.security import clear_session_cookie, set_session_cookie
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse
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
        created_at=current_user.created_at,
    )


@router.post("/logout", status_code=204)
async def logout(response: Response):
    clear_session_cookie(response)
