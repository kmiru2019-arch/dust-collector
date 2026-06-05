// Stage 5-C — 전기집진기 (EP/WESP)

import type { EPInput, EPOutput } from "./types";
import { lookupDriftVelocity } from "@/lib/data/dust/drift-velocity";

/**
 * Deutsch-Anderson 식 — η = 1 - exp(-A·w/Q)
 * SCA = A/Q [s/m] — Specific Collecting Area
 */
export function deutschEfficiency(SCA_s_per_m: number, w_m_s: number): number {
  return 1 - Math.exp(-SCA_s_per_m * w_m_s);
}

/**
 * Modified Deutsch-Matts — η = 1 - exp[-(A·w·k')^k]
 * k ≈ 0.4~0.7 (재비산·분포 보정)
 */
export function modifiedDeutschMatts(SCA: number, w: number, k = 0.5): number {
  return 1 - Math.exp(-Math.pow(SCA * w, k));
}

/**
 * 비저항 영향에 따른 드리프트 속도 보정
 */
function applyResistivityCorrection(
  w_base: number,
  resistivity_Ohm_cm: number,
  ep_type: "dry" | "wet"
): { w: number; conditioning: EPOutput["conditioning"]; warning?: string } {
  if (resistivity_Ohm_cm < 1e4) {
    return {
      w: w_base * 0.7,
      conditioning: null,
      warning: `비저항 ${resistivity_Ohm_cm.toExponential(1)} 낮음 — 재비산 위험`,
    };
  }
  if (resistivity_Ohm_cm >= 1e11 && ep_type === "dry") {
    return {
      w: w_base * 0.5,
      conditioning: {
        type: "SO3_or_NH3",
        recommendation: "SO₃/NH₃ 컨디셔닝 또는 WESP 전환",
        SO3_ppm: 10,
      },
      warning: `비저항 ${resistivity_Ohm_cm.toExponential(1)} > 10¹¹ — 백코로나 위험`,
    };
  }
  if (resistivity_Ohm_cm >= 1e10) {
    return {
      w: w_base * 0.8,
      conditioning: null,
      warning: "비저항 한계영역 — 펄스 에너자이제이션 권장",
    };
  }
  return { w: w_base, conditioning: null };
}

export function designEP(input: EPInput): EPOutput {
  const ρ = input.dust_resistivity_Ohm_cm;
  const [w_low, w_high] = lookupDriftVelocity(input.industry);
  const w_base = (w_low + w_high) / 2;
  const warnings: string[] = [];

  const corr = applyResistivityCorrection(w_base, ρ, input.ep_type);
  const w = corr.w;
  if (corr.warning) warnings.push(corr.warning);

  // SCA from target efficiency (Deutsch 역식)
  const SCA = -Math.log(1 - input.target_efficiency) / w;
  const A_total = SCA * input.Q_m3s;

  // 필드 수
  const A_per_field = input.area_per_field_m2 ?? 30;
  const field_count = Math.max(2, Math.ceil(A_total / A_per_field));

  // 전기조건
  const voltage_kV = input.ep_type === "wet" ? 50 : 60;
  const current_density_mA_m2 = ρ < 1e9 ? 0.4 : 0.2;

  // Modified Deutsch-Matts 재검증
  const k = 0.5;
  const η_modified = modifiedDeutschMatts(SCA, w, k);
  if (η_modified < input.target_efficiency * 0.9) {
    warnings.push(
      `Modified D-M: ${(η_modified * 100).toFixed(1)}% (목표 ${(
        input.target_efficiency * 100
      ).toFixed(1)}%) — SCA 30% 증가 권장`
    );
  }

  if (input.T_in_C < 130 && input.ep_type === "dry") {
    warnings.push("EP 운전온도 130°C 미만 — 산노점 응축 위험");
  }

  return {
    SCA_s_per_m: SCA,
    A_total_m2: A_total,
    field_count,
    drift_velocity_m_s: w,
    voltage_kV,
    current_density_mA_m2,
    conditioning: corr.conditioning,
    efficiency_modified: η_modified,
    warnings,
  };
}
