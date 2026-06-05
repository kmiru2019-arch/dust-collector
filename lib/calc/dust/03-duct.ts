// Stage 3 — 덕트 사이징 (Darcy + 손실계수)

import type { Stage3Input, Stage3Output, BranchResult, Stage1Output, Stage2Output } from "./types";
import { DUCT_ROUGHNESS_MM, FITTING_K, recommendTransportVelocity, roundUpStandardDuct } from "@/lib/data/dust/duct-fittings";
import { airDensity } from "./02-hood";

/**
 * Swamee-Jain 명시적 식 — Darcy 마찰계수
 * f = 0.25 / [log10(ε/(3.7D) + 5.74/Re^0.9)]²
 */
export function swameeJain(Re: number, ε_over_D: number): number {
  if (Re < 2300) return 64 / Re; // 층류
  const inner = ε_over_D / 3.7 + 5.74 / Math.pow(Re, 0.9);
  const log = Math.log10(inner);
  return 0.25 / (log * log);
}

/**
 * 가스 점도 (Sutherland)
 */
export function airViscosity(T_C: number): number {
  const T_K = T_C + 273.15;
  const μ_0 = 1.716e-5;
  const T_0 = 273.15;
  const C = 110.4;
  return μ_0 * Math.pow(T_K / T_0, 1.5) * (T_0 + C) / (T_K + C);
}

/**
 * 합류 손실 (Wright 식 단순화)
 */
function combineLoss(angle_deg: number, V_main_m_s: number, rho_kg_m3: number): number {
  // 각도별 K
  let K = 1.2;
  if (angle_deg <= 30) K = 0.20;
  else if (angle_deg <= 45) K = 0.40;
  else if (angle_deg <= 60) K = 0.60;
  else K = 1.20;
  return K * rho_kg_m3 * V_main_m_s * V_main_m_s / 2;
}

// ──────────────────────────────────────────────
// 통합
// ──────────────────────────────────────────────

export function runStage3(input: Stage3Input, s1: Stage1Output, s2: Stage2Output): Stage3Output {
  // 반송속도
  const V_t_recommended = recommendTransportVelocity({
    d50_um: s1.dust.d50_um,
    particle_density_kg_m3: s1.dust.particle_density_kg_m3,
    is_fume: s1.dust.d50_um < 1,
  });
  const V_t = input.transport_velocity_m_s ?? V_t_recommended;

  const ρ = airDensity(s1.gas.T_in_C, s1.gas.P_in_kPa);
  const μ = airViscosity(s1.gas.T_in_C);

  const branches: BranchResult[] = [];
  let Q_running = 0;
  const warnings: string[] = [];

  // 사용자가 권장값 미달인 V_t를 입력한 경우 경고 (분진 침전 위험)
  if (V_t < V_t_recommended * 0.85) {
    warnings.push(
      `반송속도 ${V_t.toFixed(1)} m/s가 권장값 ${V_t_recommended} m/s 미달 — 분진 침전 위험`
    );
  }
  if (V_t > 25) {
    warnings.push(`반송속도 ${V_t.toFixed(1)} m/s 과다 — 마모 위험 (권장 ≤ 25)`);
  }

  for (const b of input.branches) {
    Q_running += b.Q_m3min;
    const Q_m3s = b.Q_m3min / 60;

    // 직경
    const D_calc = Math.sqrt(4 * Q_m3s / (Math.PI * V_t));
    const D = roundUpStandardDuct(D_calc) / 1000; // mm → m
    const A = (Math.PI / 4) * D * D;
    const V_actual = Q_m3s / A;

    // Reynolds
    const Re = (ρ * V_actual * D) / μ;

    // 마찰
    const ε_over_D = DUCT_ROUGHNESS_MM[input.material] / 1000 / D;
    const f = swameeJain(Re, ε_over_D);
    const dP_straight = f * (b.length_m / D) * ρ * V_actual * V_actual / 2;

    // 국부손실
    let dP_local = 0;
    for (const fit of b.fittings) {
      const K = FITTING_K[fit.type];
      dP_local += K * ρ * V_actual * V_actual / 2 * fit.count;
    }

    // 합류손실
    const dP_combine = b.junction
      ? combineLoss(b.junction.angle_deg, V_actual, ρ)
      : 0;

    branches.push({
      id: b.id,
      D_m: D,
      V_actual_m_s: V_actual,
      Re,
      f,
      dP_straight_Pa: dP_straight,
      dP_local_Pa: dP_local,
      dP_combine_Pa: dP_combine,
      dP_total_Pa: dP_straight + dP_local + dP_combine,
    });

    // 가지별 검증 (실제 속도 vs 권장값)
    if (V_actual < V_t_recommended * 0.85) {
      warnings.push(`Branch ${b.id}: V ${V_actual.toFixed(1)} m/s — 권장 반송속도 ${V_t_recommended} m/s 미달, 분진 침전 위험`);
    }
    if (V_actual > 25) {
      warnings.push(`Branch ${b.id}: V ${V_actual.toFixed(1)} m/s 과다 — 마모 위험`);
    }
  }

  const V_min = Math.min(...branches.map((b) => b.V_actual_m_s));
  const V_max = Math.max(...branches.map((b) => b.V_actual_m_s));
  const dP_total = branches.reduce((s, b) => s + b.dP_total_Pa, 0);

  return {
    branches,
    total: {
      Q_total_m3min: Q_running,
      dP_duct_Pa: dP_total,
      V_min_m_s: V_min,
      V_max_m_s: V_max,
    },
    warnings,
  };
}
