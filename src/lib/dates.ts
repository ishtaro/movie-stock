/**
 * JST での今日の日付（YYYY-MM-DD）。
 * 未来日付の判定（SPEC.md F-04 例外系）はサーバーの TZ に依存させず JST 基準で行う。
 */
export function todayJst(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());
}

/** "2026-07-09" → "2026/07/09" */
export function formatDate(isoDate: string): string {
  return isoDate.replaceAll("-", "/");
}

/** ISO タイムスタンプ → JST の "2026/07/09" */
export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" })
    .format(new Date(iso))
    .replaceAll("-", "/");
}

/** release_date から公開年を取り出す */
export function releaseYear(releaseDate: string | null): string {
  return releaseDate ? releaseDate.slice(0, 4) : "－";
}
