import "server-only";

// TMDb API キーはサーバー側のみで保持しクライアントに露出しない（SPEC.md 第2部4章）
const TMDB_BASE = "https://api.themoviedb.org/3";
const TIMEOUT_MS = 3_000; // 検索 3秒以内（SPEC.md F-03 例外系）

export class TmdbError extends Error {}

export type TmdbSearchResult = {
  tmdbId: number;
  title: string;
  releaseYear: string | null;
  posterPath: string | null;
};

export type TmdbMovie = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  genres: string[];
  releaseDate: string | null;
};

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN;
  if (!token) throw new TmdbError("TMDB_API_READ_ACCESS_TOKEN が未設定です");

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("language", "ja-JP");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 60 * 60 * 24 }, // 作品情報は1日キャッシュ【仮】
    });
  } catch {
    throw new TmdbError("TMDb への接続に失敗またはタイムアウトしました");
  }
  if (!res.ok) throw new TmdbError(`TMDb がエラーを返しました (${res.status})`);
  return res.json() as Promise<T>;
}

/** タイトル検索（最大20件 = TMDb の1ページ） */
export async function searchMovies(query: string): Promise<TmdbSearchResult[]> {
  const data = await tmdbFetch<{
    results: {
      id: number;
      title: string;
      release_date?: string;
      poster_path: string | null;
    }[];
  }>("/search/movie", { query, include_adult: "false", page: "1" });

  return data.results.map((r) => ({
    tmdbId: r.id,
    title: r.title,
    releaseYear: r.release_date ? r.release_date.slice(0, 4) : null,
    posterPath: r.poster_path,
  }));
}

/** おすすめカテゴリ（SPEC.md F-11【仮】）。genreId は TMDb のジャンル ID */
export const DISCOVER_CATEGORIES = [
  { label: "いま人気", genreId: null },
  { label: "アクション", genreId: 28 },
  { label: "ホラー", genreId: 27 },
  { label: "コメディ", genreId: 35 },
  { label: "SF", genreId: 878 },
  { label: "アニメーション", genreId: 16 },
  { label: "ロマンス", genreId: 10749 },
  { label: "スリラー", genreId: 53 },
  { label: "アドベンチャー", genreId: 12 },
  { label: "ミステリー", genreId: 9648 },
] as const;

export type DiscoverCategory = (typeof DISCOVER_CATEGORIES)[number];

/** カテゴリの人気作品（20件 = TMDb の1ページ）。genreId が null なら全ジャンル */
export async function discoverMovies(
  genreId: number | null,
): Promise<TmdbSearchResult[]> {
  const params: Record<string, string> = {
    sort_by: "popularity.desc",
    include_adult: "false",
    "vote_count.gte": "100", // 極端にマイナーな作品を避ける【仮】
    page: "1",
  };
  if (genreId !== null) params.with_genres = String(genreId);

  const data = await tmdbFetch<{
    results: {
      id: number;
      title: string;
      release_date?: string;
      poster_path: string | null;
    }[];
  }>("/discover/movie", params);

  return data.results.map((r) => ({
    tmdbId: r.id,
    title: r.title,
    releaseYear: r.release_date ? r.release_date.slice(0, 4) : null,
    posterPath: r.poster_path,
  }));
}

/** 作品詳細（ジャンル名を含む） */
export async function getMovie(tmdbId: number): Promise<TmdbMovie> {
  const data = await tmdbFetch<{
    id: number;
    title: string;
    poster_path: string | null;
    genres: { name: string }[];
    release_date?: string;
  }>(`/movie/${tmdbId}`, {});

  return {
    tmdbId: data.id,
    title: data.title,
    posterPath: data.poster_path,
    genres: data.genres.map((g) => g.name),
    releaseDate: data.release_date || null,
  };
}

