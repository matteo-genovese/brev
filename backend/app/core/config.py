"""Application configuration via Pydantic Settings."""

from __future__ import annotations

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Database ──────────────────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://postgres:postgres@db:5432/brev"

    # ── Auth ──────────────────────────────────────────────────────────
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24 hours
    session_cookie_name: str = "brev_session"
    secure_cookies: bool = False

    # ── App ───────────────────────────────────────────────────────────
    default_domain: str = "brevl.ink"
    app_name: str = "Brev API"
    cors_origins: list[str] = ["*"]
    debug: bool = False
    environment: str = "development"
    docs_enabled: bool = True
    trusted_proxy_headers: bool = True

    # ── Caddy On-Demand TLS ───────────────────────────────────────────
    proxy_origin: str = "http://backend:8000"  # internal docker network
    caddy_admin_api: str = "http://caddy:2019"  # Caddy admin API
    cname_target: str = "proxy.brevl.ink."

    # ── Stripe (Cloud only) ───────────────────────────────────────────
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    stripe_price_id: str | None = None  # one-time payment price ID

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"prod", "production"}

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.is_production:
            if len(self.jwt_secret) < 32:
                raise ValueError("JWT_SECRET must be a strong secret in production")
            if "*" in self.cors_origins:
                raise ValueError("CORS_ORIGINS cannot contain '*' in production")
            if not self.secure_cookies:
                raise ValueError("SECURE_COOKIES must be true in production")
        return self


settings = Settings()
