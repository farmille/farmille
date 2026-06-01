from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str
    cors_origins: str = "http://localhost:3000"
    environment: str = "development"

    # 2026-05-27: signup の email 確認フロー要否を env で切替。
    # dev=False (確認スキップして即 login 可)、prod=True (確認メール経由必須) を想定。
    # True にした場合、別途 Supabase Email 設定 (Supabase dashboard / SMTP) が必要。
    signup_require_email_confirm: bool = False

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
