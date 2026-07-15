import { Clapperboard } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  DiscoverSection,
  DiscoverSectionSkeleton,
} from "@/components/discover-section";
import { Poster } from "@/components/poster";
import { createClient } from "@/lib/supabase/server";
import type { RecordWithMovie } from "@/lib/types";

export const metadata: Metadata = { title: "コレクション" };

const PER_PAGE = 24;

const SORTS = {
  watched_desc: { label: "鑑賞日 ↓" },
  watched_asc: { label: "鑑賞日 ↑" },
  rating_desc: { label: "評価順" },
} as const;

type SortKey = keyof typeof SORTS;

/** コレクション一覧（SPEC.md F-05 / DESIGN.md S-3） */
export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const sort: SortKey = (
    Object.hasOwn(SORTS, params.sort ?? "") ? params.sort : "watched_desc"
  ) as SortKey;
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("viewing_records")
    .select("id, watched_on, rating, movies(title, poster_path)", {
      count: "exact",
    })
    .eq("user_id", user.id);

  if (sort === "watched_asc") {
    query = query.order("watched_on", { ascending: true });
  } else if (sort === "rating_desc") {
    query = query
      .order("rating", { ascending: false, nullsFirst: false })
      .order("watched_on", { ascending: false });
  } else {
    query = query.order("watched_on", { ascending: false });
  }

  const from = (page - 1) * PER_PAGE;
  const { data, count } = await query.range(from, from + PER_PAGE - 1);
  const records = (data ?? []) as unknown as Pick<
    RecordWithMovie,
    "id" | "watched_on" | "rating" | "movies"
  >[];
  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <div className="mb-4 flex items-baseline gap-2.5">
        <h1 className="text-xl font-bold">コレクション</h1>
        <span className="text-sm text-fg-sub">{total}本</span>
      </div>

      {total === 0 ? (
        // 空状態（SPEC.md F-05 例外系）
        <div className="flex flex-col items-center gap-4 py-24">
          <Clapperboard className="h-10 w-10 text-fg-mute" aria-hidden />
          <p className="text-sm text-fg-sub">最初の1本を記録しよう</p>
          <Link
            href="/search"
            className="flex h-12 items-center rounded-[10px] bg-linear-to-b from-gold to-gold-deep px-8 font-bold text-base"
          >
            映画をさがす
          </Link>
        </div>
      ) : (
        <>
          {/* 並び替え（F-05 Should） */}
          <div className="mb-4 flex gap-2">
            {(Object.keys(SORTS) as SortKey[]).map((key) => (
              <Link
                key={key}
                href={`/collection?sort=${key}`}
                aria-current={sort === key ? "true" : undefined}
                className={`rounded-full border px-3.5 py-1 text-xs ${
                  sort === key
                    ? "border-gold text-gold"
                    : "border-line bg-surface text-fg-sub"
                }`}
              >
                {SORTS[key].label}
              </Link>
            ))}
          </div>

          {/* ポスターグリッド: 375pxで3列 → 640pxで4列 → 1024pxで6列（DESIGN.md §4） */}
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {records.map((r, i) => (
              <li key={r.id} className="relative">
                <Link
                  href={`/record/${r.id}`}
                  className="block rounded-lg"
                  aria-label={r.movies.title}
                >
                  <Poster
                    path={r.movies.poster_path}
                    title={r.movies.title}
                    priority={i < 6}
                  />
                  {r.rating !== null && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-md bg-base/80 px-1.5 py-px text-[10.5px] font-semibold text-gold tabular-nums">
                      ★ {r.rating}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {lastPage > 1 && (
            <nav
              aria-label="ページャ"
              className="mt-6 flex items-center justify-center gap-4 text-sm"
            >
              {page > 1 ? (
                <Link
                  href={`/collection?sort=${sort}&page=${page - 1}`}
                  className="rounded-[10px] border border-line px-4 py-2"
                >
                  前へ
                </Link>
              ) : (
                <span className="px-4 py-2 text-fg-mute">前へ</span>
              )}
              <span className="text-fg-sub tabular-nums">
                {page} / {lastPage}
              </span>
              {page < lastPage ? (
                <Link
                  href={`/collection?sort=${sort}&page=${page + 1}`}
                  className="rounded-[10px] border border-line px-4 py-2"
                >
                  次へ
                </Link>
              ) : (
                <span className="px-4 py-2 text-fg-mute">次へ</span>
              )}
            </nav>
          )}
        </>
      )}

      {/* おすすめ（F-11）: 一覧本体の表示を遅延させないようストリーミングで差し込む */}
      <Suspense fallback={<DiscoverSectionSkeleton />}>
        <DiscoverSection userId={user.id} />
      </Suspense>
    </>
  );
}
