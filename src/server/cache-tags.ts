/** リクエストをまたいでキャッシュする公開データのタグ。書き込んだ Server Action が updateTag で失効させる。 */
export const CACHE_TAGS = {
  catalog: "catalog",
  classifications: "classifications",
} as const;
