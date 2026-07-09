"use client";

import { Star } from "lucide-react";
import { useState } from "react";

/**
 * 評価入力（DESIGN.md S-5）: 星32px、タップで設定・同じ星の再タップで解除（未評価に戻す）。
 * 評価は任意（SPEC.md F-04）。
 */
export function StarRatingInput({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: number | null;
}) {
  const [value, setValue] = useState(defaultValue ?? 0);

  return (
    <div className="flex items-center gap-1.5">
      <input type="hidden" name={name} value={value === 0 ? "" : value} />
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => setValue(i === value ? 0 : i)}
          aria-label={`星${i}${i === value ? "（タップで解除）" : ""}`}
          aria-pressed={i <= value}
          className="rounded p-0.5"
        >
          <Star
            aria-hidden
            className={`h-8 w-8 transition-colors duration-150 ${
              i <= value ? "fill-gold text-gold" : "text-fg-mute"
            }`}
          />
        </button>
      ))}
      <span className="ml-1.5 text-sm text-fg-sub">
        {value === 0 ? "未評価" : value}
      </span>
    </div>
  );
}
