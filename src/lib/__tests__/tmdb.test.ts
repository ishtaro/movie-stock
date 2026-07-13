import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMovie, searchMovies, TmdbError } from "@/lib/tmdb";

const okSearchResponse = {
  ok: true,
  json: async () => ({
    results: [
      {
        id: 372058,
        title: "君の名は。",
        release_date: "2016-08-26",
        poster_path: "/poster.jpg",
      },
      { id: 2, title: "無名作品", release_date: "", poster_path: null },
    ],
  }),
};

describe("TMDb クライアント（SPEC.md F-03）", () => {
  beforeEach(() => {
    vi.stubEnv("TMDB_API_READ_ACCESS_TOKEN", "test-token");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("検索結果をタイトル・公開年・ポスターに整形する", async () => {
    const fetchMock = vi.fn(async () => okSearchResponse);
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchMovies("君の名は");
    expect(results[0]).toEqual({
      tmdbId: 372058,
      title: "君の名は。",
      releaseYear: "2016",
      posterPath: "/poster.jpg",
    });
    // 公開日空・ポスターなしも欠損として扱える
    expect(results[1].releaseYear).toBeNull();
    expect(results[1].posterPath).toBeNull();

    // language=ja-JP・Bearer トークンで呼ぶ（キーは URL に載せない）
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      URL,
      RequestInit,
    ];
    expect(String(url)).toContain("language=ja-JP");
    expect(String(url)).not.toContain("test-token");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-token",
    );
  });

  it("作品詳細はジャンル名の配列に整形する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          id: 372058,
          title: "君の名は。",
          poster_path: "/p.jpg",
          genres: [{ name: "アニメーション" }, { name: "ドラマ" }],
          release_date: "2016-08-26",
        }),
      })),
    );
    const movie = await getMovie(372058);
    expect(movie.genres).toEqual(["アニメーション", "ドラマ"]);
    expect(movie.releaseDate).toBe("2016-08-26");
  });

  it("例外系: TMDb がエラーを返したら TmdbError を投げる", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
    await expect(searchMovies("x")).rejects.toBeInstanceOf(TmdbError);
  });

  it("例外系: 接続失敗・タイムアウトは TmdbError に変換する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("timeout", "TimeoutError");
      }),
    );
    await expect(searchMovies("x")).rejects.toBeInstanceOf(TmdbError);
  });

  it("例外系: トークン未設定なら API を呼ばずに TmdbError を投げる", async () => {
    vi.stubEnv("TMDB_API_READ_ACCESS_TOKEN", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(searchMovies("x")).rejects.toBeInstanceOf(TmdbError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
