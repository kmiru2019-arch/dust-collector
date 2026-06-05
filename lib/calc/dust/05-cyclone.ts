// Stage 5-B — 사이클론 (Stairmand/Lapple/Swift 6종)

import type { CycloneInput, CycloneOutput, CycloneStandardCode } from "./types";
import { CYCLONE_STANDARDS } from "@/lib/data/dust/cyclone-standards";

/**
 * 사이클론 본체직경 D 계산
 * Q = V_i × a × b = V_i × (a/D) × (b/D) × D²
 * → D = sqrt(Q / (V × a/D × b/D))
 */
export function calcCycloneDiameter(
  Q_m3s: number,
  V_target: number,
  a_D: number,
  b_D: number
): number {
  return Math.sqrt(Q_m3s / (V_target * a_D * b_D));
}

/**
 * Lapple 컷오프 입경 d50 (m)
 * d_50 = sqrt[ 9·μ·b / (2π·N_e·V_i·(ρ_p − ρ_g)) ]
 */
export function lappleD50(
  mu_g_Pa_s: number,
  b_m: number,
  N_e: number,
  V_i_m_s: number,
  rho_p_kg_m3: number,
  rho_g_kg_m3: number
): number {
  const num = 9 * mu_g_Pa_s * b_m;
  const den = 2 * Math.PI * N_e * V_i_m_s * (rho_p_kg_m3 - rho_g_kg_m3);
  return Math.sqrt(num / den);
}

/**
 * 입경 d에서의 효율 (Lapple 단순형)
 * η(d) = 1 / (1 + (d_50/d)²)
 */
export function lappleEfficiency(d_um: number, d50_um: number): number {
  if (d_um <= 0) return 0;
  return 1 / (1 + Math.pow(d50_um / d_um, 2));
}

export function designCyclone(input: CycloneInput): CycloneOutput {
  const std = CYCLONE_STANDARDS[input.standard];
  const V_target = input.V_target_m_s ?? 18;
  const ρ_g = input.rho_g_kg_m3 ?? 1.2;
  const μ = input.mu_g_Pa_s ?? 1.85e-5;
  const count = input.count ?? 1;
  const warnings: string[] = [];

  const Q_per_unit = input.Q_m3min / 60 / count;
  const D = calcCycloneDiameter(Q_per_unit, V_target, std.a_D, std.b_D);

  const dim = {
    D_mm: D * 1000,
    a_mm: D * std.a_D * 1000,
    b_mm: D * std.b_D * 1000,
    De_mm: D * std.De_D * 1000,
    S_mm: D * std.S_D * 1000,
    h_mm: D * std.h_D * 1000,
    H_mm: D * std.H_D * 1000,
    B_mm: D * std.B_D * 1000,
  };

  const V_i = Q_per_unit / ((dim.a_mm / 1000) * (dim.b_mm / 1000));
  const dP = (std.K_NH * ρ_g * V_i * V_i) / 2;
  const d50_m = lappleD50(μ, dim.b_mm / 1000, std.N_e, V_i, input.rho_p_kg_m3, ρ_g);
  const d50_um = d50_m * 1e6;

  const efficiency_curve = input.particle_dist.bins.map((bin) => ({
    d_um: bin.d_um,
    eta: lappleEfficiency(bin.d_um, d50_um),
  }));
  const efficiency_overall = efficiency_curve.reduce(
    (s, c, i) => s + c.eta * input.particle_dist.bins[i].mass_frac,
    0
  );

  if (V_i < 12) warnings.push(`입구속도 ${V_i.toFixed(1)} m/s 너무 낮음`);
  if (V_i > 22) warnings.push(`입구속도 ${V_i.toFixed(1)} m/s 너무 높음 (마모)`);
  if (dP > 2000) warnings.push(`ΔP ${(dP / 9.81).toFixed(0)} mmAq — 200 초과 부담`);
  if (D > 1.0 && count === 1) {
    warnings.push(`본체 직경 ${(D * 1000).toFixed(0)}mm — 멀티사이클론 검토`);
  }

  return {
    D_m: D,
    dimensions_mm: dim,
    V_i_m_s: V_i,
    dP_Pa: dP,
    d50_um,
    efficiency_overall,
    efficiency_curve,
    count,
    warnings,
  };
}

/**
 * 멀티사이클론 자동결정 (D > 1m이면 소형 D=0.3m 다수 병렬)
 */
export function autoMulticyclone(input: CycloneInput): CycloneOutput {
  const single = designCyclone({ ...input, count: 1 });
  if (single.D_m <= 0.6) return single;

  // 소형 D=0.3m (실용 멀티사이클론)
  const D_small = 0.3;
  const V_target = input.V_target_m_s ?? 18;
  const std = CYCLONE_STANDARDS[input.standard];
  const Q_per_small = V_target * std.a_D * std.b_D * D_small * D_small;
  const n = Math.ceil(input.Q_m3min / 60 / Q_per_small);
  return designCyclone({ ...input, count: n });
}
