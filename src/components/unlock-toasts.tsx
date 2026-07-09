"use client";

import { Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { UnlockedInfo } from "@/lib/types";

const SHOW_MS = 2_600; // 1件あたりの表示時間。複数解錠は順次表示（DESIGN.md §7）

/**
 * 解錠演出トースト。タップでアチーブメント一覧へ遷移。
 * アニメーションは CSS 側で prefers-reduced-motion に対応済み。
 */
export function UnlockToasts({
  unlocked,
  onDone,
}: {
  unlocked: UnlockedInfo[];
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setTimeout(
      () => {
        if (index >= unlocked.length) {
          onDone();
        } else {
          setIndex((i) => i + 1);
        }
      },
      unlocked.length === 0 ? 900 : SHOW_MS,
    );
    return () => clearTimeout(t);
  }, [index, unlocked.length, onDone]);

  const current = unlocked[index];
  if (!current) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4">
      <Link
        href="/achievements"
        key={current.id}
        className="animate-unlock-toast pointer-events-auto flex max-w-xs items-center gap-3 rounded-xl border border-gold/50 bg-elevated px-4 py-3 shadow-[0_0_22px_rgba(227,179,65,0.18)]"
      >
        <span className="animate-unlock-badge flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-gold to-gold-deep">
          <Trophy className="h-4 w-4 text-base" aria-hidden />
        </span>
        <span className="text-sm leading-snug">
          <b className="text-gold">『{current.name}』</b>を解錠！
          <span className="mt-0.5 block text-xs text-fg-sub">
            {current.description}
          </span>
        </span>
      </Link>
    </div>
  );
}
