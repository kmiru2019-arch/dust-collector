// Stage 5-A — 백필터/카트리지

import type { BagInput, BagOutput } from "./types";
import { FILTER_MEDIA, recommendMedia, recommendAC, CAKE_RESISTANCE } from "@/lib/data/dust/filter-media";

export function designBaghouse(input: BagInput): BagOutput {
  const warnings: string[] = [];

  const AC = recommendAC(input.filter_type, input.industry, input.manual_AC);

  const media_code = input.manual_media ?? recommendMedia(input.T_in_C, input.gas_chemistry ?? {}, input.industry);
  const media = FILTER_MEDIA[media_code];

  if (input.T_in_C > media.T_max_C - 30) {
    warnings.push(
      `여재 ${media_code} 한계 ${media.T_max_C}°C 대비 운전 ${input.T_in_C}°C — 마진 부족`
    );
  }
  if (input.T_in_C > media.T_max_C) {
    warnings.push(`여재 ${media_code} 한계 초과 (${media.T_max_C}°C)`);
  }

  // 면적
  const A_total = input.Q_m3min / AC; // m²

  // 백 사이즈
  const D_mm = input.bag_diameter_mm ?? 160;
  const L_m = input.bag_length_m ?? 6;
  const A_per_bag = Math.PI * (D_mm / 1000) * L_m;
  const bag_count = Math.ceil(A_total / A_per_bag);

  // ΔP 모델 — Darcy 정확형
  // ΔP_dust[Pa] = α[m/kg] × C[kg/m³] × V²[m²/s²] × t[s] × μ[Pa·s]
  const V_face_m_s = AC / 60;
  const dP_clean = 50 * 9.81; // 50 mmAq → ~490 Pa
  const alpha = CAKE_RESISTANCE[input.industry ?? "default"] ?? CAKE_RESISTANCE.default;
  const C_inlet_kg_m3 = input.inlet_conc_g_m3 / 1000;
  const t_clean_s = 1200; // 청소 인터벌 20분
  const mu_g = 1.85e-5; // Pa·s, 공기 점도
  const dP_dust = alpha * C_inlet_kg_m3 * V_face_m_s * V_face_m_s * t_clean_s * mu_g;

  const dP_design = dP_clean + dP_dust;

  // 청소 인터벌 — dP_max 도달까지 시간 (분)
  const dP_max = 200 * 9.81; // 200 mmAq
  const dP_dust_rate_per_s = alpha * C_inlet_kg_m3 * V_face_m_s * V_face_m_s * mu_g;
  const cleaning_interval_min = dP_dust_rate_per_s > 0
    ? Math.max(5, Math.min(60, (dP_max - dP_clean) / dP_dust_rate_per_s / 60))
    : 20;

  // 펄스제트 공기소비
  const pulse_air =
    input.filter_type === "pulse_jet"
      ? (bag_count * 0.05) / cleaning_interval_min
      : undefined;

  if (dP_design > 2000) warnings.push("ΔP_design > 200 mmAq — A/C 낮춰야 함");
  if (AC > 2.0) warnings.push("A/C 너무 높음");
  if (AC < 0.3) warnings.push("A/C 너무 낮음 — 면적 과다");

  return {
    AC_ratio_m_min: AC,
    A_total_m2: A_total,
    bag_count,
    bag_dim: { D_mm, L_m },
    media: { code: media_code, T_max_C: media.T_max_C, full_name: media.full_name },
    dP_clean_Pa: dP_clean,
    dP_design_Pa: dP_design,
    cleaning_interval_min,
    pulse_air_consumption_Nm3min: pulse_air,
    warnings,
  };
}
