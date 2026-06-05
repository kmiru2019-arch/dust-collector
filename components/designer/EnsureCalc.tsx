"use client";
import { useEffect } from "react";
import { useDustStore } from "@/lib/store/dust-store";

/**
 * 클라이언트 마운트 시 outputs가 비었으면 자동 recalculate.
 * persist hydrate 누락(첫 방문) 및 SSR/CSR 동기화 안전망.
 */
export function EnsureCalc() {
  useEffect(() => {
    const s = useDustStore.getState();
    if (!s.outputs.stage1 || !s.outputs.stage8) {
      s.recalculate(1);
    }
  }, []);
  return null;
}
