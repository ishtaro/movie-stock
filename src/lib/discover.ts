import type { TmdbSearchResult } from "@/lib/tmdb";

/**
 * おすすめ表示のロジック（SPEC.md F-11）。純関数としてテスト可能に分離。
 */

/** ランダムに1カテゴリ選ぶ（random は注入可能: テスト用） */
export function pickCategory<T>(categories: readonly T[], random = Math.random): T {
  return categories[Math.floor(random() * categories.length)];
}

/**
 * 記録済み作品を除外し、ポスターのある作品を優先して最大 limit 件返す。
 * 0件になった場合は空配列（セクション非表示は呼び出し側の責務）。
 */
export function filterRecommendations(
  results: TmdbSearchResult[],
  excludeTmdbIds: ReadonlySet<number>,
  limit = 10,
): TmdbSearchResult[] {
  const candidates = results.filter((r) => !excludeTmdbIds.has(r.tmdbId));
  const withPoster = candidates.filter((r) => r.posterPath !== null);
  const withoutPoster = candidates.filter((r) => r.posterPath === null);
  return [...withPoster, ...withoutPoster].slice(0, limit);
}
