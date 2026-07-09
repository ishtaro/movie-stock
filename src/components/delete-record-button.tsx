"use client";

import { useState, useTransition } from "react";
import { deleteRecord } from "@/app/actions/records";

/** 記録の削除（確認ダイアログ付き。SPEC.md F-06 / DESIGN.md S-6） */
export function DeleteRecordButton({
  recordId,
  title,
}: {
  recordId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-danger underline underline-offset-4"
      >
        削除
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="記録の削除確認"
          className="fixed inset-0 z-40 flex items-center justify-center bg-base/70 px-6"
        >
          <div className="w-full max-w-sm rounded-xl border border-line bg-elevated p-5">
            <p className="font-semibold">記録を削除しますか？</p>
            <p className="mt-1 text-sm text-fg-sub">
              『{title}』の鑑賞記録を削除します。この操作は取り消せません。
              解錠済みのアチーブメントは残ります。
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => deleteRecord(recordId))}
                className="h-11 flex-1 rounded-[10px] bg-danger font-bold text-base disabled:opacity-40"
              >
                {pending ? "削除中…" : "削除する"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 flex-1 rounded-[10px] border border-line text-sm"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
