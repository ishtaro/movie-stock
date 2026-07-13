import { describe, expect, it } from "vitest";
import { getMovie, searchMovies } from "@/lib/tmdb";

/**
 * 実 TMDb API に対する疎通確認（F-03）。
 * TMDB_API_READ_ACCESS_TOKEN が未設定の場合はスキップする。
 */
const hasToken = Boolean(process.env.TMDB_API_READ_ACCESS_TOKEN);

describe.skipIf(!hasToken)("TMDb 実 API（F-03）", () => {
  it("日本語タイトルで検索でき、日本語の結果が返る", async () => {
    const results = await searchMovies("君の名は。");
    expect(results.length).toBeGreaterThan(0);
    const hit = results.find((r) => r.title === "君の名は。");
    expect(hit).toBeDefined();
    expect(hit!.releaseYear).toBe("2016");
    expect(hit!.posterPath).toBeTruthy();
  });

  it("作品詳細で日本語ジャンルが取得できる（アチーブメント判定の前提）", async () => {
    const results = await searchMovies("君の名は。");
    const hit = results.find((r) => r.title === "君の名は。")!;
    const movie = await getMovie(hit.tmdbId);
    expect(movie.genres.length).toBeGreaterThan(0);
    expect(movie.genres).toContain("アニメーション");
  });
});
