import { z } from "zod";
import { todayJst } from "@/lib/dates";
import { VIEWING_METHODS } from "@/lib/types";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "メールアドレスを入力してください")
  .pipe(z.email("メールアドレスの形式が正しくありません"));

// パスワード8文字以上（SPEC.md 非機能要件【仮】）
export const passwordSchema = z
  .string()
  .min(8, "パスワードは8文字以上で入力してください");

/** 鑑賞記録の入力（SPEC.md F-04） */
export const recordInputSchema = z.object({
  watchedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "鑑賞日を入力してください")
    .refine((d) => d <= todayJst(), "鑑賞日に未来の日付は指定できません"),
  method: z.enum(VIEWING_METHODS, "鑑賞方法を選択してください"),
  rating: z
    .string()
    .transform((v) => (v === "" || v === "0" ? null : Number(v)))
    .pipe(
      z
        .number()
        .int("評価が不正です")
        .min(1, "評価が不正です")
        .max(5, "評価が不正です")
        .nullable(),
    ),
  comment: z.string().max(2000, "感想は2,000文字以内で入力してください"),
});

export type RecordInput = z.infer<typeof recordInputSchema>;

/** ZodError から最初のメッセージを取り出す */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "入力内容を確認してください";
}
