"""Phase 19 で導入した pytest 共通フィクスチャ。

- 環境変数を test 用にダミー固定 (Supabase / JWT 関連)
- ``app.main.app`` を import する前に config を握りつぶす必要があるため、
  conftest.py の **import 時** に環境変数を注入する。
- 後続 phase で fixture を増やす場合はここに追記する。
"""

from __future__ import annotations

import os

# pydantic-settings は import 時に環境変数を読むため、
# 必ず "app.main" を import するより前にセットする。
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret-please-change")
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture()
def client():
    """FastAPI TestClient。各テストで ``dependency_overrides`` を差し替える前提。"""
    from app.main import app

    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def farmer_user() -> dict:
    """JWT payload を模した dict (farmer ロール)。"""
    return {
        "sub": "11111111-1111-1111-1111-111111111111",
        "app_metadata": {"role": "farmer"},
    }


@pytest.fixture()
def maker_user() -> dict:
    return {
        "sub": "22222222-2222-2222-2222-222222222222",
        "app_metadata": {"role": "maker"},
    }


@pytest.fixture()
def unassigned_user() -> dict:
    return {
        "sub": "33333333-3333-3333-3333-333333333333",
        "app_metadata": {"role": "unassigned"},
    }
