import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AchievementDef,
  UnlockedInfo,
  ViewingMethod,
} from "@/lib/types";

/** 判定に使う集計値。record 群から1パスで計算する */
export type AchievementStats = {
  total: number;
  genreCounts: Map<string, number>;
  methodCounts: Map<ViewingMethod, number>;
  monthMax: number;
  releaseSpan: number;
};

type StatRecord = {
  watched_on: string;
  method: ViewingMethod;
  movies: { genres: string[]; release_date: string | null } | null;
};

export function computeStats(records: StatRecord[]): AchievementStats {
  const genreCounts = new Map<string, number>();
  const methodCounts = new Map<ViewingMethod, number>();
  const monthCounts = new Map<string, number>();
  let minYear = Infinity;
  let maxYear = -Infinity;

  for (const r of records) {
    methodCounts.set(r.method, (methodCounts.get(r.method) ?? 0) + 1);

    const month = r.watched_on.slice(0, 7);
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);

    for (const g of r.movies?.genres ?? []) {
      genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    }

    const release = r.movies?.release_date;
    if (release) {
      const year = Number(release.slice(0, 4));
      minYear = Math.min(minYear, year);
      maxYear = Math.max(maxYear, year);
    }
  }

  return {
    total: records.length,
    genreCounts,
    methodCounts,
    monthMax: Math.max(0, ...monthCounts.values()),
    releaseSpan: maxYear > minYear ? maxYear - minYear : 0,
  };
}

/** 定義に対する現在値（進捗表示にも使う） */
export function currentValue(
  def: AchievementDef,
  stats: AchievementStats,
): number {
  switch (def.kind) {
    case "total_count":
      return stats.total;
    case "genre_single_count":
      return Math.max(0, ...stats.genreCounts.values());
    case "genre_variety":
      return stats.genreCounts.size;
    case "method_count":
      return def.param?.method
        ? (stats.methodCounts.get(def.param.method) ?? 0)
        : 0;
    case "month_count":
      return stats.monthMax;
    case "release_span":
      return stats.releaseSpan;
  }
}

export function isSatisfied(
  def: AchievementDef,
  stats: AchievementStats,
): boolean {
  return currentValue(def, stats) >= def.threshold;
}

/**
 * 未解錠アチーブメント全件を判定し、条件を満たしたものを解錠して返す（SPEC.md F-07）。
 * - 一度解錠したものは剥奪しない（解錠の追加のみ行う）
 * - 二重解錠はユニーク制約 + ignoreDuplicates で防ぐ
 * - 呼び出し元は失敗しても記録保存を失敗させないこと（try/catch で包む）
 */
export async function evaluateAchievements(
  supabase: SupabaseClient,
  userId: string,
): Promise<UnlockedInfo[]> {
  const [{ data: records }, { data: defs }, { data: unlockedRows }] =
    await Promise.all([
      supabase
        .from("viewing_records")
        .select("watched_on, method, movies(genres, release_date)")
        .eq("user_id", userId),
      supabase.from("achievements").select("*"),
      supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", userId),
    ]);

  if (!records || !defs) return [];

  const stats = computeStats(records as unknown as StatRecord[]);
  const unlocked = new Set(
    (unlockedRows ?? []).map((r) => r.achievement_id as string),
  );

  const newly = (defs as AchievementDef[])
    .filter((d) => !unlocked.has(d.id) && isSatisfied(d, stats))
    .sort((a, b) => a.sort - b.sort);

  if (newly.length === 0) return [];

  const { error } = await supabase.from("user_achievements").upsert(
    newly.map((d) => ({ user_id: userId, achievement_id: d.id })),
    { onConflict: "user_id,achievement_id", ignoreDuplicates: true },
  );
  if (error) return [];

  return newly.map(({ id, name, description }) => ({ id, name, description }));
}
