// Stage 6 — 응축기/HX 결정 + 노점 회피 + 폐열회수 ROI

import type {
  Stage6Input, Stage6Output, Stage1Output, Stage3Output, Stage5Output,
  CondenserType, MediaCode,
} from "./types";
import { verhoffBanchero, waterDewpoint } from "./01-properties";
import { FILTER_MEDIA } from "@/lib/data/dust/filter-media";

/**
 * 후단 집진기·여재별 운전온도 한계
 */
function filterTemperatureLimit(
  collector: Stage6Input["downstream_collector_type"],
  media?: MediaCode
): number {
  switch (collector) {
    case "bag":
      return media ? FILTER_MEDIA[media].T_max_C : 200;
    case "cartridge":
      return 80;
    case "ep_dry":
      return 450;
    case "ep_wet":
      return 90;
    case "scrubber":
      return 80;
    default:
      return 200;
  }
}

/**
 * Magnus 식 — 포화 수증기압 (kPa)
 */
function P_sat_kPa(T_C: number): number {
  return 0.6108 * Math.exp((17.27 * T_C) / (T_C + 237.3));
}

/**
 * 절대 습도 (kg H₂O / kg dry gas)
 */
function absoluteHumidity(T_C: number, RH_pct: number, P_atm_kPa: number = 101.325): number {
  const Pv = (P_sat_kPa(T_C) * RH_pct) / 100;
  return (0.622 * Pv) / (P_atm_kPa - Pv);
}

/**
 * 응축기 형식 자동선정
 */
function selectCondenserType(input: Stage6Input, T_in: number, T_target: number, sticky: boolean): CondenserType | null {
  if (T_in <= T_target + 10) return null;

  if (sticky || T_in > 800) return "direct_quench";

  if (input.fuel_type === "msw" && T_in > 400) return "shell_tube_WHB";

  if (T_in > 350 && input.has_waste_heat_use) return "shell_tube_WHB";

  if (input.downstream_collector_type === "scrubber") return "GGH_regenerative";

  if (T_in < 200) return "plate_PHE";
  if (T_in > 350) return "shell_tube_WHB";

  return "finned_tube_APH";
}

/**
 * 응축기 capex 추정 (won)
 */
function condenserCapex(type: CondenserType): number {
  const map: Record<CondenserType, number> = {
    plate_PHE:        30_000_000,
    shell_tube_WHB:   80_000_000,
    finned_tube_APH:  50_000_000,
    air_cooled:       60_000_000,
    direct_quench:    20_000_000,
    GGH_regenerative: 200_000_000,
  };
  return map[type];
}

export function runStage6(
  input: Stage6Input,
  s1: Stage1Output,
  s3: Stage3Output,
  s5?: Stage5Output
): Stage6Output {
  const warnings: string[] = [];

  // 노점 계산
  const P_H2O_atm = (s1.gas.H2O_vol_pct ?? 8) / 100;
  const P_SO3_atm = (s1.gas.SO3_ppm ?? 0) * 1e-6;
  const T_dp_acid = P_SO3_atm > 0 ? verhoffBanchero(P_H2O_atm, P_SO3_atm) : -999;
  const T_dp_water = waterDewpoint(s1.gas.T_in_C, s1.gas.RH_in_pct);

  // 후단 한계온도 (Stage 5에서 백필터 여재 자동 추천된 경우 활용)
  const downstream = input.downstream_collector_type ??
    (s5?.bag ? "bag" : s5?.ep ? "ep_dry" : s5?.scrubber ? "scrubber" : "bag");
  const downstream_media = input.downstream_media ?? s5?.bag?.media.code;
  const T_filter_limit = filterTemperatureLimit(downstream, downstream_media);
  const T_required_max = T_filter_limit - 30;

  // 목표온도 = max(T_required, T_dp_acid + 20)
  const T_target =
    input.T_target_C ?? Math.max(T_required_max, T_dp_acid > 0 ? T_dp_acid + 20 : 100);

  // 형식 결정 — skip=true면 강제 None(응축기/냉각 미사용)
  const sticky = s1.dust.stickiness === "high" || s1.dust.tar === true;
  const type = input.skip ? null : selectCondenserType(input, s1.gas.T_in_C, T_target, sticky);

  // 응축수량 — 응축기 형식이 None이면 발생 0
  const Q_m3h_at_T = input.Q_m3h_at_T ?? s3.total.Q_total_m3min * 60;
  const T_K_in = s1.gas.T_in_C + 273.15;
  const m_dry_gas_kg_h = Q_m3h_at_T * 1.2 * (273.15 / T_K_in);
  let m_cond = 0;
  let waste_heat_kW = 0;
  if (type !== null && type !== undefined) {
    const W_in = absoluteHumidity(s1.gas.T_in_C, s1.gas.RH_in_pct);
    // P_sat(T_target) >= P_atm 이면 출구 포화습도 무한대 — 비정상, 클램프
    let W_out = 0;
    if (T_target < 99) {
      W_out = absoluteHumidity(T_target, 100);
    } else {
      W_out = W_in;  // 출구가 100°C 이상이면 응축 일어나지 않음
    }
    m_cond = Math.max(0, m_dry_gas_kg_h * (W_in - W_out));
    const cp_g_J_kgK = 1100;
    waste_heat_kW = ((m_dry_gas_kg_h / 3600) * cp_g_J_kgK * Math.max(0, s1.gas.T_in_C - T_target)) / 1000;
  }

  // ROI
  let ROI_yr: number | undefined;
  if (type && input.has_waste_heat_use) {
    const capex = condenserCapex(type);
    const op_h = input.op_hours_yr ?? 6000;
    const R_kWh = input.R_kWh_won ?? 100;
    const annual_savings = waste_heat_kW * op_h * R_kWh;
    if (annual_savings > 0) {
      ROI_yr = capex / annual_savings;
    }
  }

  // 재질
  let material = "SS400 (carbon steel)";
  if (T_dp_acid > 0 && T_target < T_dp_acid + 30) {
    material = "Hastelloy C-276";
  } else if (T_dp_acid > 100) {
    material = "SUS316L";
  }

  // 보온
  const insulation_mm = T_target < 200 ? 100 : 80;

  // 시동 가열
  const startup_heating = T_dp_acid > 0 && T_target < T_dp_acid + 20;

  // 검증
  if (T_dp_acid > 0 && T_target < T_dp_acid + 20) {
    warnings.push(
      `목표온도 ${T_target.toFixed(0)}°C < 노점 ${T_dp_acid.toFixed(0)}°C + 20K — 산응축 위험`
    );
  }
  if (m_cond > 0 && type !== "direct_quench") {
    warnings.push(`응축수 ${m_cond.toFixed(0)} kg/h 발생 — 폐수처리 필요`);
  }

  return {
    type,
    T_target_C: T_target,
    T_dewpoint_acid_C: T_dp_acid,
    T_dewpoint_water_C: T_dp_water,
    margin_K: T_target - Math.max(T_dp_acid, 0),
    m_condensate_kg_h: m_cond,
    waste_heat_kW,
    ROI_yr,
    material_recommendation: material,
    insulation_thickness_mm: insulation_mm,
    startup_heating_required: startup_heating,
    warnings,
  };
}
