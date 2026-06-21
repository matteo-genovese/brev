"""API key schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class APIKeyCreate(BaseModel):
    name: str = Field(default="CLI", min_length=1, max_length=80)


class APIKeyOut(BaseModel):
    id: str
    name: str
    prefix: str
    is_active: bool
    last_used_at: datetime | None
    created_at: datetime


class APIKeyCreateResponse(APIKeyOut):
    token: str


class APIKeyList(BaseModel):
    items: list[APIKeyOut]
    total: int
