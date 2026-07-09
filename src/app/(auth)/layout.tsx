import Link from "next/link";
import { TmdbAttribution } from "@/components/tmdb-attribution";

/** 認証系画面の共通レイアウト（DESIGN.md §4: フォームは最大480px中央寄せ） */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6">
      <header className="pt-14 pb-10 text-center">
        <Link
          href="/"
          className="text-lg font-bold tracking-[0.28em] text-gold"
        >
          MOVIE STOCK
        </Link>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="flex flex-col gap-2 py-8">
        <nav className="flex justify-center gap-6 text-xs text-fg-mute">
          <Link href="/terms" className="hover:text-fg-sub">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:text-fg-sub">
            プライバシーポリシー
          </Link>
        </nav>
        <TmdbAttribution />
      </footer>
    </div>
  );
}
