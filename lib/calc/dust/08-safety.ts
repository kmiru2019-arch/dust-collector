// Stage 8-A — 분진폭발 안전 평가 (KOSHA D-43 + NFPA 68)

import type { Stage1Output, ExplosionAnalysis } from "./types";

/**
 * NFPA 68 폭발벤트 면적 (단순화 식)
 *
 * A_v[m²] ≈ 1e-4 × (Kst × V^0.75) / sqrt(P_red - P_stat) × (1 + 0.6·max(0, L/D - 2))
 *
 * @param V_m3       용기 체적
 * @param P_red_bar  강도 한계 (Reduced overpressure)
 * @param P_stat_bar 벤트 개방압력 (Static activation)
 * @param Kst        분진 폭발지수 (bar·m/s)
 * @param L_D_ratio  Length/Diameter
 */
export function nfpa68VentArea(p: {
  V_m3: number;
  P_red_bar: number;
  P_stat_bar: number;
  Kst: number;
  L_D_ratio?: number;
}): number {
  if (p.P_red_bar <= p.P_stat_bar) return 0;
  const term1 = (p.Kst * Math.pow(p.V_m3, 0.75)) / Math.sqrt(p.P_red_bar - p.P_stat_bar);
  const eps_LD = 0.6;
  const L_D = p.L_D_ratio ?? 1.5;
  const term2 = 1 + eps_LD * Math.max(0, L_D - 2);
  return 1e-4 * term1 * term2;
}

/**
 * Zone 20/21/22 영역 분류 (KOSHA P-131)
 */
export function classifyZones(): { zone20: string[]; zone21: string[]; zone22: string[] } {
  return {
    zone20: ["baghouse_internal", "hopper", "cyclone_internal", "duct_post_collector"],
    zone21: ["doors", "inspection_ports", "bag_changeout_area"],
    zone22: ["surrounding_room"],
  };
}

export function analyzeExplosion(
  s1: Stage1Output,
  V_baghouse_m3: number = 30
): ExplosionAnalysis | null {
  if (!s1.dust.flammable) return null;

  const Kst = s1.dust.Kst_bar_m_s ?? 150; // 미실측 시 ST1 보수적
  const zones = classifyZones();
  const vent_area_m2 = nfpa68VentArea({
    V_m3: V_baghouse_m3,
    P_red_bar: 0.1,
    P_stat_bar: 0.05,
    Kst,
    L_D_ratio: 1.5,
  });

  return {
    ST_class: s1.derived.ST_class,
    zone20_areas: zones.zone20,
    zone21_areas: zones.zone21,
    zone22_areas: zones.zone22,
    vent_area_m2,
    isolation_required: true,
    ATEX_recommended: true,
  };
}
