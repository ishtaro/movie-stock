import { Clapperboard, NotebookPen, Trophy } from "lucide-react";
import Link from "next/link";
import { TmdbAttribution } from "@/components/tmdb-attribution";

const FEATURES = [
  {
    icon: NotebookPen,
    title: "1分で記録",
    body: "タイトル検索から4操作で保存。鑑賞直後の気持ちをそのまま残せます。",
  },
  {
    icon: Clapperboard,
    title: "ポスターが並ぶ",
    body: "記録した映画のポスターがコレクションに。観るほど棚が埋まっていきます。",
  },
  {
    icon: Trophy,
    title: "アチーブメント",
    body: "本数・ジャンル・鑑賞方法……記録を重ねると称号が解錠されます。",
  },
] as const;

/** ランディング（DESIGN.md S-1）。ログイン済みは middleware が /collection へ送る */
export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-6">
      <main className="flex flex-1 flex-col justify-center py-14">
        <p className="text-sm font-bold tracking-[0.28em] text-gold">
          MOVIE STOCK
        </p>
        <h1 className="mt-4 text-3xl leading-snug font-bold text-balance md:text-4xl">
          観た映画を、集める。
        </h1>
        <p className="mt-4 max-w-md leading-[1.8] text-fg-sub">
          いつ・なにを観て・どう感じたか。鑑賞の記録をコレクションにして、
          アチーブメントを解錠していく映画ログです。
        </p>

        <div className="mt-8 flex max-w-md flex-col gap-3">
          <Link
            href="/signup"
            className="flex h-12 items-center justify-center rounded-[10px] bg-linear-to-b from-gold to-gold-deep font-bold text-base"
          >
            無料ではじめる
          </Link>
          <Link
            href="/login"
            className="text-center text-sm text-fg-sub underline underline-offset-4"
          >
            ログイン
          </Link>
        </div>

        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="rounded-xl border border-line bg-surface p-4"
            >
              <Icon className="h-5 w-5 text-gold" aria-hidden />
              <p className="mt-2 font-semibold">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-fg-sub">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </main>

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
