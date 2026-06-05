// 덕트 사이징 데이터 — 반송속도, 재질 조도, 손실계수

import type { DuctMaterial, Fitting } from "@/lib/calc/dust/types";

/**
 * 분진 종류별 권장 반송속도 (m/s)
 * 출처: KOSHA W-3 + ACGIH 산업환기 매뉴얼
 */
export const TRANSPORT_VELOCITY = {
  gas:                    { min: 6,  max: 12, default: 9 },
  fume_welding:           { min: 8,  max: 10, default: 9 },
  light_dust_woodflour:   { min: 13, max: 16, default: 14 },
  medium_dust_cement:     { min: 18, max: 20, default: 18 },
  heavy_dust_metal:       { min: 20, max: 23, default: 21 },
  very_heavy_lead:        { min: 23, max: 25, default: 24 },
} as const;

/**
 * 재질별 절대 조도 (mm)
 * 출처: Moody chart, ASHRAE Fundamentals
 */
export const DUCT_ROUGHNESS_MM: Record<DuctMaterial, number> = {
  SS400: 0.046,         // Carbon steel
  SUS304: 0.015,
  SUS316L: 0.015,
  FRP: 0.005,
  Galvanized: 0.15,
};

/**
 * 국부 손실계수 K
 * ΔP_local = K × ρ × V² / 2
 *
 * 출처: ACGIH Industrial Ventilation Manual 28th + ASHRAE Duct Fitting Database
 */
export const FITTING_K: Record<Fitting["type"], number> = {
  // 엘보 90°
  "elbow_90_R1":     0.30,  // R/D = 1.0
  "elbow_90_R1.5":   0.20,  // R/D = 1.5
  "elbow_90_R2":     0.15,  // R/D = 2.0
  "elbow_45":        0.20,
  // 분기 T (메인 직진 vs 분기 측)
  "branch_T_run":    0.15,
  "branch_T_branch": 1.00,
  // Y 합류 각도별
  "branch_Y_30":     0.20,
  "branch_Y_45":     0.40,
  "branch_Y_90":     1.20,
  // 확대·축소
  "expansion_15":     0.15,
  "contraction_15":   0.05,
  "expansion_sudden": 1.00,
  "contraction_sudden": 0.50,
  // 밸브
  "gate_valve_open":      0.15,
  "butterfly_valve_open": 0.30,
  "damper_open":          0.20,
  "blast_gate_open":      0.50,
};

/**
 * 표준 덕트 사이즈 (mm) — KS B 6361 기반 + 일반 산업표준
 */
export const STANDARD_DUCT_DIAMETER_MM = [
  100, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500,
  550, 600, 650, 700, 750, 800, 900, 1000, 1100, 1200, 1400, 1600, 1800, 2000,
];

export function roundUpStandardDuct(D_calc_m: number): number {
  const D_mm = D_calc_m * 1000;
  return STANDARD_DUCT_DIAMETER_MM.find((s) => s >= D_mm) ?? 2000;
}

/**
 * 분진 유형 → 추천 반송속도
 */
export function recommendTransportVelocity(dust: {
  d50_um: number;
  particle_density_kg_m3: number;
  is_fume?: boolean;
}): number {
  if (dust.is_fume || dust.d50_um < 1) return TRANSPORT_VELOCITY.fume_welding.default;
  if (dust.particle_density_kg_m3 > 6000) return TRANSPORT_VELOCITY.very_heavy_lead.default;
  if (dust.particle_density_kg_m3 > 4000) return TRANSPORT_VELOCITY.heavy_dust_metal.default;
  if (dust.particle_density_kg_m3 > 1500) return TRANSPORT_VELOCITY.medium_dust_cement.default;
  return TRANSPORT_VELOCITY.light_dust_woodflour.default;
}
