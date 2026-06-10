import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { RegisterServiceWorker } from "./_pwa";

export const metadata: Metadata = {
  title: "행운로또 6/45 — 통계 번호 추출기",
  description:
    "과거 회차 통계·구조 분석 + 인기조합 회피 기반 로또 6/45 번호 추출 앱. 확률을 정직하게 알려드립니다.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "행운로또",
  },
  icons: {
    icon: [{ url: "/lottery-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/lottery-icon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function LotteryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100">
      <RegisterServiceWorker />
      {children}
    </div>
  );
}
