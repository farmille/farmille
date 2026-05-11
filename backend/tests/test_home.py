"""Phase 18 /v1/home aggregated endpoint tests.

spec docs/specs/home.md §5.1 / §9.1。
- 並列フェッチで 3 系統を 200 で返す
- limit パラメータの境界 (1 / max / 0 で 422 / max+1 で 422)
- 0 件でも 200 + 空配列
- 未公開 (displayed_at / published_at NULL or 未来) は含まれない (mock 側で SELECT のフィルタを検証)
"""

from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock

import pytest


# ─── helpers ───────────────────────────────────────────────────────────


class _FluentQuery:
    """supabase-py の chain (.table().select().lte().order().limit().execute()) を疑似する。

    呼び出された method 名と引数を `calls` に積み、execute で `data` を返す。
    本物の supabase-py より緩い: order/lte/eq/not_.is_/limit/range 等を全部 noop で受ける。
    """

    def __init__(self, data: list[dict[str, Any]] | None = None) -> None:
        self.data = data or []
        self.calls: list[tuple[str, tuple, dict]] = []
        # not_ chain support
        self.not_ = self  # `not_.is_("col", "null")` → self.is_(...)

    def _record(self, name: str, *args, **kwargs) -> "_FluentQuery":
        self.calls.append((name, args, kwargs))
        return self

    def select(self, *a, **kw):
        return self._record("select", *a, **kw)

    def lte(self, *a, **kw):
        return self._record("lte", *a, **kw)

    def order(self, *a, **kw):
        return self._record("order", *a, **kw)

    def limit(self, *a, **kw):
        return self._record("limit", *a, **kw)

    def is_(self, *a, **kw):
        return self._record("is_", *a, **kw)

    def execute(self) -> MagicMock:
        result = MagicMock()
        result.data = self.data
        return result


class _StubAdmin:
    """`get_supabase_admin()` の戻り値の最低限の置き換え。"""

    def __init__(self, table_responses: dict[str, list[dict[str, Any]]]):
        self._responses = table_responses
        self.queries: dict[str, _FluentQuery] = {}

    def table(self, name: str) -> _FluentQuery:
        q = _FluentQuery(self._responses.get(name, []))
        self.queries[name] = q
        return q


@pytest.fixture
def home_module(monkeypatch):
    """app.routers.home の get_supabase_admin を差し替えるための fixture."""
    from app.routers import home as home_module

    def install(table_responses: dict[str, list[dict[str, Any]]]) -> _StubAdmin:
        admin = _StubAdmin(table_responses)
        monkeypatch.setattr(home_module, "get_supabase_admin", lambda: admin)
        return admin

    return install


# ─── tests ─────────────────────────────────────────────────────────────


def test_home_empty_returns_200_with_empty_arrays(client, home_module):
    home_module({"featured_products": [], "articles": [], "home_banners": []})
    res = client.get("/v1/home")
    assert res.status_code == 200
    body = res.json()
    assert body == {
        "featured_products": [],
        "latest_articles": [],
        "banners": [],
    }


def test_home_returns_all_three_series(client, home_module):
    admin = home_module(
        {
            "featured_products": [
                {
                    "id": "11111111-1111-1111-1111-111111111111",
                    "sort_order": 0,
                    "displayed_at": "2026-05-10T00:00:00Z",
                    "products": {
                        "id": "22222222-2222-2222-2222-222222222222",
                        "name": "微生物資材 A",
                        "users": {
                            "name": "山田太郎",
                            "maker_profiles": {"company_name": "ACME Bio"},
                        },
                        "product_types": {"id": "t", "name": "BS資材"},
                        "product_images": [
                            {"url": "https://example.supabase.co/o/a.png", "order": 0}
                        ],
                    },
                }
            ],
            "articles": [
                {
                    "id": "33333333-3333-3333-3333-333333333333",
                    "slug": "monthly-2026-05",
                    "title": "5月レポート",
                    "category": "monthly_report",
                    "hero_image_url": None,
                    "published_at": "2026-05-01T00:00:00Z",
                    "body_md": "# 見出し\n\n本文",
                }
            ],
            "home_banners": [
                {
                    "id": "44444444-4444-4444-4444-444444444444",
                    "title": "新機能のお知らせ",
                    "image_url": "https://example.supabase.co/b/x.png",
                    "link_url": "https://example.com/news",
                    "sort_order": 0,
                    "displayed_at": "2026-05-09T00:00:00Z",
                }
            ],
        }
    )
    res = client.get("/v1/home")
    assert res.status_code == 200
    body = res.json()
    assert len(body["featured_products"]) == 1
    assert body["featured_products"][0]["product"]["maker_name"] == "ACME Bio"
    assert body["featured_products"][0]["product"]["image_url"] == (
        "https://example.supabase.co/o/a.png"
    )
    assert len(body["latest_articles"]) == 1
    # excerpt は markdown 記号が除去され body_md の先頭 120 文字を返す
    assert "見出し" in body["latest_articles"][0]["excerpt"]
    assert "#" not in body["latest_articles"][0]["excerpt"]
    assert len(body["banners"]) == 1
    assert body["banners"][0]["link_url"] == "https://example.com/news"

    # spec §5.1: featured_products / home_banners は displayed_at <= now() で絞る
    fp_calls = [c[0] for c in admin.queries["featured_products"].calls]
    assert "lte" in fp_calls  # displayed_at <= now()
    # articles は published_at NOT NULL かつ <= now()
    art_calls = [c[0] for c in admin.queries["articles"].calls]
    assert "is_" in art_calls  # not_.is_("published_at", "null")
    assert "lte" in art_calls


