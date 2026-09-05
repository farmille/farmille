import { randomBytes } from "node:crypto";

// 見間違えやすい文字（0/O・1/l/I）を除いた英数字。口頭・書き写しでの受け渡しを想定する。
const PASSWORD_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const PASSWORD_LENGTH = 20;
const INVITE_CODE_LENGTH = 12;

/**
 * 暗号論的乱数から偏りなく1文字ずつ選ぶ（剰余バイアスを避けるため範囲外のバイトは捨てる）。
 */
function randomString(alphabet: string, length: number): string {
  const limit = 256 - (256 % alphabet.length);
  const chars: string[] = [];

  while (chars.length < length) {
    for (const byte of randomBytes(length)) {
      if (byte >= limit) continue;
      chars.push(alphabet[byte % alphabet.length]);
      if (chars.length === length) break;
    }
  }

  return chars.join("");
}

/** メーカーの共有ログインの初期パスワード。生成値は承認直後に一度だけ画面へ出す。 */
export function generateInitialPassword(): string {
  return randomString(PASSWORD_ALPHABET, PASSWORD_LENGTH);
}

/** 招待コード（4文字ごとにハイフン）。 */
export function generateInviteCode(): string {
  const raw = randomString(INVITE_CODE_ALPHABET, INVITE_CODE_LENGTH);

  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}
