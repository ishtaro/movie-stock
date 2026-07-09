import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteRecordButton } from "@/components/delete-record-button";
import { Poster } from "@/components/poster";
import { Stars } from "@/components/stars";
import { formatDate, releaseYear } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { METHOD_LABELS, type RecordWithMovie } from "@/lib/types";

export const metadata: Metadata = { title: "記録の詳細" };

/** 記録詳細（SPEC.md F-05/F-06 / DESIGN.md S-6） */
export default async function RecordDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS により他ユーザーの記録は取得できず 404 になる（SPEC.md F-06 例外系）
  const { data } = await supabase
    .from("viewing_records")
    .select("*, movies(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const record = data as unknown as RecordWithMovie;

  return (
    <div className="mx-auto w-full max-w-md">
      {from === "duplicate" && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-surface px-4 py-3 text-sm text-fg-sub"
        >
          この作品は記録済みです。再鑑賞はこの記録を編集してください。
        </p>
      )}

      <div className="flex gap-4">
        <div className="w-[40%] shrink-0">
          <Poster
            path={record.movies.poster_path}
            title={record.movies.title}
            sizes="40vw"
            priority
          />
        </div>
        <div className="min-w-0 py-1">
          <h1 className="text-[17px] leading-snug font-bold">
            {record.movies.title}
          </h1>
          <p className="mt-1 text-sm text-fg-sub">
            {releaseYear(record.movies.release_date)}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-elevated px-2.5 py-0.5 text-xs text-fg-sub">
              {METHOD_LABELS[record.method]}
            </span>
            {record.movies.genres.map((g) => (
              <span
                key={g}
                className="rounded-full bg-elevated px-2.5 py-0.5 text-xs text-fg-sub"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      <dl className="mt-6 flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <dt className="text-sm text-fg-sub">鑑賞日</dt>
          <dd className="text-sm tabular-nums">
            {formatDate(record.watched_on)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-sm text-fg-sub">評価</dt>
          <dd>
            <Stars rating={record.rating} />
          </dd>
        </div>
        <div>
          <dt className="mb-1.5 text-sm text-fg-sub">感想</dt>
          <dd className="text-[15px] leading-[1.8] whitespace-pre-wrap">
            {record.comment || (
              <span className="text-fg-mute">（感想は未記入）</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex items-center justify-between">
        <Link
          href={`/record/${record.id}/edit`}
          className="flex h-11 items-center rounded-[10px] border border-line px-8 text-sm"
        >
          編集
        </Link>
        <DeleteRecordButton recordId={record.id} title={record.movies.title} />
      </div>
    </div>
  );
}
