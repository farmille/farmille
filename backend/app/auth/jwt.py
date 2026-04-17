from jose import JWTError, jwt

from app.config import settings


def verify_jwt(token: str) -> dict | None:
    """Supabase JWTの署名を検証し、payloadを返す。"""
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except JWTError:
        return None


def get_user_id(payload: dict) -> str:
    """JWTペイロードからユーザーIDを取得。"""
    return payload.get("sub", "")


def get_user_role(payload: dict) -> str:
    """JWTペイロードからロールを取得。"""
    app_metadata = payload.get("app_metadata", {})
    return app_metadata.get("role", "unassigned")
