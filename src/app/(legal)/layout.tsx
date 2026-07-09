import Link from "next/link";
import { TmdbAttribution } from "@/components/tmdb-attribution";

/** 規約・ポリシー用レイアウト（DESIGN.md S-9: 本文最大幅 640px） */
export default function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col px-6">
      <header className="py-8">
        <Link href="/" className="text-sm font-bold tracking-[0.28em] text-gold">
          MOVIE STOCK
        </Link>
      </header>
      <main className="flex-1 pb-10 text-[15px] leading-[1.8]">{children}</main>
      <footer className="py-8">
        <TmdbAttribution />
      </footer>
    </div>
  );
}
