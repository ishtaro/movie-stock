"use client";

import { Film, Search, Trophy, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/collection", label: "コレクション", icon: Film },
  { href: "/search", label: "さがす", icon: Search },
  { href: "/achievements", label: "アチーブメント", icon: Trophy },
  { href: "/settings", label: "設定", icon: UserRound },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  // 記録詳細・編集はコレクション配下として扱う
  return href === "/collection" && pathname.startsWith("/record");
}

/** モバイル: 下部タブバー / デスクトップ: 上部ヘッダー（DESIGN.md §3） */
export function AppNav({ hasUnseen }: { hasUnseen: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {/* デスクトップヘッダー */}
      <header className="sticky top-0 z-20 hidden border-b border-line bg-base/90 backdrop-blur md:block">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
          <Link
            href="/collection"
            className="text-sm font-bold tracking-[0.28em] text-gold"
          >
            MOVIE STOCK
          </Link>
          <nav className="flex gap-1" aria-label="メイン">
            {ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className={`relative flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm ${
                  isActive(pathname, href)
                    ? "text-gold"
                    : "text-fg-sub hover:bg-surface hover:text-fg"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
                {href === "/achievements" && hasUnseen && (
                  <span
                    className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gold"
                    aria-label="未確認の解錠あり"
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* モバイル下部タブバー */}
      <nav
        aria-label="メイン"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(pathname, href) ? "page" : undefined}
            className={`relative flex h-14 flex-col items-center justify-center gap-0.5 ${
              isActive(pathname, href) ? "text-gold" : "text-fg-sub"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span className="text-[10px] tracking-wide">{label}</span>
            {href === "/achievements" && hasUnseen && (
              <span
                className="absolute top-2 right-[calc(50%-18px)] h-2 w-2 rounded-full bg-gold"
                aria-label="未確認の解錠あり"
              />
            )}
          </Link>
        ))}
      </nav>
    </>
  );
}
