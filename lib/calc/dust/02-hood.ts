// Stage 2 — 후드 설계 (KOSHA W-1 별표13 + W-2)

import type { Stage2Input, Stage2Output, Stage1Output, HoodType } from "./types";
import { CONTROL_VELOCITY, HOOD_LOSS_COEFFICIENT, CARCINOGEN_VC_MULTIPLIER } from "@/lib/data/dust/kosha-controls";

/**
 * 가스 밀도 (이상기체)
 */
export function airDensity(T_C: number, P_kPa: number = 101.325, MW: number = 28.96): number {
  const T_K = T_C + 273.15;
  const R = 8.314; // J/(mol·K)
  return (P_kPa * 1000 * MW * 1e-3) / (R * T_K);
}

/**
 * 후드 풍량 식 (KOSHA W-1)
 *
 * 포위형:    Q = 60·A_o·V_c·SF
 * 외부식:    Q = 60·V_c·(10X² + A)·SF
 * 캐노피:    Q = 1.4·P·V_c·H × 60
 * 레시버:    Q = 1.5·D²·V_c × 60
 * 슬롯:      Q = 60·3.7·L·X·V_c·SF
 * 부스:      Q = 60·A_face·V_c·SF
 *
 * @returns Q (m³/min)
 */
export function calcHoodFlowrate(input: Stage2Input, V_c: number): number {
  const SF = input.safety_factor ?? 1.25;

  switch (input.hood_type) {
    case "enclosing":
    case "booth": {
      const A = input.open_area_m2 ?? input.face_area_m2 ?? 0;
      return 60 * A * V_c * SF;
    }
    case "exterior_lateral":
    case "exterior_downward":
    case "exterior_upward": {
      const X = input.capture_distance_X_m ?? 0;
      const A = input.source_area_m2 ?? 0;
      return 60 * V_c * (10 * X * X + A) * SF;
    }
    case "canopy": {
      const P = input.source_perimeter_m ?? 0;
      const H = input.hood_height_H_m ?? 1.0;
      return 1.4 * P * V_c * H * 60;
    }
    case "receiving": {
      const D = input.source_diameter_D_m ?? 0;
      return 1.5 * D * D * V_c * 60;
    }
    case "slot": {
      const L = input.slot_length_m ?? 0;
      const X = input.capture_distance_X_m ?? 0;
      return 60 * 3.7 * L * X * V_c * SF;
    }
  }
}

/**
 * 후드 정압손실
 * ΔP_hood = (1 + K_hood) × ρ × V² / 2
 *
 * V_duct는 Stage 3에서 결정되지만, Stage 2에서는 18 m/s 가정 후 Stage 3에서 보정
 */
export function calcHoodPressureDrop(
  hood_type: HoodType,
  V_duct_m_s: number,
  rho_kg_m3: number
): number {
  const K = HOOD_LOSS_COEFFICIENT[hood_type];
  return (1 + K) * rho_kg_m3 * V_duct_m_s * V_duct_m_s / 2;
}

// ──────────────────────────────────────────────
// 통합
// ──────────────────────────────────────────────

export function runStage2(input: Stage2Input, s1: Stage1Output): Stage2Output {
  // 제어풍속 결정
  const dust_state = s1.dust.particulate !== false ? "particle" : "gas";
  let V_c = CONTROL_VELOCITY[input.hood_type][dust_state];

  // 발암성·고독성 가산
  if (s1.dust.carcinogen || s1.dust.high_toxicity) {
    V_c *= CARCINOGEN_VC_MULTIPLIER;
  }

  const Q_hood = calcHoodFlowrate(input, V_c);

  // 정압손실 (V_duct 18 m/s 가정 — Stage 3에서 보정)
  const rho = airDensity(s1.gas.T_in_C, s1.gas.P_in_kPa);
  const dP_hood = calcHoodPressureDrop(input.hood_type, 18, rho);

  return {
    hood_type: input.hood_type,
    V_c_applied_m_s: V_c,
    Q_hood_m3min: Q_hood,
    dP_hood_Pa: dP_hood,
  };
}
