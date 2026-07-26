/** プロフィール編集の入力上限（DB制約外のUI/検証用）。 */
export const PROFILE_FIELD_LIMITS = {
  bio: 500,
  affiliation: 40,
  avatarMaxBytes: 2 * 1024 * 1024,
} as const;
