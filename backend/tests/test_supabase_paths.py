"""Phase 19: public_url_to_path のエッジケース (BFF 側)。

frontend 側 ``frontend/src/lib/supabase/paths.ts`` と対称な実装。
"""

from app.lib.supabase_paths import public_url_to_path


PROJECT = "https://abcd.supabase.co"
BUCKET = "avatars"
UID = "11111111-1111-1111-1111-111111111111"


def test_happy_path():
    url = f"{PROJECT}/storage/v1/object/public/avatars/{UID}/avatar/face.png"
    assert public_url_to_path(url, BUCKET) == f"{UID}/avatar/face.png"


def test_url_decoded():
    url = f"{PROJECT}/storage/v1/object/public/avatars/{UID}/avatar/%E3%81%82.png"
    assert public_url_to_path(url, BUCKET) == f"{UID}/avatar/あ.png"


def test_wrong_host_rejected():
    url = f"https://evil.example.com/storage/v1/object/public/avatars/{UID}/avatar/x.png"
    assert public_url_to_path(url, BUCKET) is None


def test_wrong_bucket_rejected():
    url = f"{PROJECT}/storage/v1/object/public/review-images/{UID}/avatar/x.png"
    assert public_url_to_path(url, BUCKET) is None


def test_traversal_rejected():
    url = f"{PROJECT}/storage/v1/object/public/avatars/{UID}/../{UID}/avatar/x.png"
    assert public_url_to_path(url, BUCKET) is None


def test_garbage_input():
    assert public_url_to_path("not-a-url", BUCKET) is None
    assert public_url_to_path("", BUCKET) is None
