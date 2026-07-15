import Link from "next/link";
import { Poster } from "@/components/poster";
import { filterRecommendations, pickCategory } from "@/lib/discover";
import { createClient } from "@/lib/supabase/server";
import { DISCOVER_CATEGORIES, discoverMovies } from "@/lib/tmdb";

/**
 * おすすめ作品セクション（SPEC.md F-11 / DESIGN.md S-3）。
 * ランダムな1カテゴリの人気作品を最大10件、横スクロール行で表示する。
 * 除外リスト取得を含め全て Suspense 内で行い、コレクション本体を遅延させない。
 * TMDb 障害時・0件時はセクションごと非表示（コレクション表示に影響させない）。
 */
export async function DiscoverSection({ userId }: { userId: string }) {
  const category = pickCategory(DISCOVER_CATEGORIES);

  let movies;
  try {
    const supabase = await createClient();
    const [{ data: recorded }, results] = await Promise.all([
      supabase
        .from("viewing_records")
        .select("movies(tmdb_id)")
        .eq("user_id", userId),
      discoverMovies(category.genreId),
    ]);
    const exclude = new Set(
      (recorded ?? [])
        .map((r) => (r.movies as unknown as { tmdb_id: number })?.tmdb_id)
        .filter((id): id is number => typeof id === "number"),
    );
    movies = filterRecommendations(results, exclude);
  } catch {
    return null;
  }
  if (movies.length === 0) return null;

  return (
    <section className="mt-10" aria-label={`おすすめ ${category.label}`}>
      <h2 className="mb-3 text-[17px] font-bold">
        おすすめ
        <span className="mx-2 text-fg-mute" aria-hidden>
          |
        </span>
        <span className="text-gold">{category.label}</span>
      </h2>
      {/* 横スクロールはこのコンテナ内で完結させる（DESIGN.md §4） */}
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
        {movies.map((m) => (
          <li key={m.tmdbId} className="w-[110px] shrink-0 snap-start">
            <Link
              href={`/record/new?tmdbId=${m.tmdbId}`}
              className="block rounded-lg"
            >
              <Poster path={m.posterPath} title={m.title} sizes="110px" />
              <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-fg-sub">
                {m.title}
              </p>
              <p className="text-[10.5px] text-fg-mute">
                {m.releaseYear ?? ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** ストリーミング中のスケルトン（DESIGN.md S-3） */
export function DiscoverSectionSkeleton() {
  return (
    <section className="mt-10" aria-hidden>
      <div className="mb-3 h-6 w-40 animate-pulse rounded bg-surface" />
      <div className="-mx-4 flex gap-3 overflow-hidden px-4 md:-mx-6 md:px-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="w-[110px] shrink-0">
            <div className="aspect-2/3 animate-pulse rounded-lg bg-surface" />
          </div>
        ))}
      </div>
    </section>
  );
}
