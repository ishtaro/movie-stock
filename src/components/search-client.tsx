"use client";

import { SearchIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { posterUrl } from "@/lib/images";

type Result = {
  tmdbId: number;
  title: string;
  releaseYear: string | null;
  posterPath: string | null;
};

type Status = "idle" | "loading" | "done" | "error";

const DEBOUNCE_MS = 400; // DESIGN.md S-4【仮】

/** 作品検索（SPEC.md F-03 / DESIGN.md S-4） */
export function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [attempt, setAttempt] = useState(0); // 再試行用
  const abortRef = useRef<AbortController | null>(null);

  function handleChange(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setStatus("idle");
      setResults([]);
    }
  }

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("loading");
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as {
          results?: Result[];
          error?: string;
        };
        if (!res.ok) {
          setErrorMessage(data.error ?? "検索に失敗しました");
          setStatus("error");
          return;
        }
        setResults(data.results ?? []);
        setStatus("done");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setErrorMessage(
          "作品情報の取得に失敗しました。時間をおいて再試行してください",
        );
        setStatus("error");
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, attempt]);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative mb-4">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-fg-mute"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          // 画面遷移直後に検索入力へ自動フォーカス（DESIGN.md S-4）
          autoFocus
          placeholder="映画のタイトルで検索"
          aria-label="映画のタイトルで検索"
          className="w-full rounded-xl border border-line bg-surface py-2.5 pr-4 pl-10 text-fg placeholder:text-fg-mute"
        />
      </div>

      {status === "idle" && (
        <p className="py-10 text-center text-sm text-fg-mute">
          観た映画のタイトルを入力してください
        </p>
      )}

      {status === "loading" && (
        <ul className="flex flex-col gap-2" aria-label="読み込み中">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-[72px] animate-pulse rounded-xl bg-surface" />
          ))}
        </ul>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-center text-sm text-danger">{errorMessage}</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="h-11 rounded-[10px] border border-line px-6 text-sm"
          >
            再試行
          </button>
        </div>
      )}

      {status === "done" && results.length === 0 && (
        <p className="py-10 text-center text-sm leading-relaxed text-fg-sub">
          見つかりませんでした。
          <br />
          英題や別の表記も試してください。
        </p>
      )}

      {status === "done" && results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((r) => {
            const thumb = posterUrl(r.posterPath, "w185");
            return (
              <li key={r.tmdbId}>
                <Link
                  href={`/record/new?tmdbId=${r.tmdbId}`}
                  className="flex h-[72px] items-center gap-3 rounded-xl border border-line bg-surface px-3 hover:bg-elevated"
                >
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt=""
                      width={37}
                      height={56}
                      className="shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-14 w-[37px] shrink-0 rounded bg-elevated" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {r.title}
                    </span>
                    <span className="block text-xs text-fg-sub">
                      {r.releaseYear ?? "公開年不明"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
