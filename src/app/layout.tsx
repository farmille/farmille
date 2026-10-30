import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Toaster } from "@/components/Toaster";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { createRootMetadata } from "@/lib/seo";

import { css } from "../../styled-system/css";
import { SiteFooter } from "./_components/SiteFooter";

import "gen-interface-jp/400.css";
import "gen-interface-jp/500.css";
import "gen-interface-jp/600.css";
import "gen-interface-jp/700.css";
import "gen-interface-jp/800.css";
import "./globals.css";

// Adobe Fontsの日本語フォント用ローダー。Hydration後に実行し、Typekitのclass追加とReactの照合を競合させない。
const adobeFontsLoader = String.raw`
  (function(d) {
    var config = {
      kitId: 'wpa8wvf',
      scriptTimeout: 3000,
      async: true
    },
    h=d.documentElement,t=setTimeout(function(){h.className=h.className.replace(/\bwf-loading\b/g,"")+" wf-inactive";},config.scriptTimeout),tk=d.createElement("script"),f=false,s=d.getElementsByTagName("script")[0],a;h.className+=" wf-loading";tk.src='https://use.typekit.net/'+config.kitId+'.js?v=20261020-shippori';tk.async=true;tk.onload=tk.onreadystatechange=function(){a=this.readyState;if(f||a&&a!="complete"&&a!="loaded")return;f=true;clearTimeout(t);try{Typekit.load(config)}catch(e){}};s.parentNode.insertBefore(tk,s)
  })(document);
`;

// NEXT_PUBLIC_SITE_URL の評価をモジュール読み込み時ではなく使用時に遅延させる。
// ルートレイアウトは全ページから読み込まれるため、モジュール直下で評価すると
// ビルドの page data collection で env 未設定エラーが全ページに波及する。
export async function generateMetadata(): Promise<Metadata> {
  return createRootMetadata();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  return (
    <html lang="ja">
      <body>
        <NuqsAdapter>
          {/* 中身が短い画面でも、フッターを画面の下端より上へ上げない */}
          <div className={css({ minH: "dvh" })}>{children}</div>
          <SiteFooter />
          <OnboardingTour />
          <Toaster />
        </NuqsAdapter>
      </body>
      <Script id="adobe-fonts" strategy="afterInteractive">
        {adobeFontsLoader}
      </Script>
      {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
    </html>
  );
}
