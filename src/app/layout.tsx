import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MOVIE STOCK — 観た映画を、集める",
    template: "%s | MOVIE STOCK",
  },
  description:
    "観た映画をコレクションに記録し、アチーブメントを解錠していく映画鑑賞ログ。",
};

export const viewport: Viewport = {
  themeColor: "#0b0e14",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={notoSansJp.variable}>
      <body className="min-h-dvh font-sans text-[15px] leading-[1.7]">
        {children}
      </body>
    </html>
  );
}
