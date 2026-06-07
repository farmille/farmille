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

    # 2026-06-07: admin が「Farmille として」製品登録する際の紐づけ先
    # (Farmille 公式 maker ハウスアカウントの users.id)。
    # backend/scripts/create_farmille_maker.py で作成した id を環境ごとに設定する。
    # 未設定の場合、admin の製品登録は 503 farmille_maker_not_configured を返す。
    farmille_maker_user_id: str | None = None

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
