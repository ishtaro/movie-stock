import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { filterRecommendations, pickCategory } from "@/lib/discover";
import {
  DISCOVER_CATEGORIES,
  discoverMovies,
  type TmdbSearchResult,
} from "@/lib/tmdb";

function result(tmdbId: number, posterPath: string | null = "/p.jpg"): TmdbSearchResult {
  return { tmdbId, title: `作品${tmdbId}`, releaseYear: "2020", posterPath };
}

describe("filterRecommendations（SPEC.md F-11）", () => {
  it("記録済みの作品を除外する", () => {
    const results = [result(1), result(2), result(3)];
    const out = filterRecommendations(results, new Set([2]));
    expect(out.map((r) => r.tmdbId)).toEqual([1, 3]);
  });

  it("最大10件に切り詰める", () => {
    const results = Array.from({ length: 20 }, (_, i) => result(i + 1));
    expect(filterRecommendations(results, new Set())).toHaveLength(10);
  });

  it("ポスターのある作品を優先する", () => {
    const results = [result(1, null), result(2), result(3, null), result(4)];
    const out = filterRecommendations(results, new Set(), 3);
    expect(out.map((r) => r.tmdbId)).toEqual([2, 4, 1]);
  });

  it("例外系: 全件除外なら空配列（セクション非表示の判定に使う）", () => {
    const results = [result(1), result(2)];
    expect(filterRecommendations(results, new Set([1, 2]))).toEqual([]);
  });
});

describe("pickCategory", () => {
  it("random 値に応じてカテゴリを選ぶ（境界: 0 と 1 直前）", () => {
    expect(pickCategory(DISCOVER_CATEGORIES, () => 0)).toBe(
      DISCOVER_CATEGORIES[0],
    );
    expect(pickCategory(DISCOVER_CATEGORIES, () => 0.999999)).toBe(
      DISCOVER_CATEGORIES[DISCOVER_CATEGORIES.length - 1],
    );
  });
});

describe("discoverMovies", () => {
  beforeEach(() => vi.stubEnv("TMDB_API_READ_ACCESS_TOKEN", "test-token"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("ジャンル指定・人気順・ja-JP で Discover API を呼ぶ", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        results: [
          { id: 603, title: "マトリックス", release_date: "1999-09-11", poster_path: "/m.jpg" },
        ],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const out = await discoverMovies(28);
    expect(out[0]).toEqual({
      tmdbId: 603,
      title: "マトリックス",
      releaseYear: "1999",
      posterPath: "/m.jpg",
    });
    const url = String((fetchMock.mock.calls[0] as unknown as [URL])[0]);
    expect(url).toContain("/discover/movie");
    expect(url).toContain("with_genres=28");
    expect(url).toContain("sort_by=popularity.desc");
    expect(url).toContain("language=ja-JP");
  });

  it("genreId が null（いま人気）なら with_genres を付けない", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ results: [] }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    await discoverMovies(null);
    expect(
      String((fetchMock.mock.calls[0] as unknown as [URL])[0]),
    ).not.toContain("with_genres");
  });
});
