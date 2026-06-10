"use client";

import { useCallback, useEffect, useState } from "react";

/* ── 서비스워커 등록 ─────────────────────────── */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/lottery" }).catch(() => {});
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}

/* ── 설치 상태/디스플레이 유틸 ───────────────── */
export function useStandalone(): boolean {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    const check = () =>
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.matchMedia?.("(display-mode: fullscreen)").matches ||
      // iOS Safari
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setStandalone(!!check());
  }, []);
  return standalone;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/* ── 홈화면 설치 버튼 (Android/Chrome) ────────── */
export function InstallButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia?.("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !deferred) return null;
  return (
    <button
      onClick={async () => {
        await deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
      }}
      className="rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200 backdrop-blur transition hover:bg-amber-400/20"
    >
      ⬇ 앱 설치
    </button>
  );
}

/* ── 전체화면 토글 (Fullscreen API) ──────────── */
export function FullscreenButton() {
  const [fs, setFs] = useState(false);
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(typeof document !== "undefined" && !!document.documentElement.requestFullscreen);
    const onChange = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggle = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);
  if (!supported) return null;
  return (
    <button
      onClick={toggle}
      aria-label="전체화면"
      className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-sm text-slate-300 transition hover:bg-white/10"
    >
      {fs ? "🗗" : "⛶"}
    </button>
  );
}

/* ── iOS 홈화면 추가 안내 (beforeinstallprompt 미지원) ── */
export function IosInstallHint() {
  const standalone = useStandalone();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    const dismissed = localStorage.getItem("lotto:ios-hint") === "1";
    if (isIos && isSafari && !standalone && !dismissed) {
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
  }, [standalone]);
  if (!show) return null;
  return (
    <div className="fixed inset-x-3 bottom-24 z-40 rounded-2xl border border-white/15 bg-slate-900/95 p-3 text-[13px] text-slate-200 shadow-2xl backdrop-blur">
      <div className="flex items-start gap-2">
        <span className="text-lg">📲</span>
        <p className="flex-1 leading-relaxed">
          홈 화면에 앱으로 추가하기: 하단 <b>공유</b> 버튼{" "}
          <span className="inline-block">⬆️</span> → <b>“홈 화면에 추가”</b>
        </p>
        <button
          onClick={() => {
            localStorage.setItem("lotto:ios-hint", "1");
            setShow(false);
          }}
          className="shrink-0 text-slate-500 hover:text-slate-200"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
