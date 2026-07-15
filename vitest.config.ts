import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // "server-only" は Next.js 外では読み込めないためテストではスタブに差し替える
      "server-only": path.resolve(__dirname, "src/test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "jsdom",
    // Testing Library の自動クリーンアップ（afterEach）に必要
    globals: true,
    // 統合テスト（要ローカル Supabase）と E2E（Playwright）は通常実行から除外
    exclude: ["**/node_modules/**", "tests/integration/**", "tests/e2e/**"],
  },
});
