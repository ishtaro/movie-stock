import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "設定" };

/** 設定（SPEC.md F-02 / DESIGN.md S-8） */
export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ count: recordCount }, { count: achievementCount }] =
    await Promise.all([
      supabase
        .from("viewing_records")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("user_achievements")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-4 text-xl font-bold">設定</h1>

      <div className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm text-fg-sub">メールアドレス</span>
          <span className="text-sm">{user.email}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm text-fg-sub">パスワード</span>
          <Link
            href="/update-password"
            className="text-sm underline underline-offset-4"
          >
            変更する
          </Link>
        </div>
        <Link href="/terms" className="px-4 py-3.5 text-sm">
          利用規約
        </Link>
        <Link href="/privacy" className="px-4 py-3.5 text-sm">
          プライバシーポリシー
        </Link>
        <form action={logout} className="px-4 py-3.5">
          <button type="submit" className="text-sm underline underline-offset-4">
            ログアウト
          </button>
        </form>
      </div>

      <div className="mt-8 text-center">
        <DeleteAccountButton
          recordCount={recordCount ?? 0}
          achievementCount={achievementCount ?? 0}
        />
      </div>
    </div>
  );
}
