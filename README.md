# MOVIE STOCK

観た映画をコレクションに記録し、アチーブメントを解錠していく映画鑑賞ログ。
仕様は [SPEC.md](SPEC.md)、デザインは [DESIGN.md](DESIGN.md)、開発計画は [TASKS.md](TASKS.md) を参照。

## 技術スタック

- Next.js 16（App Router / Turbopack）+ React 19 + TypeScript（strict）
- Tailwind CSS v4（デザイントークンは `src/app/globals.css` の `@theme`）
- Supabase（Auth + PostgreSQL + RLS）
- TMDb API（作品情報。キーはサーバー側のみで保持）

## セットアップ

### 1. 依存関係

```bash
npm install
```

### 2. Supabase プロジェクト

1. [Supabase](https://supabase.com/) でプロジェクトを作成する
2. SQL Editor で `supabase/migrations/` 内の SQL を番号順に実行する
   （または `npx supabase link` 後に `npx supabase db push`）
3. Authentication > Sign In / Up で Email を有効にし、**Confirm email を ON** にする
4. Authentication > URL Configuration の Site URL に開発時は
   `http://localhost:3000` を設定する

### 3. TMDb API

[TMDb の API 設定](https://www.themoviedb.org/settings/api) で
API Read Access Token を取得する（無料）。

### 4. 環境変数

```bash
cp .env.example .env.local
```

`.env.local` に Supabase の URL / anon key / service_role key と
TMDb のトークンを設定する。

### 5. 起動

```bash
npm run dev
```

## スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript 型チェック |
| `npm run format` | Prettier で整形 |
| `npm run test` | ユニット/コンポーネントテスト（Vitest） |
| `npm run test:integration` | 実 DB 統合テスト（RLS・解錠・カスケード削除。要 `npx supabase start`） |
| `npm run test:e2e` | E2E クリティカルパス（Playwright。要ローカルスタック） |

## ローカル開発（Supabase ローカルスタック）

Docker が使える環境ではクラウドプロジェクトなしで開発できる。

```bash
npx supabase start   # 初回はイメージ取得で数分かかる
npx supabase status  # API URL / anon key / service_role key を確認 → .env.local へ
npm run dev
```

- 確認メールはメールキャッチャー http://127.0.0.1:54324 （Mailpit）に届く
- DB 管理は Supabase Studio http://127.0.0.1:54323
- スキーマを作り直す場合は `npx supabase db reset`（migrations を再適用）

## 実装メモ

- ユーザーデータのテーブルはすべて RLS（Row Level Security）で本人以外の
  アクセスを遮断している。マイグレーション参照。
- アチーブメントの定義は `achievements` テーブルのデータとして持つ。
  追加は行の insert のみで、コード変更は不要（判定種別は
  `src/lib/achievements.ts` の6種類）。
- 1ユーザー1作品1記録（DB のユニーク制約）。再鑑賞は既存記録の編集で扱う。
- 未実装（TASKS.md 参照）: ログイン試行制限（5回/10分ロック【仮】）、
  週次バックアップ、TMDb 公式ロゴの帰属表示、Sentry 導入。

## 本番デプロイ（フェーズ4）

1. **Supabase 本番プロジェクト作成**（supabase.com）
   - `npx supabase link --project-ref <ref>` → `npx supabase db push` でマイグレーション適用
     （GRANT を含む全マイグレーションが必須）
   - Authentication > Sign In / Up: Email 有効 + Confirm email ON
   - Authentication > URL Configuration: Site URL に本番 URL、
     Redirect URLs に `https://<本番ドメイン>/auth/confirm` を追加
2. **Vercel プロジェクト作成**（GitHub リポジトリを import）
   - 環境変数: `.env.example` の4変数 + `NEXT_PUBLIC_SITE_URL`（本番 URL）
3. **バックアップ用 Secret**: GitHub リポジトリの Settings > Secrets に
   `SUPABASE_DB_URL`（Direct connection の URI）を設定
   → 週次バックアップ（.github/workflows/backup.yml）が有効になる
4. デプロイ後の確認: 登録→メール確認→記録→解錠の一連フロー、
   性能（一覧2秒以内・保存1秒以内・検索3秒以内）の再測定

## This product uses the TMDB API

This product uses the TMDB API but is not endorsed or certified by TMDB.
