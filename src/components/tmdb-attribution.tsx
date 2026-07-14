import Image from "next/image";

/**
 * TMDb 帰属表示（SPEC.md F-09）。全画面共通で常時表示する。
 * ロゴは TMDb 公式ブランドアセット（blue short）。
 */
export function TmdbAttribution() {
  return (
    <div className="flex flex-col items-center gap-2">
      <a
        href="https://www.themoviedb.org/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="The Movie Database"
      >
        <Image
          src="/tmdb-logo.svg"
          alt="TMDB"
          width={92}
          height={12}
          className="opacity-70"
        />
      </a>
      <p className="text-center text-[11px] leading-relaxed text-fg-mute">
        This product uses the TMDB API but is not endorsed or certified by
        TMDB.
      </p>
    </div>
  );
}
