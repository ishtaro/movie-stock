import type { Metadata } from "next";

export const metadata: Metadata = { title: "利用規約" };

/** 利用規約（SPEC.md F-09）。内容は【仮】ドラフト。リリース前に確定する（TASKS.md フェーズ4） */
export default function TermsPage() {
  return (
    <article className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">利用規約</h1>
      <p className="rounded-xl bg-surface px-4 py-3 text-sm text-fg-sub">
        本規約は【仮】のドラフトです。正式リリース前に内容を確定します。
      </p>

      <section>
        <h2 className="mb-2 text-[17px] font-bold">第1条（適用）</h2>
        <p>
          本規約は、MOVIE STOCK（以下「本サービス」）の利用に関する条件を定めるものです。
          利用者は、本サービスを利用することにより本規約に同意したものとみなされます。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[17px] font-bold">第2条（アカウント）</h2>
        <p>
          利用者は、正確な情報によりアカウントを登録し、認証情報を自己の責任で管理するものとします。
          アカウントの不正利用により生じた損害について、運営者は故意または重過失がある場合を除き責任を負いません。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[17px] font-bold">第3条（禁止事項）</h2>
        <p>
          利用者は、法令または公序良俗に違反する行為、本サービスの運営を妨害する行為、
          不正アクセスその他これらに準ずる行為をしてはなりません。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[17px] font-bold">第4条（サービスの提供）</h2>
        <p>
          本サービスは無料で提供され、その完全性・可用性は保証されません。
          運営者は、事前の通知なくサービス内容の変更・停止・終了を行うことができます。
          終了する場合、可能な範囲で事前に告知します。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[17px] font-bold">第5条（作品情報）</h2>
        <p>
          本サービスの作品情報は TMDB の API を利用して取得しています。本サービスは
          TMDB により承認または認定されたものではありません。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[17px] font-bold">第6条（退会）</h2>
        <p>
          利用者は、設定画面からいつでも退会できます。退会時、アカウントおよび記録された
          データは削除され、復元できません。
        </p>
      </section>

      <p className="text-sm text-fg-mute">2026年7月10日 制定（ドラフト）</p>
    </article>
  );
}
