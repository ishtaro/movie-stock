"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { evaluateAchievements } from "@/lib/achievements";
import { createClient } from "@/lib/supabase/server";
import { getMovie } from "@/lib/tmdb";
import type { UnlockedInfo } from "@/lib/types";
import { firstIssue, recordInputSchema } from "@/lib/validation";

export type RecordActionState = {
  error?: string;
  /** 既に記録済みの場合の既存記録 ID（SPEC.md F-04 例外系） */
  duplicateId?: string;
  ok?: boolean;
  recordId?: string;
  unlocked?: UnlockedInfo[];
} | null;

function parseInput(formData: FormData) {
  return recordInputSchema.safeParse({
    watchedOn: String(formData.get("watchedOn") ?? ""),
    method: String(formData.get("method") ?? ""),
    rating: String(formData.get("rating") ?? ""),
    comment: String(formData.get("comment") ?? ""),
  });
}

export async function createRecord(
  _prev: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tmdbId = Number(formData.get("tmdbId"));
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return { error: "作品が指定されていません。検索からやり直してください" };
  }

  const parsed = parseInput(formData);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  // 作品情報はサーバー側で TMDb から取得する（クライアントの申告値を信用しない）
  let movie;
  try {
    movie = await getMovie(tmdbId);
  } catch {
    return {
      error: "作品情報の取得に失敗しました。時間をおいて再試行してください",
    };
  }

  // 共有キャッシュへ保存（既存行は更新しない: RLS は insert のみ許可）
  await supabase.from("movies").upsert(
    {
      tmdb_id: movie.tmdbId,
      title: movie.title,
      poster_path: movie.posterPath,
      genres: movie.genres,
      release_date: movie.releaseDate,
    },
    { onConflict: "tmdb_id", ignoreDuplicates: true },
  );
  const { data: movieRow } = await supabase
    .from("movies")
    .select("id")
    .eq("tmdb_id", tmdbId)
    .single();
  if (!movieRow) return { error: "作品情報の保存に失敗しました" };

  const { data: inserted, error } = await supabase
    .from("viewing_records")
    .insert({
      user_id: user.id,
      movie_id: movieRow.id,
      watched_on: parsed.data.watchedOn,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      method: parsed.data.method,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      // 1ユーザー1作品1記録。既存記録へ誘導する
      const { data: existing } = await supabase
        .from("viewing_records")
        .select("id")
        .eq("user_id", user.id)
        .eq("movie_id", movieRow.id)
        .single();
      if (existing) return { duplicateId: existing.id };
    }
    return { error: "保存に失敗しました。時間をおいて再試行してください" };
  }

  // 判定の失敗で記録保存を失敗させない（SPEC.md F-07 例外系）
  let unlocked: UnlockedInfo[] = [];
  try {
    unlocked = await evaluateAchievements(supabase, user.id);
  } catch {
    unlocked = [];
  }

  revalidatePath("/collection");
  revalidatePath("/achievements");
  return { ok: true, recordId: inserted.id, unlocked };
}

export async function updateRecord(
  recordId: string,
  _prev: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = parseInput(formData);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  // RLS により他ユーザー・削除済みの記録は 0 行更新になる
  const { data: updated, error } = await supabase
    .from("viewing_records")
    .update({
      watched_on: parsed.data.watchedOn,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      method: parsed.data.method,
    })
    .eq("id", recordId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "保存に失敗しました。時間をおいて再試行してください" };
  }
  if (!updated) {
    return { error: "記録が見つかりません。削除された可能性があります" };
  }

  let unlocked: UnlockedInfo[] = [];
  try {
    unlocked = await evaluateAchievements(supabase, user.id);
  } catch {
    unlocked = [];
  }

  revalidatePath("/collection");
  revalidatePath(`/record/${recordId}`);
  revalidatePath("/achievements");
  return { ok: true, recordId, unlocked };
}

export async function deleteRecord(recordId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 解錠済みアチーブメントは削除で条件を下回っても剥奪しない（SPEC.md F-07）
  await supabase.from("viewing_records").delete().eq("id", recordId);

  revalidatePath("/collection");
  redirect("/collection");
}
