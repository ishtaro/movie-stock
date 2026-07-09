/**
 * TMDb 帰属表示（SPEC.md F-09）。全画面共通で常時表示する。
 * TODO(フェーズ4): TMDb 公式ロゴ画像を配置する（利用規約のブランディング要件）
 */
export function TmdbAttribution() {
  return (
    <p className="text-center text-[11px] leading-relaxed text-fg-mute">
      This product uses the{" "}
      <a
        href="https://www.themoviedb.org/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-fg-sub"
      >
        TMDB
      </a>{" "}
      API but is not endorsed or certified by TMDB.
    </p>
  );
}
