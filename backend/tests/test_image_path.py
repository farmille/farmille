"""Phase 19: validate_avatar_path のエッジケース。

spec §5.4 / §9.1 で要求される全ての分岐をカバー:
  - happy path
  - 第 1 階層 (UID) が他人 → False
  - 第 2 階層が 'avatar' 以外 → False
  - traversal '..' を含む → False
  - segment 数不足 → False
"""

from app.routers._image_path import validate_avatar_path


USER_ID = "11111111-1111-1111-1111-111111111111"
OTHER_ID = "99999999-9999-9999-9999-999999999999"


def test_happy_path():
    assert validate_avatar_path(f"{USER_ID}/avatar/face.png", USER_ID)


def test_with_nonce_in_filename():
    assert validate_avatar_path(
        f"{USER_ID}/avatar/abc123_face.webp", USER_ID
    )


def test_other_user_uid_rejected():
    assert not validate_avatar_path(
        f"{OTHER_ID}/avatar/face.png", USER_ID
    )


def test_second_segment_must_be_avatar():
    assert not validate_avatar_path(
        f"{USER_ID}/other/face.png", USER_ID
    )
    assert not validate_avatar_path(
        f"{USER_ID}/avatars/face.png", USER_ID
    )


def test_traversal_rejected():
    assert not validate_avatar_path(
        f"{USER_ID}/avatar/../etc/passwd", USER_ID
    )
    assert not validate_avatar_path(
        f"{USER_ID}/../{OTHER_ID}/avatar/face.png", USER_ID
    )


def test_too_few_segments():
    assert not validate_avatar_path(USER_ID, USER_ID)
    assert not validate_avatar_path(f"{USER_ID}/avatar", USER_ID)
