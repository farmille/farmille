import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const isProduction = process.env.NODE_ENV === "production";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  weight: ["400", "500", "600", "700"],
  preload: false,
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Farmille — 農家が選ぶ BS 資材レビュー",
  description:
    "BS資材(生物・微生物農業資材)の現場レビューが集まるプラットフォーム。農家・JA 普及員・研究者の声から、自分の圃場に合った資材を選べます。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
      {isProduction && gaMeasurementId ? (
        <GoogleAnalytics gaId={gaMeasurementId} />
      ) : null}
    </html>
  );
}
