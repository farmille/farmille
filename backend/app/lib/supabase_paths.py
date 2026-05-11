"""Supabase Storage public URL ↔ path 変換ユーティリティ。

URL 形式 (2026-04 時点):
    ``https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<path>``

frontend 側 (`frontend/src/lib/supabase/paths.ts`) と対称な BFF 側実装。
PUT 時に payload で受けた public URL から bucket 内 path を抽出し、
``_image_path.validate_*`` で path 妥当性を検証する用途で使う。

Phase 19 で追加 (docs/specs/farmer-profile.md §5.2 / §5.4)。
"""

from __future__ import annotations

from urllib.parse import unquote, urlparse


def public_url_to_path(public_url: str, bucket: str) -> str | None:
    """Supabase Storage public URL から bucket 配下の path を抽出する。

    想定外の host / bucket / レイアウトの場合 ``None`` を返す。
    ``..`` を含む path も拒否 (traversal 防止、`_image_path` 側でも再検証)。
    """
    try:
        parsed = urlparse(public_url)
    except Exception:
        return None
    if not parsed.hostname or not parsed.hostname.endswith(".supabase.co"):
        return None
    marker = f"/storage/v1/object/public/{bucket}/"
    idx = parsed.path.find(marker)
    if idx == -1:
        return None
    raw = parsed.path[idx + len(marker):]
    if not raw or ".." in raw:
        return None
    return unquote(raw)
