import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  computeStats,
  currentValue,
  evaluateAchievements,
  isSatisfied,
} from "@/lib/achievements";
import type { AchievementDef, ViewingMethod } from "@/lib/types";

type Rec = {
  watched_on: string;
  method: ViewingMethod;
  movies: { genres: string[]; release_date: string | null } | null;
};

function rec(
  watchedOn: string,
  method: ViewingMethod = "streaming",
  genres: string[] = ["ドラマ"],
  releaseDate: string | null = "2000-01-01",
): Rec {
  return {
    watched_on: watchedOn,
    method,
    movies: { genres, release_date: releaseDate },
  };
}

function def(partial: Partial<AchievementDef> & { id: string }): AchievementDef {
  return {
    name: partial.id,
    description: "",
    category: "count",
    kind: "total_count",
    threshold: 1,
    param: null,
    sort: 0,
    ...partial,
  };
}

/**
 * evaluateAchievements 用の Supabase フェイク。
 * select は固定データを返し、upsert / 呼ばれたテーブルを記録する。
 * delete は実装しない = エンジンが削除（剥奪）を行わないことの構造的保証。
 */
function fakeSupabase({
  records = [],
  defs = [],
  unlockedIds = [],
  failDefs = false,
  failUpsert = false,
}: {
  records?: Rec[];
  defs?: AchievementDef[];
  unlockedIds?: string[];
  failDefs?: boolean;
  failUpsert?: boolean;
}) {
  const upserts: { rows: unknown[]; options: unknown }[] = [];

  function selectResult(table: string) {
    const data =
      table === "viewing_records"
        ? records
        : table === "achievements"
          ? failDefs
            ? null
            : defs
          : unlockedIds.map((id) => ({ achievement_id: id }));
    const promise = Promise.resolve({ data, error: null });
    return Object.assign(promise, {
      eq: () => Promise.resolve({ data, error: null }),
    });
  }

  const client = {
    from(table: string) {
      return {
        select: () => selectResult(table),
        upsert: (rows: unknown[], options: unknown) => {
          upserts.push({ rows, options });
          return Promise.resolve({
            error: failUpsert ? { message: "boom" } : null,
          });
        },
      };
    },
  } as unknown as SupabaseClient;

  return { client, upserts };
}

describe("computeStats", () => {
  it("記録0件では全統計が0", () => {
    const s = computeStats([]);
    expect(s.total).toBe(0);
    expect(s.genreCounts.size).toBe(0);
    expect(s.monthMax).toBe(0);
    expect(s.releaseSpan).toBe(0);
  });

  it("ジャンル・鑑賞方法・同一月・公開年差を集計する", () => {
    const s = computeStats([
      rec("2026-07-01", "theater", ["SF", "アクション"], "1970-01-01"),
      rec("2026-07-02", "theater", ["SF"], "2020-06-01"),
      rec("2026-06-30", "streaming", ["ドラマ"], null),
    ]);
    expect(s.total).toBe(3);
    expect(s.genreCounts.get("SF")).toBe(2);
    expect(s.genreCounts.size).toBe(3);
    expect(s.methodCounts.get("theater")).toBe(2);
    expect(s.monthMax).toBe(2); // 2026-07 に2本
    expect(s.releaseSpan).toBe(50); // 1970 → 2020
  });
});

