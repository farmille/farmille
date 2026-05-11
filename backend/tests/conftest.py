"""Phase 18 テスト基盤の共通 fixture / 環境変数注入。

Sentry / Supabase / JWT を伴う実際の I/O はテストで触らない方針:
- supabase クライアントは個別テスト内で monkeypatch する
- JWT 検証は home の公開エンドポイントでは不要なため stub 不要
- Sentry は environment != production で初期化スキップ

import app.main 時点で settings (pydantic-settings) が必要となるため
テスト環境用のダミー値を session 単位で os.environ にセットする。
"""

from __future__ import annotations

import os

import pytest

# 必須環境変数のダミー値を import 前に注入（settings は app import 時に評価される）
os.environ.setdefault("SUPABASE_URL", "http://localhost:54321")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("ENVIRONMENT", "test")


@pytest.fixture
def client():
    """FastAPI TestClient。tests 個別で必要に応じて利用する。"""
    from fastapi.testclient import TestClient

    from app.main import app

    return TestClient(app)
