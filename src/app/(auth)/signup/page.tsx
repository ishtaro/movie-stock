import type { Metadata } from "next";
import { SignupForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "新規登録" };

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-bold">新規登録</h1>
      <SignupForm />
    </>
  );
}
