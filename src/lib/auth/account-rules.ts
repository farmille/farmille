// 登録・パスワードの入力規則。画面（クライアント）と server の検証で同じ値を使う。
// handle の上限は profiles_handle_length（migration 20260726121216）と一致させる。
export const HANDLE_MAX_LENGTH = 30;

// Supabase 側の下限（config.toml minimum_password_length = 6）より厳しくする。
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// RFC 5321 の経路の上限から、メールアドレスとして届けられる最大の長さ。
export const EMAIL_MAX_LENGTH = 254;

// Supabase 側でも検証されるため、ここでは形の明らかな誤りだけを弾く。
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
