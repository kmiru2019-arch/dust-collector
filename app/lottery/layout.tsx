import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { RegisterServiceWorker } from "./_pwa";

export const metadata: Metadata = {
  title: "행운로또 6/45 — 통계 번호 추출기",
  description:
    "과거 회차 통계·구조 분석 + 인기조합 회피 기반 로또 6/45 번호 추출 앱. 확률을 정직하게 알려드립니다.",
  applicationName: "행운로또",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "행운로또",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/lottery-icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
  openGraph: {
    title: "행운로또 6/45 — 통계 번호 추출기",
    description: "통계·구조 분석으로 합리적 조합을 뽑고 확률을 정직하게 알려주는 PWA 앱",
    type: "website",
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function LotteryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#0b1020] text-slate-100 [-webkit-tap-highlight-color:transparent] [overscroll-behavior:none] selection:bg-amber-400/30">
      <RegisterServiceWorker />
      {children}
    </div>
  );
}
