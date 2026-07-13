import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

/**
 * 統合テスト用設定。ローカル Supabase スタック（npx supabase start）と
 * .env.local の設定が必要。実行: npm run test:integration
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "src/test/server-only-stub.ts"),
    },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    // .env.local（Supabase ローカルのキー・TMDb トークン）を読み込む
    env: loadEnv("", process.cwd(), ""),
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // DB 状態を共有するためファイル内は直列実行
    fileParallelism: false,
  },
});
