import { Star } from "lucide-react";

/** 評価の表示用（16px）。未評価は「未評価」と表示し星0と区別する（DESIGN.md §6） */
export function Stars({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <span className="text-sm text-fg-mute">未評価</span>;
  }
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`評価 ${rating} / 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={`h-4 w-4 ${
            i <= rating ? "fill-gold text-gold" : "text-fg-mute"
          }`}
        />
      ))}
    </span>
  );
}
