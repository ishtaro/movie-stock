import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "パスワード変更" };

/** パスワード再設定リンクの着地点 / 設定からの変更（SPEC.md F-01） */
export default function UpdatePasswordPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-6 text-xl font-bold">パスワードの変更</h1>
      <UpdatePasswordForm />
    </div>
  );
}
