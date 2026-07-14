// 性能測定用シード: perf ユーザー + 記録120件（実行: node --env-file=.env.local seed-perf.mjs）
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const email = "perf@example.com";
const password = "password1234";
const GENRES = [["ドラマ"], ["アクション", "SF"], ["コメディ"], ["ホラー", "スリラー"], ["アニメーション"]];
const METHODS = ["theater", "streaming", "disc", "tv", "other"];

// 既存の perf ユーザーがいれば削除して作り直す（再実行可能に）
const { data: users } = await admin.auth.admin.listUsers({ perPage: 200 });
const existing = users.users.find((u) => u.email === email);
if (existing) await admin.auth.admin.deleteUser(existing.id);

const { data: created, error } = await admin.auth.admin.createUser({
  email, password, email_confirm: true,
});
if (error) throw error;
const userId = created.user.id;

const movies = Array.from({ length: 120 }, (_, i) => ({
  tmdb_id: 800000 + i,
  title: `性能測定用作品 ${String(i + 1).padStart(3, "0")}`,
  poster_path: null,
  genres: GENRES[i % GENRES.length],
  release_date: `${1960 + (i % 60)}-01-01`,
}));
{
  const { error: e } = await admin.from("movies").upsert(movies, { onConflict: "tmdb_id", ignoreDuplicates: true });
  if (e) throw e;
}
const { data: movieRows } = await admin.from("movies").select("id, tmdb_id").gte("tmdb_id", 800000).lte("tmdb_id", 800119);

const records = movieRows.map((m, i) => ({
  user_id: userId,
  movie_id: m.id,
  watched_on: `202${5 + (i % 2)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
  rating: (i % 5) + 1,
  comment: i % 3 === 0 ? "テスト感想。".repeat(20) : "",
  method: METHODS[i % METHODS.length],
}));
{
  const { error: e } = await admin.from("viewing_records").insert(records);
  if (e) throw e;
}
console.log(`seeded: user=${email} records=${records.length}`);
