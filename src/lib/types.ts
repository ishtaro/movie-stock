// 用語集（SPEC.md 第2部6章）に対応する型定義

export const VIEWING_METHODS = [
  "theater",
  "streaming",
  "disc",
  "tv",
  "other",
] as const;

export type ViewingMethod = (typeof VIEWING_METHODS)[number];

export const METHOD_LABELS: Record<ViewingMethod, string> = {
  theater: "映画館",
  streaming: "配信",
  disc: "DVD・BD",
  tv: "TV放送",
  other: "その他",
};

export type Movie = {
  id: number;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  genres: string[];
  release_date: string | null;
};

export type ViewingRecord = {
  id: string;
  user_id: string;
  movie_id: number;
  watched_on: string;
  rating: number | null;
  comment: string;
  method: ViewingMethod;
  created_at: string;
  updated_at: string;
};

export type RecordWithMovie = ViewingRecord & { movies: Movie };

export type AchievementCategory = "count" | "genre" | "method" | "period";

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  count: "本数",
  genre: "ジャンル",
  method: "鑑賞方法",
  period: "時期",
};

export type AchievementKind =
  | "total_count"
  | "genre_single_count"
  | "genre_variety"
  | "method_count"
  | "month_count"
  | "release_span";

export type AchievementDef = {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  kind: AchievementKind;
  threshold: number;
  param: { method?: ViewingMethod } | null;
  sort: number;
};

export type UserAchievement = {
  achievement_id: string;
  unlocked_at: string;
  seen: boolean;
};

/** 解錠演出用の最小情報（サーバーアクション → クライアント） */
export type UnlockedInfo = Pick<AchievementDef, "id" | "name" | "description">;
