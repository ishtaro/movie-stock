import Image from "next/image";
import { posterUrl } from "@/lib/images";

/**
 * ポスター表示（DESIGN.md §6）。2:3 固定・角丸8px。
 * 画像が取得できない作品はタイトル入りプレースホルダー（SPEC.md F-05 例外系）。
 */
export function Poster({
  path,
  title,
  sizes = "(min-width: 1024px) 190px, (min-width: 640px) 25vw, 33vw",
  priority = false,
}: {
  path: string | null;
  title: string;
  sizes?: string;
  priority?: boolean;
}) {
  const url = posterUrl(path, "w342");

  if (!url) {
    return (
      <div className="flex aspect-2/3 items-center justify-center rounded-lg border border-line bg-surface p-2">
        <span className="line-clamp-5 text-center text-xs leading-normal text-fg-sub">
          {title}
        </span>
      </div>
    );
  }

  return (
    <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-surface">
      <Image
        src={url}
        alt={title}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
