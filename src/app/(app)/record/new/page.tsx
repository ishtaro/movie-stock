import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RecordForm } from "@/components/record-form";
import { todayJst, releaseYear } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { getMovie, type TmdbMovie } from "@/lib/tmdb";

export const metadata: Metadata = { title: "記録する" };

/** 記録作成（SPEC.md F-04 / DESIGN.md S-5） */
export default async function NewRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ tmdbId?: string }>;
}) {
  const { tmdbId: tmdbIdParam } = await searchParams;
  const tmdbId = Number(tmdbIdParam);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) redirect("/search");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 既に記録済みなら既存記録へ誘導（SPEC.md F-04 例外系）
  const { data: movieRow } = await supabase
    .from("movies")
    .select("id")
    .eq("tmdb_id", tmdbId)
    .maybeSingle();
  if (movieRow) {
    const { data: existing } = await supabase
      .from("viewing_records")
      .select("id")
      .eq("user_id", user.id)
      .eq("movie_id", movieRow.id)
      .maybeSingle();
    if (existing) redirect(`/record/${existing.id}?from=duplicate`);
  }

  let movie: TmdbMovie;
  try {
    movie = await getMovie(tmdbId);
  } catch {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <p className="text-center text-sm text-danger">
          作品情報の取得に失敗しました。
          <br />
          時間をおいて再試行してください。
        </p>
        <Link
          href="/search"
          className="h-11 rounded-[10px] border border-line px-6 text-sm leading-[44px]"
        >
          検索へ戻る
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-4 text-xl font-bold">記録する</h1>
      <RecordForm
        mode="create"
        movie={{
          tmdbId: movie.tmdbId,
          title: movie.title,
          posterPath: movie.posterPath,
          releaseYear: releaseYear(movie.releaseDate),
        }}
        today={todayJst()}
      />
    </>
  );
}
