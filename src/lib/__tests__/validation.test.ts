import { describe, expect, it } from "vitest";
import { todayJst } from "@/lib/dates";
import {
  emailSchema,
  passwordSchema,
  recordInputSchema,
} from "@/lib/validation";

/** JST の今日から days 日ずらした YYYY-MM-DD */
function jstDateOffset(days: number): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    new Date(Date.now() + days * 86_400_000),
  );
}

const valid = {
  watchedOn: todayJst(),
  method: "theater",
  rating: "4",
  comment: "よかった",
};

describe("recordInputSchema（SPEC.md F-04）", () => {
  it("必須項目（鑑賞日・鑑賞方法）のみで保存できる: 評価・感想は空でよい", () => {
    const r = recordInputSchema.safeParse({
      ...valid,
      rating: "",
      comment: "",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.rating).toBeNull();
      expect(r.data.comment).toBe("");
    }
  });

  it("例外系: 未来の日付は拒否する（JST 基準）", () => {
    const r = recordInputSchema.safeParse({
      ...valid,
      watchedOn: jstDateOffset(1),
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toContain("未来の日付");
    }
  });

  it("今日（JST）は許可する", () => {
    expect(recordInputSchema.safeParse(valid).success).toBe(true);
  });

  it("例外系: 感想は2,000文字まで。2,001文字は拒否する", () => {
    const ok = recordInputSchema.safeParse({
      ...valid,
      comment: "あ".repeat(2000),
    });
    const ng = recordInputSchema.safeParse({
      ...valid,
      comment: "あ".repeat(2001),
    });
    expect(ok.success).toBe(true);
    expect(ng.success).toBe(false);
  });

  it("評価は1〜5の整数のみ。0・空は未評価（null）、範囲外・非数は拒否する", () => {
    const cases: [string, boolean, number | null][] = [
      ["", true, null],
      ["0", true, null],
      ["1", true, 1],
      ["5", true, 5],
      ["6", false, null],
      ["2.5", false, null],
      ["abc", false, null],
    ];
    for (const [input, success, value] of cases) {
      const r = recordInputSchema.safeParse({ ...valid, rating: input });
      expect(r.success, `rating=${input}`).toBe(success);
      if (r.success) expect(r.data.rating).toBe(value);
    }
  });

  it("例外系: 不正な鑑賞方法・日付形式は拒否する", () => {
    expect(
      recordInputSchema.safeParse({ ...valid, method: "cinema" }).success,
    ).toBe(false);
    expect(
      recordInputSchema.safeParse({ ...valid, watchedOn: "2026/07/09" })
        .success,
    ).toBe(false);
    expect(
      recordInputSchema.safeParse({ ...valid, watchedOn: "" }).success,
    ).toBe(false);
  });
});

describe("認証入力（SPEC.md F-01）", () => {
  it("メールアドレスの形式を検証する", () => {
    expect(emailSchema.safeParse("a@example.com").success).toBe(true);
    expect(emailSchema.safeParse("  a@example.com  ").success).toBe(true);
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(emailSchema.safeParse("").success).toBe(false);
  });

  it("パスワードは8文字以上【仮】", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
    expect(passwordSchema.safeParse("1234567").success).toBe(false);
  });
});
