import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { evaluateAchievements } from "@/lib/achievements";

/**
 * ローカル Supabase スタックに対する統合テスト。
 * 検証対象:
 *  - F-01 受け入れ基準2: RLS による他ユーザーデータの遮断（API 直叩き含む）
 *  - F-04: 1ユーザー1作品1記録のユニーク制約
 *  - F-07: 実 DB でのアチーブメント解錠・再解錠なし・剥奪なし
 *  - F-02: 退会（ユーザー削除）による全データのカスケード削除
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function anonClient(): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function createUser(email: string): Promise<User> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: "password1234",
    email_confirm: true,
  });
  if (error) throw error;
  return data.user;
}

async function signIn(email: string): Promise<SupabaseClient> {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({
    email,
    password: "password1234",
  });
  if (error) throw error;
  return client;
}

/** テスト用の作品を投入し movies.id を返す */
async function insertMovie(
  client: SupabaseClient,
  tmdbId: number,
  genres: string[] = ["ドラマ"],
  releaseDate = "2000-01-01",
): Promise<number> {
  await client.from("movies").upsert(
    {
      tmdb_id: tmdbId,
      title: `テスト作品${tmdbId}`,
      poster_path: null,
      genres,
      release_date: releaseDate,
    },
    { onConflict: "tmdb_id", ignoreDuplicates: true },
  );
  const { data, error } = await client
    .from("movies")
    .select("id")
    .eq("tmdb_id", tmdbId)
    .single();
  if (error) throw error;
  return data.id;
}

const run = Date.now(); // 再実行に耐えるユニークなメール
let userA: User;
let userB: User;
let clientA: SupabaseClient;
let clientB: SupabaseClient;

beforeAll(async () => {
  userA = await createUser(`user-a-${run}@example.com`);
  userB = await createUser(`user-b-${run}@example.com`);
  clientA = await signIn(`user-a-${run}@example.com`);
  clientB = await signIn(`user-b-${run}@example.com`);
});

afterAll(async () => {
  // userA はテスト内で削除済みの場合がある
  await admin.auth.admin.deleteUser(userA.id).catch(() => {});
  await admin.auth.admin.deleteUser(userB.id);
});

