// KOSHA W-1-2019 별표13 — 제어풍속표
// 산업안전보건기준에 관한 규칙 별표13

import type { HoodType } from "@/lib/calc/dust/types";

/**
 * 후드 형식별 제어풍속 (m/s)
 * 가스상: 가스·증기·휘발성 유기물
 * 입자상: 분진·흄·미스트
 *
 * 출처: 산업안전보건기준에 관한 규칙 별표13
 *       KOSHA Guide W-1-2019
 */
export const CONTROL_VELOCITY: Record<HoodType, { gas: number; particle: number }> = {
  enclosing:        { gas: 0.4, particle: 0.7 },
  exterior_lateral: { gas: 0.5, particle: 1.0 },
  exterior_downward:{ gas: 0.5, particle: 1.0 },
  exterior_upward:  { gas: 1.0, particle: 1.5 },
  canopy:           { gas: 1.0, particle: 1.5 },
  receiving:        { gas: 0.5, particle: 1.0 },
  slot:             { gas: 0.5, particle: 1.0 },
  booth:            { gas: 0.4, particle: 0.5 },
};

/**
 * 후드 정압손실 계수 K_hood (∝ V_duct²)
 * ΔP_hood = (1 + K_hood) × ρ × V² / 2
 *
 * 출처: KOSHA W-2 후드 설계 지침
 */
export const HOOD_LOSS_COEFFICIENT: Record<HoodType, number> = {
  enclosing:         0.49,
  exterior_lateral:  0.50,
  exterior_downward: 0.50,
  exterior_upward:   0.49,
  canopy:            0.25,
  receiving:         0.40,
  slot:              1.78,
  booth:             0.50,
};

/**
 * 발암성·고독성 물질 시 V_c 가산 계수
 */
export const CARCINOGEN_VC_MULTIPLIER = 1.5;
