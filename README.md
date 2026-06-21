# Brev

> URL shortener. Your domain, your links, your way.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.12-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?logo=fastapi)](https://fastapi.tiangolo.com/)

Brev is an MIT-licensed URL shortener for self-hosting and hosted Cloud use.
The code is open source; the official hosted service, brand, and domains are
operated as Brev Cloud.

## Features

- Short links with redirect and click tracking.
- Multi-user link ownership.
- Custom domains with DNS verification before use.
- Host-aware redirects for default and custom domains.
- Browser sessions with `HttpOnly` cookies.
- Revocable API keys for CLI and programmatic access.
- Email verification hooks, Cloud billing entitlements, and admin moderation.
- Rate limiting on auth and link creation.
- FastAPI backend, Alembic migrations, React dashboard, Astro landing page, PostgreSQL, Caddy.

## Self-Hosted

```bash
git clone https://github.com/matteo-genovese/brev.git
cd brev
cp .env.example .env
openssl rand -hex 32   # use this for JWT_SECRET
openssl rand -hex 24   # use this for DB_PASSWORD
docker compose up -d
```

The self-hosted stack is fully contained: PostgreSQL, FastAPI, React dashboard,
Astro landing page, and Caddy routing.

## Brev Cloud

Brev Cloud is the official hosted service for users who want managed SSL,
custom-domain verification, backups, abuse controls, billing, and support.
Self-hosted Brev remains MIT licensed.

## CLI

```bash
pip install brev-cli

brev login user@example.com --server https://brevl.ink
brev token create --name laptop
brev create https://example.com --slug launch --title "Launch notes"
brev list
brev stats launch
brev delete launch
brev whoami
brev logout
```

`brev login` prompts for the password securely. `brev token create` creates and
stores a revocable API key for future CLI calls.

## API

API routes are under `/api/v1`.

Development docs are available when `DOCS_ENABLED=true`:

```text
http://localhost:8000/docs
http://localhost:8000/redoc
```

Production deployments should keep `DOCS_ENABLED=false`.

## Environment

| Variable | Required | Note |
| --- | :---: | --- |
| `JWT_SECRET` | yes | Strong signing key, at least 32 chars in production |
| `DB_PASSWORD` | yes | PostgreSQL password used by Docker Compose |
| `DATABASE_URL` | yes | PostgreSQL URI for non-compose deployments |
| `DEFAULT_DOMAIN` | no | Default short-link domain |
| `CORS_ORIGINS` | no | JSON list of allowed browser origins |
| `ENVIRONMENT` | no | `development` or `production` |
| `SECURE_COOKIES` | no | Must be `true` in production |
| `DOCS_ENABLED` | no | Disable in production |
| `CLOUD_MODE` | no | Enables subscription checks for Cloud-only limits |
| `REQUIRE_VERIFIED_EMAIL` | no | Requires verified email for custom domains |
| `FREE_CUSTOM_DOMAINS` | no | Included custom domains before subscription is required |
| `CNAME_TARGET` | no | DNS target shown for custom domains |
| `STRIPE_SECRET_KEY` | no | Cloud only |
| `STRIPE_WEBHOOK_SECRET` | no | Cloud only |
| `STRIPE_PRICE_ID` | no | Stripe recurring price for Brev Cloud |
| `STRIPE_SUCCESS_URL` | no | Checkout success redirect |
| `STRIPE_CANCEL_URL` | no | Checkout cancel redirect |

## Migrations

New deployments can still boot with automatic table creation for simple
self-hosting. Production operators should run Alembic migrations explicitly:

```bash
cd backend
alembic upgrade head
```

The CI workflow verifies the initial migration against SQLite.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting. The CI pipeline runs
backend tests, Python dependency audit, Bandit, npm audit, and frontend builds.

## License and Brand

Code is licensed under [MIT](LICENSE). Brand guidance is in
[TRADEMARK.md](TRADEMARK.md): MIT lets people use and redistribute the code, but
it does not grant permission to impersonate the official Brev Cloud service.