describe("RLS: 他ユーザーのデータ遮断（F-01 受け入れ基準2）", () => {
  let recordId: string;

  it("本人は記録を作成・取得できる", async () => {
    const movieId = await insertMovie(clientA, 900001);
    const { data, error } = await clientA
      .from("viewing_records")
      .insert({
        user_id: userA.id,
        movie_id: movieId,
        watched_on: "2026-07-01",
        rating: 4,
        comment: "テスト",
        method: "theater",
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    recordId = data!.id;
  });

  it("他人の記録は select できない（一覧にも ID 直指定でも出ない）", async () => {
    const { data: list } = await clientB.from("viewing_records").select("id");
    expect(list).toEqual([]);
    const { data: direct } = await clientB
      .from("viewing_records")
      .select("*")
      .eq("id", recordId)
      .maybeSingle();
    expect(direct).toBeNull();
  });

  it("他人の記録は update / delete できない（0行更新で拒否）", async () => {
    const { data: updated } = await clientB
      .from("viewing_records")
      .update({ comment: "改ざん" })
      .eq("id", recordId)
      .select("id");
    expect(updated).toEqual([]);

    await clientB.from("viewing_records").delete().eq("id", recordId);
    const { data: still } = await clientA
      .from("viewing_records")
      .select("id, comment")
      .eq("id", recordId)
      .single();
    expect(still!.id).toBe(recordId);
    expect(still!.comment).toBe("テスト");
  });

  it("なりすまし insert（他人の user_id を指定）は拒否される", async () => {
    const movieId = await insertMovie(clientB, 900002);
    const { error } = await clientB.from("viewing_records").insert({
      user_id: userA.id, // userB が userA の記録を作ろうとする
      movie_id: movieId,
      watched_on: "2026-07-01",
      method: "streaming",
    });
    expect(error).not.toBeNull();
  });

  it("他人の解錠履歴は見えない", async () => {
    const { data } = await clientB
      .from("user_achievements")
      .select("*")
      .eq("user_id", userA.id);
    expect(data).toEqual([]);
  });

  it("共有の作品キャッシュは insert のみ可・update は拒否される", async () => {
    // GRANT なし（42501 エラー）または RLS による 0 行更新のどちらでも「拒否」
    const { data: updated, error } = await clientB
      .from("movies")
      .update({ title: "改ざんタイトル" })
      .eq("tmdb_id", 900001)
      .select("id");
    expect(error !== null || updated?.length === 0).toBe(true);

    const { data: movie } = await clientB
      .from("movies")
      .select("title")
      .eq("tmdb_id", 900001)
      .single();
    expect(movie!.title).toBe("テスト作品900001");
  });
});

describe("ユニーク制約: 1ユーザー1作品1記録（F-04 例外系）", () => {
  it("同じ作品の2件目の記録は 23505 で拒否される", async () => {
    const movieId = await insertMovie(clientA, 900001);
    const { error } = await clientA.from("viewing_records").insert({
      user_id: userA.id,
      movie_id: movieId,
      watched_on: "2026-07-02",
      method: "streaming",
    });
    expect(error?.code).toBe("23505");
  });
});

describe("アチーブメント: 実 DB での解錠（F-07）", () => {
  it("10本目の記録で count-1 / count-10 等が解錠される", async () => {
    // 既に1本あるので9本追加（計10本。ジャンル・方法・公開年をばらす）
    for (let i = 0; i < 9; i += 1) {
      const movieId = await insertMovie(
        clientA,
        910000 + i,
        i % 2 === 0 ? ["SF"] : ["アクション"],
        i === 0 ? "1960-01-01" : "2020-01-01",
      );
      await clientA.from("viewing_records").insert({
        user_id: userA.id,
        movie_id: movieId,
        watched_on: `2026-06-${String(i + 1).padStart(2, "0")}`,
        method: i < 5 ? "theater" : "streaming",
      });
    }

    const newly = await evaluateAchievements(clientA, userA.id);
    const ids = newly.map((n) => n.id);
    expect(ids).toContain("count-1");
    expect(ids).toContain("count-10");
    expect(ids).toContain("theater-1"); // 映画館1本以上
    expect(ids).toContain("span-50"); // 1960 vs 2020 = 60年差

    const { data: rows } = await clientA
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userA.id);
    expect(rows!.map((r) => r.achievement_id)).toEqual(
      expect.arrayContaining(ids),
    );
  });

  it("再判定しても再解錠されない（冪等）", async () => {
    const newly = await evaluateAchievements(clientA, userA.id);
    expect(newly).toEqual([]);
  });

  it("記録を削除して条件を下回っても解錠は剥奪されない", async () => {
    const { data: one } = await clientA
      .from("viewing_records")
      .select("id")
      .limit(1)
      .single();
    await clientA.from("viewing_records").delete().eq("id", one!.id);

    await evaluateAchievements(clientA, userA.id); // 9本で再判定
    const { data: rows } = await clientA
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userA.id);
    expect(rows!.map((r) => r.achievement_id)).toContain("count-10");
  });
});

describe("退会: カスケード削除（F-02）", () => {
  it("ユーザー削除で記録・解錠履歴・プロフィールが全て消える", async () => {
    const { error } = await admin.auth.admin.deleteUser(userA.id);
    expect(error).toBeNull();

    const [records, unlocks, profiles] = await Promise.all([
      admin.from("viewing_records").select("id").eq("user_id", userA.id),
      admin.from("user_achievements").select("*").eq("user_id", userA.id),
      admin.from("profiles").select("*").eq("id", userA.id),
    ]);
    expect(records.data).toEqual([]);
    expect(unlocks.data).toEqual([]);
    expect(profiles.data).toEqual([]);

    // 共有の作品キャッシュは残る（ユーザーデータではない）
    const { data: movies } = await admin
      .from("movies")
      .select("id")
      .eq("tmdb_id", 900001);
    expect(movies!.length).toBe(1);
  });
});
