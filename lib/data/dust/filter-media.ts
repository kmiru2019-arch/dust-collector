// 백필터 여재 12종 — 온도한계·내화학성·가격
// 출처: 제조사 카탈로그 종합 (Donaldson, Camfil, BWF Envirotec)

import type { MediaCode } from "@/lib/calc/dust/types";

export type ChemResistance = "low" | "med" | "high" | "vh"; // very high

export interface FilterMediaInfo {
  T_max_C: number;
  T_peak_C: number;
  acid: ChemResistance;
  alkali: ChemResistance;
  hydrolysis: ChemResistance;
  cost: 1 | 2 | 3 | 4 | 5; // ★~★★★★★
  full_name?: string;
}

export const FILTER_MEDIA: Record<MediaCode, FilterMediaInfo> = {
  PE:        { T_max_C: 130, T_peak_C: 150, acid: "med",  alkali: "low",  hydrolysis: "med",  cost: 1, full_name: "Polyester" },
  PP:        { T_max_C: 90,  T_peak_C: 100, acid: "high", alkali: "high", hydrolysis: "high", cost: 1, full_name: "Polypropylene" },
  Acrylic:   { T_max_C: 125, T_peak_C: 140, acid: "med",  alkali: "med",  hydrolysis: "med",  cost: 2 },
  Nomex:     { T_max_C: 200, T_peak_C: 220, acid: "med",  alkali: "med",  hydrolysis: "med",  cost: 3, full_name: "Aramid" },
  PPS:       { T_max_C: 190, T_peak_C: 210, acid: "high", alkali: "high", hydrolysis: "high", cost: 3, full_name: "Polyphenylene Sulfide" },
  P84:       { T_max_C: 240, T_peak_C: 260, acid: "high", alkali: "med",  hydrolysis: "med",  cost: 4, full_name: "Polyimide" },
  PTFE:      { T_max_C: 260, T_peak_C: 280, acid: "vh",   alkali: "vh",   hydrolysis: "vh",   cost: 5, full_name: "Teflon" },
  Glass:     { T_max_C: 260, T_peak_C: 290, acid: "med",  alkali: "med",  hydrolysis: "med",  cost: 2, full_name: "Glass fiber" },
  Ceramic:   { T_max_C: 600, T_peak_C: 700, acid: "high", alkali: "high", hydrolysis: "high", cost: 5 },
  Metal:     { T_max_C: 500, T_peak_C: 800, acid: "med",  alkali: "med",  hydrolysis: "high", cost: 4, full_name: "SS316 fiber" },
  Cellulose: { T_max_C: 60,  T_peak_C: 80,  acid: "low",  alkali: "low",  hydrolysis: "low",  cost: 1, full_name: "Cartridge cellulose" },
  ePTFE:     { T_max_C: 260, T_peak_C: 280, acid: "vh",   alkali: "vh",   hydrolysis: "vh",   cost: 5, full_name: "ePTFE membrane laminate" },
};

/**
 * 운전온도·산성 조건·산업별 여재 추천
 * MSW/위험폐기물 소각은 산성가스+다이옥신 흡착 케이크 조합으로 PTFE 표준
 */
export function recommendMedia(
  T_in_C: number,
  gas_chem: { HCl_ppm?: number; SO3_ppm?: number; NH3_ppm?: number } = {},
  industry?: string
): MediaCode {
  const acidic = (gas_chem.SO3_ppm ?? 0) > 5 || (gas_chem.HCl_ppm ?? 0) > 50;
  const alkaline = (gas_chem.NH3_ppm ?? 0) > 50;
  const isMSWLike = industry === "msw_incineration" || industry === "hazardous_waste_incineration";

  // 소각 + 산성 → PTFE (다이옥신 흡착 + 산저항)
  if (isMSWLike && acidic && T_in_C > 130) return "PTFE";

  if (T_in_C > 240) return "PTFE";
  if (T_in_C > 200 && acidic) return "PTFE";
  if (T_in_C > 200) return "P84";
  if (T_in_C > 130 && acidic) return "PPS";
  if (T_in_C > 130) return "Nomex";
  if (acidic) return "PP";
  if (alkaline) return "PP";
  return "PE";
}

/**
 * A/C ratio 추천 (산업·필터형식별)
 */
export const AC_RECOMMENDATIONS: Record<string, Record<string, number>> = {
  pulse_jet: {
    default: 1.2,
    cement_kiln: 0.9,
    cement_mill: 0.8,
    welding_fume: 0.6,
    msw_incineration: 0.9,
    hazardous_waste_incineration: 0.7,
    woodworking: 1.5,
    iron_eaf: 1.0,
    grain_handling: 1.5,
  },
  reverse_air: { default: 0.5 },
  shaker: { default: 0.7 },
  cartridge: { default: 1.0, welding_fume: 0.7 },
};

export function recommendAC(filter_type: string, industry?: string, manual_AC?: number): number {
  if (manual_AC) return manual_AC;
  const map = AC_RECOMMENDATIONS[filter_type] ?? { default: 1.0 };
  if (industry && map[industry] != null) return map[industry];
  return map.default;
}

/**
 * 분진별 케이크 저항계수 K_2 — ΔP_dust = K_2 × C × V × t
 *
 * 단위/스케일: 실측 백필터 운전 시 정상 ΔP_dust ≈ 50~150 mmAq (500~1500 Pa).
 * 보정 후 K_2 ≈ 1e7~1e8 범위 (이전 1e10은 3 order 과대 — Pa로 1.2 GPa 비정상).
 *
 * 디폴트 백필터(C=5g/m³, V_face=0.02 m/s, t=20min=1200s):
 *   ΔP_dust = 1e7 × 0.005 × 0.02 × 1200 = 1,200 Pa ≈ 122 mmAq  ✓
 */
/**
 * Specific cake resistance α (m/kg) — Darcy 식 정통 단위
 * ΔP_dust[Pa] = α[m/kg] × W[kg/m²] × μ[Pa·s] × V[m/s]
 *             = α × C × V² × t × μ
 *
 * 일반 산업분진 α ≈ 1e10~5e10 m/kg (Donaldson, Camfil 카탈로그)
 *
 * 디폴트 (C=5g/m³, V_face=0.02 m/s, t=1200s, μ=1.85e-5 Pa·s):
 *   ΔP_dust = 1e10 × 5e-3 × (0.02)² × 1200 × 1.85e-5 ≈ 444 Pa ≈ 45 mmAq ✓
 */
export const CAKE_RESISTANCE: Record<string, number> = {
  default: 1.0e10,
  cement: 5.0e10,
  cement_kiln: 5.0e10,
  cement_mill: 4.0e10,
  fly_ash: 2.0e10,
  coal_power: 2.0e10,
  woodflour: 0.8e10,
  woodworking: 0.8e10,
  metal_grinding: 1.5e10,
  welding_fume: 2.0e10,
  msw_incineration: 4.0e10,
  generic: 1.0e10,
};
