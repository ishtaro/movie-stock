-- テーブル権限の明示付与（実環境検証で発見した欠落の修正）
-- Supabase はテーブルへの権限を自動付与しないため、RLS ポリシーとは別に
-- GRANT が必要。最小権限の原則に従い authenticated のみに付与する
-- （anon はアプリから DB を参照しないため付与しない。service_role は RLS・GRANT の対象外）。

grant select on public.profiles to authenticated;

-- movies は共有キャッシュ: 参照 + 追加のみ（改変・削除は不可）
grant select, insert on public.movies to authenticated;
-- movies.id（identity 列）の採番に必要
grant usage, select on all sequences in schema public to authenticated;

grant select, insert, update, delete on public.viewing_records to authenticated;

grant select on public.achievements to authenticated;

grant select, insert, update on public.user_achievements to authenticated;

-- service_role（サーバー専用・RLS バイパス）にも明示付与が必要。
-- 運用ツール・バックアップ・管理タスクからの全操作を許可する
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
