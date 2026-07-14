import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * 表示確認（TASKS.md フェーズ4 / DESIGN.md §4）:
 * 375px〜1920px のどの幅でも横スクロールが発生しないこと。
 * 長いタイトル・長文の感想を持つ実データで検証する。
 */

function loadEnvLocal(): Record<string, string> {
  const file = path.join(__dirname, "../../.env.local");
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split("\n")
      .filter((line) => line.includes("="))
      .map((line) => [
        line.slice(0, line.indexOf("=")),
        line.slice(line.indexOf("=") + 1).trim(),
      ]),
  );
}

const env = loadEnvLocal();
const email = `resp-${Date.now()}@example.com`;
const password = "password1234";
let recordId = "";

test.beforeAll(async () => {
  const admin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data: userData, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;

  // レイアウトを崩しやすいデータ: 長いタイトル・ジャンル多数・長文感想・ポスターなし
  await admin.from("movies").upsert(
    {
      tmdb_id: 987654,
      title:
        "レスポンシブ検証用のとても長いタイトルの映画・完全新装版ディレクターズカット",
      genres: ["ドラマ", "アクション", "サイエンスフィクション", "アドベンチャー"],
      release_date: "1999-09-09",
      poster_path: null,
    },
    { onConflict: "tmdb_id", ignoreDuplicates: true },
  );
  const { data: movie } = await admin
    .from("movies")
    .select("id")
    .eq("tmdb_id", 987654)
    .single();
  const { data: rec } = await admin
    .from("viewing_records")
    .insert({
      user_id: userData.user.id,
      movie_id: movie!.id,
      watched_on: "2026-07-01",
      rating: 3,
      comment: "長文の感想でレイアウトを検証する。".repeat(30),
      method: "streaming",
    })
    .select("id")
    .single();
  recordId = rec!.id;
});

const VIEWPORTS = [
  { width: 375, height: 667 },
  { width: 768, height: 1024 },
  { width: 1920, height: 1080 },
] as const;

async function assertNoHorizontalScroll(
  page: import("@playwright/test").Page,
  url: string,
  width: number,
) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow, `${url} @ ${width}px で横スクロールが発生`).toBeLessThanOrEqual(1);
}

test("375〜1920px の全画面で横スクロールが発生しない", async ({ page }) => {
  const publicPages = ["/", "/login", "/signup", "/terms", "/privacy"];
  const appPages = () => [
    "/collection",
    "/search",
    "/achievements",
    "/settings",
    `/record/${recordId}`,
    `/record/${recordId}/edit`,
  ];

  // 公開ページ（未ログイン）
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const url of publicPages) {
      await assertNoHorizontalScroll(page, url, vp.width);
    }
  }

  // ログイン
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "ログイン" }).click();
  await page.waitForURL(/\/collection/);

  // 認証済みページ
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const url of appPages()) {
      await assertNoHorizontalScroll(page, url, vp.width);
    }
  }
});
