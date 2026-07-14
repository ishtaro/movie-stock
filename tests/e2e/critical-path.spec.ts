import { expect, test } from "@playwright/test";

/**
 * クリティカルパス E2E（SKILL.md §5: 事業が止まるフローのみに絞る）:
 *   新規登録 → メール確認 → ログイン → 検索 → 記録 → 解錠演出 →
 *   コレクション反映 → アチーブメント一覧
 * メール確認はローカルスタックのメールキャッチャー（Mailpit）から実リンクを取得する。
 */

const MAILPIT = "http://127.0.0.1:54324";
const email = `e2e-${Date.now()}@example.com`;
const password = "password1234";

/** Mailpit から最新の確認メールの検証リンクを取り出す */
async function fetchConfirmLink(to: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await fetch(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`,
    );
    const data = (await res.json()) as { messages?: { ID: string }[] };
    const id = data.messages?.[0]?.ID;
    if (id) {
      const msg = await fetch(`${MAILPIT}/api/v1/message/${id}`);
      const body = (await msg.json()) as { Text?: string; HTML?: string };
      const text = `${body.Text ?? ""}\n${body.HTML ?? ""}`;
      const match = text.match(/https?:\/\/[^\s"<)\]]+verify[^\s"<)\]]*/);
      if (match) return match[0].replace(/&amp;/g, "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`確認メールが届かない: ${to}`);
}

test("登録→確認→ログイン→記録→解錠→コレクション反映（F-01/F-03/F-04/F-05/F-07）", async ({
  page,
}) => {
  // --- 新規登録（S-2） ---
  await page.goto("/signup");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード（8文字以上）").fill(password);
  await page.getByRole("button", { name: "無料ではじめる" }).click();
  await expect(page.getByText("確認メールを送信しました")).toBeVisible();

  // --- メール確認（実メールのリンクを踏む） ---
  const confirmLink = await fetchConfirmLink(email);
  await page.goto(confirmLink);
  // 確認完了後は /collection に着地する（F-01 受け入れ基準1）
  await expect(page).toHaveURL(/\/collection/);
  await expect(
    page.getByRole("heading", { name: "コレクション" }),
  ).toBeVisible();
  await expect(page.getByText("最初の1本を記録しよう")).toBeVisible();

  // --- 検索（S-4・実 TMDb） ---
  await page.getByRole("link", { name: "映画をさがす" }).click();
  await page.getByRole("searchbox").fill("君の名は。");
  await page.getByRole("link", { name: /君の名は。/ }).first().click();

  // --- 記録作成（S-5）: 鑑賞方法を選び、星4を付けて保存 ---
  await expect(
    page.getByRole("heading", { name: "記録する" }),
  ).toBeVisible();
  await page.getByText("映画館", { exact: true }).click();
  await page.getByRole("button", { name: "星4" }).click();
  await page
    .getByLabel("感想")
    .fill("E2E テストからの記録。彗星がきれいだった。");
  await page.getByRole("button", { name: "保存する" }).click();

  // 保存後は成功演出を経て /collection へ、または（保存済みの再訪扱いで）
  // 既存記録ページへ到達する。どちらでも「保存された」ことが前提になる
  await page.waitForURL(
    (url) =>
      url.pathname === "/collection" ||
      /^\/record\/(?!new$)[^/]+$/.test(url.pathname),
    { timeout: 20_000 },
  );

  // --- コレクション反映（F-05） ---
  await page.goto("/collection");
  await expect(page.getByText(/1\s*本/)).toBeVisible();
  await expect(page.getByRole("link", { name: "君の名は。" })).toBeVisible();
  await expect(page.getByText("★ 4")).toBeVisible();

  // --- アチーブメント一覧（F-07/F-08: 1本目で2件解錠が永続化されている） ---
  await page.goto("/achievements");
  await expect(page.getByText(/2\s*\/\s*13\s*解錠/)).toBeVisible();
  await expect(page.getByText("はじめの一歩")).toBeVisible();
  await expect(page.getByText("スクリーンデビュー")).toBeVisible();
});

test("未ログインでは保護画面に入れない（F-01）", async ({ page }) => {
  await page.goto("/collection");
  await expect(page).toHaveURL(/\/login/);
});
