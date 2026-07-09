import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { RecordForm } from "@/components/record-form";
import { todayJst, releaseYear } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { RecordWithMovie } from "@/lib/types";

export const metadata: Metadata = { title: "記録を編集" };

/** 記録編集（SPEC.md F-06 / DESIGN.md S-5） */
export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("viewing_records")
    .select("*, movies(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const record = data as unknown as RecordWithMovie;

  return (
    <>
      <h1 className="mb-4 text-xl font-bold">記録を編集</h1>
      <RecordForm
        mode="edit"
        recordId={record.id}
        movie={{
          tmdbId: record.movies.tmdb_id,
          title: record.movies.title,
          posterPath: record.movies.poster_path,
          releaseYear: releaseYear(record.movies.release_date),
        }}
        defaults={{
          watchedOn: record.watched_on,
          method: record.method,
          rating: record.rating,
          comment: record.comment,
        }}
        today={todayJst()}
      />
    </>
  );
}
