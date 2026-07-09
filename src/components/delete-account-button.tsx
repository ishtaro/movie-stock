"use client";

import { useActionState, useState } from "react";
import { deleteAccount, type AccountState } from "@/app/actions/account";

/**
 * 退会ボタン（SPEC.md F-02 / DESIGN.md S-8）。
 * 削除される内容を数値で示す2段確認。タイプ確認は行わない【仮】。
 */
export function DeleteAccountButton({
  recordCount,
  achievementCount,
}: {
  recordCount: number;
  achievementCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<AccountState, FormData>(
    deleteAccount,
    null,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-danger underline underline-offset-4"
      >
        退会する
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="退会の確認"
          className="fixed inset-0 z-40 flex items-center justify-center bg-base/70 px-6"
        >
          <div className="w-full max-w-sm rounded-xl border border-line bg-elevated p-5">
            <p className="font-semibold">退会しますか？</p>
            <p className="mt-1 text-sm leading-relaxed text-fg-sub">
              アカウントと、鑑賞記録{recordCount}本・解錠済みアチーブメント
              {achievementCount}個がすべて即時削除されます。この操作は取り消せません。
            </p>
            {state?.error && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {state.error}
              </p>
            )}
            <form action={formAction} className="mt-4 flex gap-3">
              <button
                type="submit"
                disabled={pending}
                className="h-11 flex-1 rounded-[10px] bg-danger font-bold text-base disabled:opacity-40"
              >
                {pending ? "処理中…" : "退会する"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 flex-1 rounded-[10px] border border-line text-sm"
              >
                キャンセル
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
