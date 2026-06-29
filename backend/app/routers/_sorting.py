"""Admin 一覧の列ソート共通ヘルパ (2026-06-29)。

frontend は `?sort=<key>&dir=asc|desc` を送る。各 endpoint は許可カラムの
allowlist (frontend のキー → DB カラム名) を渡し、未知の sort は default に
フォールバックする (任意カラムでの order injection を防ぐ)。既定は「最新が上」=
日時系カラムの desc。
"""

from __future__ import annotations


def resolve_sort(
    sort: str | None,
    direction: str | None,
    allowed: dict[str, str],
    *,
    default_key: str,
    default_desc: bool = True,
) -> tuple[str, bool]:
    """(db_column, descending) を返す。

    - sort が allowlist にあれば、その DB カラムを使い、desc は dir で決める
      (明示的に "asc" のときだけ昇順、その他は降順)。
    - sort が無い/未許可なら default_key の列を default_desc 方向で使う。
    """
    if sort and sort in allowed:
        return allowed[sort], direction != "asc"
    return allowed[default_key], default_desc
