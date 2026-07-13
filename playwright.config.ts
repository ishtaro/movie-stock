import { defineConfig } from "@playwright/test";

/**
 * E2E テスト（クリティカルパスのみ）。
 * 前提: ローカル Supabase スタック（npx supabase start）+ .env.local。
 * 実行: npm run test:e2e
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    locale: "ja-JP",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
