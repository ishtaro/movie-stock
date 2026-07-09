"use client";

import { CircleCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useState } from "react";
import {
  createRecord,
  updateRecord,
  type RecordActionState,
} from "@/app/actions/records";
import { StarRatingInput } from "@/components/star-rating-input";
import { UnlockToasts } from "@/components/unlock-toasts";
import { posterUrl } from "@/lib/images";
import { METHOD_LABELS, VIEWING_METHODS } from "@/lib/types";

type MovieInfo = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: string;
};

type Defaults = {
  watchedOn: string;
  method: string;
  rating: number | null;
  comment: string;
};

/** 記録の作成・編集フォーム（SPEC.md F-04 / F-06、DESIGN.md S-5） */
export function RecordForm({
  mode,
  movie,
  recordId,
  defaults,
  today,
}: {
  mode: "create" | "edit";
  movie: MovieInfo;
  recordId?: string;
  defaults?: Defaults;
  today: string;
}) {
  const router = useRouter();
  const action =
    mode === "create" ? createRecord : updateRecord.bind(null, recordId!);
  const [state, formAction, pending] = useActionState<
    RecordActionState,
    FormData
  >(action, null);

  const [watchedOn, setWatchedOn] = useState(defaults?.watchedOn ?? today);
  const [method, setMethod] = useState(defaults?.method ?? "");
  const [comment, setComment] = useState(defaults?.comment ?? "");
  const [dupDismissed, setDupDismissed] = useState(false);

  const goBack = useCallback(() => {
    router.push(mode === "create" ? "/collection" : `/record/${recordId}`);
    router.refresh();
  }, [router, mode, recordId]);

  // 保存成功: 成功トースト + 解錠演出を流してから遷移（DESIGN.md §7）
  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <CircleCheck className="h-10 w-10 text-ok" aria-hidden />
        <p className="text-sm text-fg-sub">記録を保存しました</p>
        <UnlockToasts unlocked={state.unlocked ?? []} onDone={goBack} />
      </div>
    );
  }

  const thumb = posterUrl(movie.posterPath, "w185");
  const remaining = 2000 - comment.length;

  return (
    <form
      action={formAction}
      onSubmit={() => setDupDismissed(false)}
      className="mx-auto w-full max-w-md"
    >
      {mode === "create" && (
        <input type="hidden" name="tmdbId" value={movie.tmdbId} />
      )}

      {/* 選択作品の確認 */}
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
        {thumb ? (
          <Image
            src={thumb}
            alt=""
            width={44}
            height={66}
            className="shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="h-[66px] w-11 shrink-0 rounded-md bg-elevated" />
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold">{movie.title}</p>
          <p className="text-xs text-fg-sub">{movie.releaseYear}</p>
        </div>
        {mode === "create" && (
          <Link
            href="/search"
            className="ml-auto shrink-0 text-xs text-fg-sub underline underline-offset-4"
          >
            変更
          </Link>
        )}
      </div>

      {/* エラー時は入力値を保持したまま表示（SPEC.md F-04 例外系） */}
      {state?.error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      <div className="mb-5">
        <label htmlFor="watchedOn" className="mb-2 block text-sm text-fg-sub">
          鑑賞日
          <span className="ml-1.5 rounded border border-gold px-1 text-[10px] text-gold align-[1px]">
            必須
          </span>
        </label>
        <input
          id="watchedOn"
          type="date"
          name="watchedOn"
          value={watchedOn}
          max={today}
          onChange={(e) => setWatchedOn(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-fg"
        />
      </div>

      <fieldset className="mb-5">
        <legend className="mb-2 block text-sm text-fg-sub">
          鑑賞方法
          <span className="ml-1.5 rounded border border-gold px-1 text-[10px] text-gold align-[1px]">
            必須
          </span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {VIEWING_METHODS.map((m) => (
            <label
              key={m}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-150 ${
                method === m
                  ? "border-gold bg-gold font-semibold text-base"
                  : "border-line bg-surface text-fg-sub"
              }`}
            >
              <input
                type="radio"
                name="method"
                value={m}
                checked={method === m}
                onChange={() => setMethod(m)}
                className="sr-only"
              />
              {METHOD_LABELS[m]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mb-5">
        <span className="mb-2 block text-sm text-fg-sub">評価</span>
        <StarRatingInput name="rating" defaultValue={defaults?.rating} />
      </div>

      <div className="mb-6">
        <label htmlFor="comment" className="mb-2 block text-sm text-fg-sub">
          感想
        </label>
        <textarea
          id="comment"
          name="comment"
          value={comment}
          maxLength={2000}
          rows={5}
          onChange={(e) => setComment(e.target.value)}
          placeholder="観た直後の気持ちをそのまま（あとで編集できます）"
          className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-2.5 leading-[1.8] text-fg placeholder:text-fg-mute"
        />
        {remaining <= 200 && (
          <p className="mt-1 text-right text-xs text-fg-sub">
            残り{remaining}文字
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!watchedOn || !method || pending}
        className="h-12 w-full rounded-[10px] bg-linear-to-b from-gold to-gold-deep font-bold text-base disabled:opacity-40"
      >
        {pending ? "保存中…" : "保存する"}
      </button>

      {/* 重複記録ダイアログ（SPEC.md F-04 例外系） */}
      {state?.duplicateId && !dupDismissed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="既に記録済み"
          className="fixed inset-0 z-40 flex items-center justify-center bg-base/70 px-6"
        >
          <div className="w-full max-w-sm rounded-xl border border-line bg-elevated p-5">
            <p className="font-semibold">この作品は既に記録済みです</p>
            <p className="mt-1 text-sm text-fg-sub">
              再鑑賞の場合は既存の記録を編集してください。
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href={`/record/${state.duplicateId}`}
                className="flex h-11 flex-1 items-center justify-center rounded-[10px] bg-linear-to-b from-gold to-gold-deep font-bold text-base"
              >
                記録を開く
              </Link>
              <button
                type="button"
                onClick={() => setDupDismissed(true)}
                className="h-11 flex-1 rounded-[10px] border border-line text-sm"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