describe("判定種別（SPEC.md F-07）", () => {
  const stats = computeStats([
    rec("2026-07-01", "theater", ["SF"], "1970-01-01"),
    rec("2026-07-02", "theater", ["SF"], "2020-01-01"),
    rec("2026-07-03", "streaming", ["ドラマ"], "2021-01-01"),
  ]);

  it.each([
    ["total_count", 3, true],
    ["total_count", 4, false],
    ["genre_single_count", 2, true],
    ["genre_single_count", 3, false],
    ["genre_variety", 2, true],
    ["genre_variety", 3, false],
    ["month_count", 3, true],
    ["month_count", 4, false],
    // 公開年は 1970 / 2020 / 2021 → 最大差 51
    ["release_span", 51, true],
    ["release_span", 52, false],
  ] as const)("%s（閾値%d）→ %s", (kind, threshold, expected) => {
    expect(isSatisfied(def({ id: "t", kind, threshold }), stats)).toBe(
      expected,
    );
  });

  it("method_count は param の鑑賞方法で数える", () => {
    const theater2 = def({
      id: "t",
      kind: "method_count",
      threshold: 2,
      param: { method: "theater" },
    });
    const disc1 = def({
      id: "d",
      kind: "method_count",
      threshold: 1,
      param: { method: "disc" },
    });
    expect(isSatisfied(theater2, stats)).toBe(true);
    expect(isSatisfied(disc1, stats)).toBe(false);
    // param 欠落は常に未達成（不正データで解錠しない）
    expect(
      isSatisfied(def({ id: "x", kind: "method_count", threshold: 1 }), stats),
    ).toBe(false);
  });

  it("currentValue は進捗表示に使える現在値を返す", () => {
    expect(
      currentValue(def({ id: "c", kind: "total_count", threshold: 10 }), stats),
    ).toBe(3);
  });
});

describe("evaluateAchievements（SPEC.md F-07 受け入れ基準・例外系）", () => {
  const tenMovies = Array.from({ length: 10 }, (_, i) =>
    rec(`2026-0${(i % 6) + 1}-15`),
  );
  const defs = [
    def({ id: "count-1", threshold: 1, sort: 10 }),
    def({ id: "count-10", threshold: 10, sort: 20 }),
    def({ id: "count-50", threshold: 50, sort: 30 }),
  ];

  it("受け入れ基準: 10本目の保存で『10本』が解錠される", async () => {
    const { client, upserts } = fakeSupabase({
      records: tenMovies,
      defs,
      unlockedIds: ["count-1"],
    });
    const newly = await evaluateAchievements(client, "user-1");

    expect(newly.map((n) => n.id)).toEqual(["count-10"]);
    expect(upserts).toHaveLength(1);
    expect(upserts[0].options).toMatchObject({
      onConflict: "user_id,achievement_id",
      ignoreDuplicates: true, // 二重解錠の防止
    });
  });

  it("受け入れ基準: 条件を下回っても解錠済みは剥奪しない（削除系の呼び出しが存在しない）", async () => {
    // 記録9本 + count-10 解錠済み（10本目を削除した後の状態）
    const { client, upserts } = fakeSupabase({
      records: tenMovies.slice(0, 9),
      defs,
      unlockedIds: ["count-1", "count-10"],
    });
    const newly = await evaluateAchievements(client, "user-1");

    // 何も追加されず（= upsert すら呼ばれず）、剥奪も起きない
    // （フェイクは delete 未実装のため、エンジンが delete を呼べば例外で落ちる）
    expect(newly).toEqual([]);
    expect(upserts).toHaveLength(0);
  });

  it("複数同時解錠は sort 順で返す（演出の順次表示に使う）", async () => {
    const { client } = fakeSupabase({
      records: tenMovies,
      defs: [...defs].reverse(),
      unlockedIds: [],
    });
    const newly = await evaluateAchievements(client, "user-1");
    expect(newly.map((n) => n.id)).toEqual(["count-1", "count-10"]);
  });

  it("例外系: 定義の取得に失敗しても例外を投げず空配列を返す（記録保存を失敗させない）", async () => {
    const { client } = fakeSupabase({
      records: tenMovies,
      defs,
      failDefs: true,
    });
    await expect(evaluateAchievements(client, "user-1")).resolves.toEqual([]);
  });

  it("例外系: 解錠の書き込みに失敗したら解錠を報告しない（次回判定で自己修復）", async () => {
    const { client } = fakeSupabase({
      records: tenMovies,
      defs,
      failUpsert: true,
    });
    await expect(evaluateAchievements(client, "user-1")).resolves.toEqual([]);
  });
});
