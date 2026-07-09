import { Lock, Trophy } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  computeStats,
  currentValue,
  type AchievementStats,
} from "@/lib/achievements";
import { formatTimestamp } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import {
  CATEGORY_LABELS,
  type AchievementCategory,
  type AchievementDef,
  type UserAchievement,
  type ViewingMethod,
} from "@/lib/types";

export const metadata: Metadata = { title: "アチーブメント" };

const CATEGORY_ORDER: AchievementCategory[] = [
  "count",
  "genre",
  "method",
  "period",
];

function AchievementCard({
  def,
  unlock,
  stats,
}: {
  def: AchievementDef;
  unlock: UserAchievement | undefined;
  stats: AchievementStats;
}) {
  if (unlock) {
    return (
      <li className="rounded-xl border border-line bg-surface px-2 py-3 text-center">
        <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-radial-[at_32%_28%] from-gold/90 via-gold to-gold-deep shadow-[0_0_14px_rgba(227,179,65,0.35)]">
          <Trophy className="h-5 w-5 text-base" aria-hidden />
        </span>
        <p className="text-xs leading-snug font-semibold">{def.name}</p>
        <p className="mt-1 text-[10.5px] text-fg-mute tabular-nums">
          {formatTimestamp(unlock.unlocked_at)}
        </p>
      </li>
    );
  }

  // 未解錠: シルエット + 条件 + 進捗（DESIGN.md S-7。色だけでなく形状でも区別）
  const current = Math.min(currentValue(def, stats), def.threshold);
  const percent = Math.round((current / def.threshold) * 100);

  return (
    <li className="rounded-xl border border-line bg-surface px-2 py-3 text-center">
      <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-line bg-elevated">
        <Lock className="h-5 w-5 text-fg-mute" aria-hidden />
      </span>
      <p className="text-xs leading-snug font-semibold text-fg-sub">
        {def.name}
      </p>
      <p className="mt-1 text-[10.5px] leading-snug text-fg-mute">
        {def.description}
      </p>
      <p className="mt-1 text-[10.5px] text-fg-mute tabular-nums">
        {current} / {def.threshold}
      </p>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full bg-fg-mute"
          style={{ width: `${percent}%` }}
        />
      </div>
    </li>
  );
}

/** アチーブメント一覧（SPEC.md F-08 / DESIGN.md S-7） */
export default async function AchievementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: defsData }, { data: unlocksData }, { data: recordsData }] =
    await Promise.all([
      supabase.from("achievements").select("*").order("sort"),
      supabase.from("user_achievements").select("*").eq("user_id", user.id),
      supabase
        .from("viewing_records")
        .select("watched_on, method, movies(genres, release_date)")
        .eq("user_id", user.id),
    ]);

  const defs = (defsData ?? []) as AchievementDef[];
  const unlocks = new Map(
    ((unlocksData ?? []) as UserAchievement[]).map((u) => [
      u.achievement_id,
      u,
    ]),
  );
  const stats = computeStats(
    (recordsData ?? []) as unknown as {
      watched_on: string;
      method: ViewingMethod;
      movies: { genres: string[]; release_date: string | null } | null;
    }[],
  );

  // 一覧を開いたら未読ドットを消す（DESIGN.md §3）
  if ((unlocksData ?? []).some((u) => !u.seen)) {
    await supabase
      .from("user_achievements")
      .update({ seen: true })
      .eq("user_id", user.id)
      .eq("seen", false);
  }

  const unlockedCount = unlocks.size;
  const progressPercent =
    defs.length === 0 ? 0 : Math.round((unlockedCount / defs.length) * 100);

  return (
    <>
      <h1 className="mb-4 text-xl font-bold">アチーブメント</h1>

      <div className="mb-6 rounded-xl border border-line bg-surface p-4">
        <p className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gold tabular-nums">
            {unlockedCount}
          </span>
          <span className="text-sm text-fg-sub">/ {defs.length} 解錠</span>
        </p>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-linear-to-r from-gold-deep to-gold"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const group = defs.filter((d) => d.category === category);
        if (group.length === 0) return null;
        return (
          <section key={category} className="mb-6">
            <h2 className="mb-2.5 text-xs font-semibold tracking-[0.14em] text-fg-mute">
              {CATEGORY_LABELS[category]}
            </h2>
            <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
              {group.map((def) => (
                <AchievementCard
                  key={def.id}
                  def={def}
                  unlock={unlocks.get(def.id)}
                  stats={stats}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
