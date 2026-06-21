"""API key management."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import generate_api_key, hash_api_key
from app.models.api_key import APIKey
from app.schemas.api_key import APIKeyCreateResponse, APIKeyOut


async def create_api_key(db: AsyncSession, user_id: str, name: str) -> APIKeyCreateResponse:
    token = generate_api_key()
    api_key = APIKey(
        id=uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        name=name,
        token_hash=hash_api_key(token),
        prefix=token[:11],
    )
    db.add(api_key)
    await db.flush()
    await db.refresh(api_key)
    return APIKeyCreateResponse(token=token, **_api_key_dict(api_key))


async def list_api_keys(db: AsyncSession, user_id: str) -> tuple[list[APIKeyOut], int]:
    uid = uuid.UUID(user_id)
    total = await db.scalar(select(func.count(APIKey.id)).where(APIKey.user_id == uid)) or 0
    result = await db.execute(
        select(APIKey).where(APIKey.user_id == uid).order_by(APIKey.created_at.desc())
    )
    return [APIKeyOut(**_api_key_dict(key)) for key in result.scalars().all()], total


async def revoke_api_key(db: AsyncSession, key_id: str, user_id: str) -> None:
    result = await db.execute(
        select(APIKey).where(APIKey.id == uuid.UUID(key_id), APIKey.user_id == uuid.UUID(user_id))
    )
    api_key = result.scalar_one_or_none()
    if api_key is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")
    api_key.is_active = False
    await db.flush()


async def get_user_id_for_api_key(db: AsyncSession, token: str) -> str | None:
    if not token.startswith("brev_"):
        return None
    result = await db.execute(
        select(APIKey).where(
            APIKey.token_hash == hash_api_key(token),
            APIKey.is_active.is_(True),
        )
    )
    api_key = result.scalar_one_or_none()
    if api_key is None:
        return None
    api_key.last_used_at = datetime.now(UTC)
    await db.flush()
    return str(api_key.user_id)


def _api_key_dict(api_key: APIKey) -> dict:
    return {
        "id": str(api_key.id),
        "name": api_key.name,
        "prefix": api_key.prefix,
        "is_active": api_key.is_active,
        "last_used_at": api_key.last_used_at,
        "created_at": api_key.created_at,
    }
