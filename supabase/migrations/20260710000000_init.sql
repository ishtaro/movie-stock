-- movie-stock 初期スキーマ（SPEC.md 第2部3章）
-- 全ユーザーデータのテーブルに RLS を適用し、本人以外のアクセスを DB 層で遮断する

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: 本人のみ参照" on public.profiles
  for select using ((select auth.uid()) = id);

-- サインアップ時に profiles を自動作成
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ movies（TMDb キャッシュ・全ユーザー共有） ============
create table public.movies (
  id bigint generated always as identity primary key,
  tmdb_id integer not null unique,
  title text not null,
  poster_path text,
  genres text[] not null default '{}',
  release_date date,
  created_at timestamptz not null default now()
);

alter table public.movies enable row level security;

create policy "movies: 認証済みは参照可" on public.movies
  for select to authenticated using (true);

-- 共有キャッシュの改変を防ぐため insert のみ許可（update/delete ポリシーなし）
create policy "movies: 認証済みは追加可" on public.movies
  for insert to authenticated with check (true);

-- ============ viewing_records（鑑賞記録） ============
create type public.viewing_method as enum ('theater', 'streaming', 'disc', 'tv', 'other');

create table public.viewing_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  movie_id bigint not null references public.movies (id),
  watched_on date not null,
  rating smallint check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 2000),
  method public.viewing_method not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 1ユーザー1作品1記録（SPEC.md F-04）
  unique (user_id, movie_id)
);

create index viewing_records_user_watched_idx
  on public.viewing_records (user_id, watched_on desc);

alter table public.viewing_records enable row level security;

create policy "records: 本人のみ参照" on public.viewing_records
  for select using ((select auth.uid()) = user_id);
create policy "records: 本人のみ作成" on public.viewing_records
  for insert with check ((select auth.uid()) = user_id);
create policy "records: 本人のみ更新" on public.viewing_records
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "records: 本人のみ削除" on public.viewing_records
  for delete using ((select auth.uid()) = user_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger viewing_records_updated_at
  before update on public.viewing_records
  for each row execute function public.set_updated_at();

-- ============ achievements（定義・全ユーザー共通） ============
-- アチーブメントはデータ駆動（SPEC.md F-07）。追加はこのテーブルへの insert のみで行う
create table public.achievements (
  id text primary key,
  name text not null,
  description text not null,
  category text not null check (category in ('count', 'genre', 'method', 'period')),
  kind text not null check (
    kind in (
      'total_count',        -- 総本数 >= threshold
      'genre_single_count', -- いずれかの同一ジャンルで >= threshold
      'genre_variety',      -- 記録したジャンルの種類数 >= threshold
      'method_count',       -- param->>'method' の鑑賞方法で >= threshold
      'month_count',        -- 同一年月内の記録数 >= threshold
      'release_span'        -- 記録内の公開年の最大差 >= threshold
    )
  ),
  threshold integer not null,
  param jsonb,
  sort integer not null
);

alter table public.achievements enable row level security;

create policy "achievements: 認証済みは参照可" on public.achievements
  for select to authenticated using (true);

-- ============ user_achievements（解錠履歴） ============
create table public.user_achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id text not null references public.achievements (id),
  unlocked_at timestamptz not null default now(),
  seen boolean not null default false,
  -- 二重解錠の防止（SPEC.md F-07 例外系）
  primary key (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

create policy "unlocks: 本人のみ参照" on public.user_achievements
  for select using ((select auth.uid()) = user_id);
create policy "unlocks: 本人のみ作成" on public.user_achievements
  for insert with check ((select auth.uid()) = user_id);
-- seen フラグの既読化のみ想定（unlocked_at の改変は UI に影響しないため許容）
create policy "unlocks: 本人のみ更新" on public.user_achievements
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
