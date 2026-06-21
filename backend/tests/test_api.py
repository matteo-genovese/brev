from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


@pytest.fixture()
def client(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    monkeypatch.setenv("JWT_SECRET", "test-secret-that-is-long-enough-for-dev")
    monkeypatch.setenv("CORS_ORIGINS", '["http://testserver"]')
    monkeypatch.setenv("DEBUG", "false")
    for name in list(sys.modules):
        if name == "app" or name.startswith("app."):
            sys.modules.pop(name)
    from app.main import app

    with TestClient(app) as client:
        yield client


def _register_and_login(client: TestClient, email: str = "user@example.com") -> str:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123"},
    )
    assert response.status_code == 201
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_auth_link_crud_and_redirect(client):
    token = _register_and_login(client)

    response = client.post(
        "/api/v1/links",
        headers={"Authorization": f"Bearer {token}"},
        json={"url": "https://example.com/article", "slug": "article"},
    )
    assert response.status_code == 201
    link = response.json()
    assert link["url"] == "https://example.com/article"
    assert link["clicks"] == 0

    response = client.get("/api/v1/links", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["total"] == 1

    response = client.get("/article", follow_redirects=False, headers={"Host": "brevl.ink"})
    assert response.status_code == 307
    assert response.headers["location"] == "https://example.com/article"

    response = client.delete(
        f"/api/v1/links/{link['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 204


def test_link_ownership_is_enforced(client):
    first = _register_and_login(client, "first@example.com")
    second = _register_and_login(client, "second@example.com")

    response = client.post(
        "/api/v1/links",
        headers={"Authorization": f"Bearer {first}"},
        json={"url": "https://example.com/private", "slug": "private"},
    )
    assert response.status_code == 201
    link_id = response.json()["id"]

    response = client.delete(
        f"/api/v1/links/{link_id}",
        headers={"Authorization": f"Bearer {second}"},
    )
    assert response.status_code == 404


def test_unverified_domain_cannot_be_used(client):
    token = _register_and_login(client)

    response = client.post(
        "/api/v1/domains",
        headers={"Authorization": f"Bearer {token}"},
        json={"domain": "go.example.com"},
    )
    assert response.status_code == 201
    domain = response.json()
    assert domain["is_verified"] is False
    assert domain["verification_token"]

    response = client.post(
        "/api/v1/links",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "url": "https://example.com",
            "slug": "go",
            "domain_id": domain["id"],
        },
    )
    assert response.status_code == 422


def test_api_key_can_authenticate(client):
    token = _register_and_login(client)

    response = client.post(
        "/api/v1/api-keys",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "tests"},
    )
    assert response.status_code == 201
    api_key = response.json()["token"]

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {api_key}"})
    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"
