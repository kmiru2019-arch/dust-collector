// 산업별 표준 배치 — 설비 간 최단 권장 덕트 길이·엘보
// "이 배치로 가면 시공 문제 없음" 기준값

import type { StandardLayout, LayoutSegment } from "@/lib/concept/types";

/**
 * 프리셋별 표준 배치 (구간 길이는 최단 권장)
 * 사용자가 부지 협소 시 수정 가능
 */
export const STANDARD_LAYOUTS: Record<string, StandardLayout> = {
  // 프리셋 1: 건식 백필터 단독
  preset_1: {
    segments: [
      { id: "S1", from: "HOOD", to: "BAG", length_m: 20, elbow_90: 2 },
      { id: "S2", from: "BAG", to: "FAN", length_m: 3, elbow_90: 0 },
      { id: "S3", from: "FAN", to: "STACK", length_m: 15, elbow_90: 1, expansion: 1 },
    ],
    total_length_m: 38,
    footprint_W_m: 12,
    footprint_D_m: 10,
    max_height_m: 20,
  },
  // 프리셋 2: 사이클론 + 백필터
  preset_2: {
    segments: [
      { id: "S1", from: "HOOD", to: "CYCLONE", length_m: 15, elbow_90: 2 },
      { id: "S2", from: "CYCLONE", to: "BAG", length_m: 5, elbow_90: 1 },
      { id: "S3", from: "BAG", to: "FAN", length_m: 3, elbow_90: 0 },
      { id: "S4", from: "FAN", to: "STACK", length_m: 15, elbow_90: 1, expansion: 1 },
    ],
    total_length_m: 38,
    footprint_W_m: 15,
    footprint_D_m: 12,
    max_height_m: 22,
  },
  // 프리셋 3: 건식 EP
  preset_3: {
    segments: [
      { id: "S1", from: "BOILER", to: "CONDENSER", length_m: 10, elbow_90: 1 },
      { id: "S2", from: "CONDENSER", to: "EP", length_m: 8, elbow_90: 1 },
      { id: "S3", from: "EP", to: "FAN", length_m: 5, elbow_90: 0 },
      { id: "S4", from: "FAN", to: "STACK", length_m: 20, elbow_90: 1, expansion: 1 },
    ],
    total_length_m: 43,
    footprint_W_m: 25,
    footprint_D_m: 15,
    max_height_m: 25,
  },
  // 프리셋 4: 반건식 SDA + 백필터 (소각)
  preset_4: {
    segments: [
      { id: "S1", from: "BOILER", to: "SDA", length_m: 8, elbow_90: 1 },
      { id: "S2", from: "SDA", to: "AC_INJECT", length_m: 5, elbow_90: 0 },
      { id: "S3", from: "AC_INJECT", to: "BAG", length_m: 3, elbow_90: 0 },
      { id: "S4", from: "BAG", to: "FAN", length_m: 3, elbow_90: 0 },
      { id: "S5", from: "FAN", to: "STACK", length_m: 15, elbow_90: 1, expansion: 1 },
    ],
    total_length_m: 34,
    footprint_W_m: 35,
    footprint_D_m: 18,
    max_height_m: 30,
  },
  // 프리셋 5: 습식 벤추리
  preset_5: {
    segments: [
      { id: "S1", from: "HOOD", to: "QUENCHER", length_m: 8, elbow_90: 1 },
      { id: "S2", from: "QUENCHER", to: "VENTURI", length_m: 3, elbow_90: 0 },
      { id: "S3", from: "VENTURI", to: "CYCLONIC", length_m: 3, elbow_90: 0 },
      { id: "S4", from: "CYCLONIC", to: "MIST_ELIM", length_m: 3, elbow_90: 0 },
      { id: "S5", from: "MIST_ELIM", to: "FAN", length_m: 3, elbow_90: 0 },
      { id: "S6", from: "FAN", to: "STACK", length_m: 15, elbow_90: 1, expansion: 1 },
    ],
    total_length_m: 35,
    footprint_W_m: 18,
    footprint_D_m: 12,
    max_height_m: 18,
  },
};

/**
 * 부지 협소 시 — 길이 70% 압축 (엘보 추가)
 */
export function compactLayout(layout: StandardLayout): StandardLayout {
  return {
    segments: layout.segments.map((s) => ({
      ...s,
      length_m: Math.max(2, Math.round(s.length_m * 0.7)),
      elbow_90: (s.elbow_90 ?? 0) + 1, // 압축 시 굴곡 추가
    })),
    total_length_m: Math.round(layout.total_length_m * 0.7),
    footprint_W_m: Math.round(layout.footprint_W_m * 0.75),
    footprint_D_m: Math.round(layout.footprint_D_m * 0.75),
    max_height_m: layout.max_height_m,
  };
}

export function getStandardLayout(preset: string): StandardLayout {
  return STANDARD_LAYOUTS[preset] ?? STANDARD_LAYOUTS.preset_1;
}
