import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "パスワード再設定" };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-bold">パスワード再設定</h1>
      <ResetPasswordForm />
    </>
  );
}