def test_home_falls_back_to_user_name_when_company_name_missing(client, home_module):
    home_module(
        {
            "featured_products": [
                {
                    "id": "11111111-1111-1111-1111-111111111111",
                    "sort_order": 1,
                    "displayed_at": "2026-05-10T00:00:00Z",
                    "products": {
                        "id": "22222222-2222-2222-2222-222222222222",
                        "name": "資材 B",
                        # company_name 空、users.name にフォールバック
                        "users": {"name": "山田太郎", "maker_profiles": {}},
                        "product_types": {"id": "t", "name": "肥料"},
                        "product_images": [],
                    },
                }
            ],
            "articles": [],
            "home_banners": [],
        }
    )
    res = client.get("/v1/home")
    assert res.status_code == 200
    fp = res.json()["featured_products"][0]
    assert fp["product"]["maker_name"] == "山田太郎"
    assert fp["product"]["image_url"] is None


def test_home_handles_maker_profiles_as_list(client, home_module):
    """Supabase の 1:1 join が list[dict] で返ってきても受ける (spec §10.x で吸収)."""
    home_module(
        {
            "featured_products": [
                {
                    "id": "11111111-1111-1111-1111-111111111111",
                    "sort_order": 0,
                    "displayed_at": "2026-05-10T00:00:00Z",
                    "products": {
                        "id": "22222222-2222-2222-2222-222222222222",
                        "name": "資材 C",
                        "users": {
                            "name": "佐藤",
                            "maker_profiles": [{"company_name": "Beta Corp"}],
                        },
                        "product_types": None,
                        "product_images": None,
                    },
                }
            ],
            "articles": [],
            "home_banners": [],
        }
    )
    res = client.get("/v1/home")
    assert res.status_code == 200
    fp = res.json()["featured_products"][0]
    assert fp["product"]["maker_name"] == "Beta Corp"
    assert fp["product"]["type_name"] is None


def test_home_skips_featured_when_product_missing(client, home_module):
    """FK CASCADE で通常起きないが防御的に: products が無い行はスキップ."""
    home_module(
        {
            "featured_products": [
                {
                    "id": "11111111-1111-1111-1111-111111111111",
                    "sort_order": 0,
                    "displayed_at": "2026-05-10T00:00:00Z",
                    "products": None,
                }
            ],
            "articles": [],
            "home_banners": [],
        }
    )
    res = client.get("/v1/home")
    assert res.status_code == 200
    assert res.json()["featured_products"] == []


# ─── boundary tests (spec §9.1) ─────────────────────────────────────────


def test_home_default_limits_apply(client, home_module):
    admin = home_module({"featured_products": [], "articles": [], "home_banners": []})
    res = client.get("/v1/home")
    assert res.status_code == 200
    # default: featured=8, articles=6, banners=3 → limit が呼ばれて引数で渡る
    for table, expected in [
        ("featured_products", 8),
        ("articles", 6),
        ("home_banners", 3),
    ]:
        limit_calls = [c for c in admin.queries[table].calls if c[0] == "limit"]
        assert limit_calls and limit_calls[-1][1][0] == expected, (
            f"{table}: expected default limit {expected}"
        )


def test_home_custom_limits_pass_through(client, home_module):
    admin = home_module({"featured_products": [], "articles": [], "home_banners": []})
    res = client.get(
        "/v1/home", params={"featured_limit": 5, "articles_limit": 4, "banners_limit": 2}
    )
    assert res.status_code == 200
    for table, expected in [
        ("featured_products", 5),
        ("articles", 4),
        ("home_banners", 2),
    ]:
        limit_calls = [c for c in admin.queries[table].calls if c[0] == "limit"]
        assert limit_calls and limit_calls[-1][1][0] == expected


@pytest.mark.parametrize(
    "param,bad_value",
    [
        ("featured_limit", 0),
        ("featured_limit", 21),  # max 20
        ("articles_limit", 0),
        ("articles_limit", 13),  # max 12
        ("banners_limit", 0),
        ("banners_limit", 11),  # max 10
    ],
)
def test_home_invalid_limits_return_422(client, home_module, param, bad_value):
    home_module({"featured_products": [], "articles": [], "home_banners": []})
    res = client.get("/v1/home", params={param: bad_value})
    assert res.status_code == 422


def test_home_does_not_require_auth(client, home_module):
    """spec §3.2 公開 GET は未ログインで叩ける."""
    home_module({"featured_products": [], "articles": [], "home_banners": []})
    # Authorization ヘッダなしで叩く
    res = client.get("/v1/home")
    assert res.status_code == 200
