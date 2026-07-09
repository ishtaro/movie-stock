"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  login,
  requestPasswordReset,
  signup,
  updatePassword,
  type AuthState,
} from "@/app/actions/auth";

function ErrorText({ state }: { state: AuthState }) {
  if (!state?.error) return null;
  return (
    <p role="alert" className="text-sm text-danger">
      {state.error}
    </p>
  );
}

function MessageText({ state }: { state: AuthState }) {
  if (!state?.message) return null;
  return (
    <p role="status" className="rounded-xl bg-surface px-4 py-3 text-sm text-fg">
      {state.message}
    </p>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-fg placeholder:text-fg-mute";
const submitClass =
  "h-12 w-full rounded-[10px] bg-linear-to-b from-gold to-gold-deep font-bold text-base disabled:opacity-40";

export function LoginForm({ confirmError }: { confirmError: boolean }) {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {confirmError && (
        <p role="alert" className="text-sm text-danger">
          メールリンクの確認に失敗しました。リンクの有効期限が切れている可能性があります。
        </p>
      )}
      <ErrorText state={state} />
      <div>
        <label htmlFor="email" className="mb-2 block text-sm text-fg-sub">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm text-fg-sub">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "ログイン中…" : "ログイン"}
      </button>
      <div className="flex justify-between text-sm text-fg-sub">
        <Link href="/reset-password" className="underline underline-offset-4">
          パスワードを忘れた
        </Link>
        <Link href="/signup" className="underline underline-offset-4">
          新規登録はこちら
        </Link>
      </div>
    </form>
  );
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, null);

  if (state?.message) {
    return (
      <div className="flex flex-col gap-4">
        <MessageText state={state} />
        <Link
          href="/login"
          className="text-center text-sm text-fg-sub underline underline-offset-4"
        >
          ログイン画面へ
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ErrorText state={state} />
      <div>
        <label htmlFor="email" className="mb-2 block text-sm text-fg-sub">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm text-fg-sub">
          パスワード（8文字以上）
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
      </div>
      <p className="text-xs leading-relaxed text-fg-mute">
        登録により
        <Link href="/terms" className="underline underline-offset-2">
          利用規約
        </Link>
        と
        <Link href="/privacy" className="underline underline-offset-2">
          プライバシーポリシー
        </Link>
        に同意したものとみなされます。
      </p>
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "送信中…" : "無料ではじめる"}
      </button>
      <Link
        href="/login"
        className="text-center text-sm text-fg-sub underline underline-offset-4"
      >
        アカウントをお持ちの方はログイン
      </Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <MessageText state={state} />
      <ErrorText state={state} />
      <div>
        <label htmlFor="email" className="mb-2 block text-sm text-fg-sub">
          登録済みのメールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </div>
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "送信中…" : "再設定メールを送る"}
      </button>
      <Link
        href="/login"
        className="text-center text-sm text-fg-sub underline underline-offset-4"
      >
        ログイン画面へ戻る
      </Link>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ErrorText state={state} />
      <div>
        <label htmlFor="password" className="mb-2 block text-sm text-fg-sub">
          新しいパスワード（8文字以上）
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
      </div>
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "更新中…" : "パスワードを更新"}
      </button>
    </form>
  );
}
