/** TMDb ポスター画像 URL（クライアント/サーバー共用の純関数） */
export function posterUrl(
  posterPath: string | null,
  size: "w185" | "w342" | "w500" = "w342",
): string | null {
  return posterPath ? `https://image.tmdb.org/t/p/${size}${posterPath}` : null;
}
