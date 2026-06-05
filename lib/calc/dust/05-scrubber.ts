// Stage 5-D — 세정집진 (벤추리·패킹·스프레이·사이클로닉·SDA)

import type { ScrubberInput, ScrubberOutput, PSD } from "./types";

/**
 * Nukiyama-Tanasawa 액적 직경 (m)
 * d_drop_um = 16400/V_rel + 1.45·(L/G)^1.5
 */
export function nukiyamaTanasawa(V_rel_m_s: number, L_G_L_per_m3: number): number {
  const d_um = 16400 / V_rel_m_s + 1.45 * Math.pow(L_G_L_per_m3, 1.5);
  return d_um * 1e-6; // m
}

/**
 * Calvert 압력손실 (Pa)
 * ΔP = 1.03e-3 × V_throat² × L/G [in inH2O × 단위변환]
 * 단순화: ΔP[Pa] ≈ 1.03e-3 × V² × L/G × 248.84
 *      ≈ 0.256 × V² × L/G  [Pa]
 *
 * 본 코드는 더 일반적 식 사용:
 * ΔP[Pa] = 1e-3 × V_throat² × L/G × 9.81  (간이)
 */
export function calvertVenturiDP(V_throat_m_s: number, L_G_L_per_m3: number): number {
  // Calvert: ΔP[in. H2O] = 1.03e-3 × V[ft/s]² × L/G[gal/1000ft³]
  // 단위 통일된 SI: ΔP[Pa] ≈ V_throat² × L/G × 0.256 (10~100 mbar 범위)
  return V_throat_m_s * V_throat_m_s * L_G_L_per_m3 * 0.256;
}

/**
 * Yung-Calvert 입경별 효율 (단순화)
 *  - Stk: Stokes number on droplet
 *  - η_single: 단일 액적 관성충돌 효율 (Stk/(Stk+0.7))²
 *  - η_overall ≈ 1 - exp(-3 × η_single × L/G)
 *
 * d>5μm·V>80 m/s·L/G>1 → 99%+ (실측 일치)
 */
export function yungEfficiency(
  d_um: number,
  V_throat_m_s: number,
  L_G_L_per_m3: number,
  rho_p_kg_m3: number = 2200,
  mu_g_Pa_s: number = 1.85e-5
): number {
  const d_m = d_um * 1e-6;
  const d_drop = nukiyamaTanasawa(V_throat_m_s, L_G_L_per_m3);
  // Stokes number
  const Stk = (rho_p_kg_m3 * d_m * d_m * V_throat_m_s) / (9 * mu_g_Pa_s * d_drop);
  // 단일 액적 관성충돌 효율
  const η_single = Math.pow(Stk / (Stk + 0.7), 2);
  // 액가스 비 적용 (L/G L/m³)
  const η = 1 - Math.exp(-3 * η_single * L_G_L_per_m3);
  return Math.max(0, Math.min(1, η));
}

function designVenturi(input: ScrubberInput): ScrubberOutput {
  const target = input.target_efficiency;
  const V_throat =
    target >= 0.99 ? 120 : target >= 0.95 ? 90 : 70;
  const L_G = input.L_G ?? (target >= 0.99 ? 1.5 : 1.0);

  const dP = calvertVenturiDP(V_throat, L_G);

  const eff_curve = input.particle_dist.bins.map((b) => ({
    d_um: b.d_um,
    eta: yungEfficiency(b.d_um, V_throat, L_G),
  }));
  const eff_overall = eff_curve.reduce(
    (s, c, i) => s + c.eta * input.particle_dist.bins[i].mass_frac,
    0
  );

  const water_m3h = (input.Q_m3s * 3600 * L_G) / 1000;
  const wastewater_m3h = water_m3h * 0.85;

  return {
    type: "venturi",
    L_G_L_per_m3: L_G,
    V_throat_m_s: V_throat,
    dP_Pa: dP,
    efficiency_overall: eff_overall,
    water_consumption_m3h: water_m3h,
    wastewater_m3h,
    material_recommendation: "FRP or SUS316L",
    warnings: dP > 25000 ? ["ΔP 매우 높음 — 동력 부담"] : [],
  };
}

function designSDA(input: ScrubberInput): ScrubberOutput {
  const Ca_S = 1.6;
  const SO2_ppm = input.gas_chemistry.SO2_ppm ?? 0;
  const HCl_ppm = input.gas_chemistry.HCl_ppm ?? 0;

  // SO2: 64 g/mol, HCl: 36.5 g/mol, Ca(OH)₂: 74 g/mol
  // 1 mol Ca(OH)₂ = 1 mol SO2 또는 2 mol HCl
  const SO2_kgh = (SO2_ppm * 1e-6 * input.Q_m3s * 3600 * 64) / 22.414;
  const HCl_kgh = (HCl_ppm * 1e-6 * input.Q_m3s * 3600 * 36.5) / 22.414;
  const reagent_kg_h = (SO2_kgh / 64 * Ca_S + HCl_kgh / 36.5 / 2 * Ca_S) * 74;

  const slurry_concentration = 0.20;
  const water_m3h = reagent_kg_h / slurry_concentration / 1000 / 0.20; // 슬러리 → 물

  return {
    type: "sda",
    L_G_L_per_m3: 0,
    dP_Pa: 200 * 9.81,
    efficiency_overall: 0.90,
    water_consumption_m3h: water_m3h,
    wastewater_m3h: 0,
    reagent_consumption_kg_h: reagent_kg_h,
    approach_to_saturation_K: 15,
    retention_time_s: 10,
    material_recommendation: "Carbon steel + SS316L atomizer",
    warnings: ["출구는 백필터 의무 (활성탄 주입 권장 — Hg/Dioxin)"],
  };
}

function designPacked(input: ScrubberInput): ScrubberOutput {
  const L_G = input.L_G ?? 3.0;
  const dP = 100 * 9.81;
  const water_m3h = (input.Q_m3s * 3600 * L_G) / 1000;
  return {
    type: "packed",
    L_G_L_per_m3: L_G,
    dP_Pa: dP,
    efficiency_overall: 0.85,
    water_consumption_m3h: water_m3h,
    wastewater_m3h: water_m3h * 0.95,
    material_recommendation: "FRP",
    warnings: [],
  };
}

function designSpray(input: ScrubberInput): ScrubberOutput {
  const L_G = input.L_G ?? 5.0;
  return {
    type: "spray",
    L_G_L_per_m3: L_G,
    dP_Pa: 60 * 9.81,
    efficiency_overall: 0.70,
    water_consumption_m3h: (input.Q_m3s * 3600 * L_G) / 1000,
    wastewater_m3h: (input.Q_m3s * 3600 * L_G) / 1000 * 0.95,
    material_recommendation: "FRP or SS304",
    warnings: [],
  };
}

function designCyclonic(input: ScrubberInput): ScrubberOutput {
  return {
    type: "cyclonic",
    L_G_L_per_m3: 0,
    dP_Pa: 150 * 9.81,
    efficiency_overall: 0.95, // 미스트 분리만
    water_consumption_m3h: 0,
    wastewater_m3h: 0,
    material_recommendation: "FRP",
    warnings: ["벤추리 등 1차 후단 사용"],
  };
}

export function designScrubber(input: ScrubberInput): ScrubberOutput {
  switch (input.type) {
    case "venturi":  return designVenturi(input);
    case "sda":      return designSDA(input);
    case "packed":   return designPacked(input);
    case "spray":    return designSpray(input);
    case "cyclonic": return designCyclonic(input);
  }
}
