import type { Metadata } from "next";

export const metadata: Metadata = { title: "プライバシーポリシー" };

/** プライバシーポリシー（SPEC.md F-09）。内容は【仮】ドラフト。リリース前に確定する */
export default function PrivacyPage() {
  return (
    <article className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">プライバシーポリシー</h1>
      <p className="rounded-xl bg-surface px-4 py-3 text-sm text-fg-sub">
        本ポリシーは【仮】のドラフトです。正式リリース前に内容を確定します。
      </p>

      <section>
        <h2 className="mb-2 text-[17px] font-bold">1. 取得する情報</h2>
        <p>
          本サービスは、アカウント登録時にメールアドレスを取得します。また、利用者が
          入力した鑑賞記録（鑑賞日・評価・感想・鑑賞方法）を保存します。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[17px] font-bold">2. 利用目的</h2>
        <p>
          取得した情報は、本サービスの提供（認証、記録の保存・表示、アチーブメントの判定）
          およびお問い合わせへの対応のためにのみ利用します。広告配信や第三者への提供は行いません。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[17px] font-bold">3. 保存と委託</h2>
        <p>
          データの保存には Supabase を、ホスティングには Vercel を利用しています。
          通信はすべて暗号化（HTTPS）されます。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[17px] font-bold">4. 削除</h2>
        <p>
          退会時、アカウントとすべての記録データは削除されます。個別のデータ削除の
          お求めは、下記の連絡先までご連絡ください。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[17px] font-bold">5. 連絡先</h2>
        <p>お問い合わせ窓口: 【仮・リリース前に連絡用メールアドレスを記載】</p>
      </section>

      <p className="text-sm text-fg-mute">2026年7月10日 制定（ドラフト）</p>
    </article>
  );
}
