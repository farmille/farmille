from supabase import create_client, Client

from app.config import settings

_supabase_admin: Client | None = None


def get_supabase_admin() -> Client:
    """Supabase Admin クライアント（service_role key）を返す。"""
    global _supabase_admin
    if _supabase_admin is None:
        _supabase_admin = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    return _supabase_admin
