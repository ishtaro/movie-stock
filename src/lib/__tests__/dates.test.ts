import { describe, expect, it } from "vitest";
import { formatDate, releaseYear, todayJst } from "@/lib/dates";

describe("dates", () => {
  it("todayJst は YYYY-MM-DD 形式を返す", () => {
    expect(todayJst()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("formatDate は / 区切りに変換する", () => {
    expect(formatDate("2026-07-09")).toBe("2026/07/09");
  });

  it("releaseYear は公開年を取り出し、null は「－」にする", () => {
    expect(releaseYear("1988-12-17")).toBe("1988");
    expect(releaseYear(null)).toBe("－");
  });
});
