"""Aggregate all v1 routers."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import api_keys, auth, domains, links

router = APIRouter(prefix="/v1")
router.include_router(auth.router)
router.include_router(links.router)
router.include_router(domains.router)
router.include_router(api_keys.router)
