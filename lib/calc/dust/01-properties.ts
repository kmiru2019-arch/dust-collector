// Stage 1 — 분진/가스 성상 분석

import type {
  Stage1Input, Stage1Output, STClass,
  TreatmentCandidate, GasProperties, DustProperties,
} from "./types";

// ──────────────────────────────────────────────
// Pure functions
// ──────────────────────────────────────────────

/**
 * KOSHA D-13 ST 등급 분류
 *  Kst ≤ 0   → ST0
 *  Kst ≤ 200 → ST1
 *  Kst ≤ 300 → ST2
 *  Kst > 300 → ST3
 */
export function classifyST(Kst: number | undefined, flammable: boolean): STClass | null {
  if (!flammable) return null;
  if (Kst == null) return "ST1"; // 가연성이지만 미실측 → 보수적 ST1
  if (Kst <= 0) return "ST0";
  if (Kst <= 200) return "ST1";
  if (Kst <= 300) return "ST2";
  return "ST3";
}

/**
 * Verhoff-Banchero (Pierce 1977) 황산 노점 식
 * 1000/T_dp[K] = 2.276 - 0.0294·ln(P_H2O[mmHg]) - 0.0858·ln(P_H2SO4[mmHg])
 *                + 0.0062·ln(P_H2O[mmHg]) × ln(P_H2SO4[mmHg])
 *
 * 주의: 원논문은 P 단위 mmHg 사용. atm → mmHg 자동 변환.
 *
 * @param P_H2O_atm  수증기 분압 (atm)
 * @param P_H2SO4_atm  황산 분압 (atm) — H2SO4는 SO3와 H2O로부터 (실용상 SO3 분압 대용)
 * @returns T_dp (°C)
 */
export function verhoffBanchero(P_H2O_atm: number, P_H2SO4_atm: number): number {
  if (P_H2O_atm <= 0 || P_H2SO4_atm <= 0) return -999;
  // atm → mmHg
  const P_H2O_mmHg = P_H2O_atm * 760;
  const P_H2SO4_mmHg = P_H2SO4_atm * 760;
  const ln_H2O = Math.log(P_H2O_mmHg);
  const ln_H2SO4 = Math.log(P_H2SO4_mmHg);
  const inv_T =
    2.276 -
    0.0294 * ln_H2O -
    0.0858 * ln_H2SO4 +
    0.0062 * ln_H2O * ln_H2SO4;
  return 1000 / inv_T - 273.15;
}

/**
 * Magnus-Tetens 식 — 수증기 노점
 * @param T_C  현재 온도 (°C)
 * @param RH_pct  상대습도 (%)
 * @returns 노점 (°C)
 */
export function waterDewpoint(T_C: number, RH_pct: number): number {
  if (RH_pct <= 0) return -100;
  const a = 17.625;
  const b = 243.04;
  const γ = Math.log(RH_pct / 100) + (a * T_C) / (b + T_C);
  return (b * γ) / (a - γ);
}

/**
 * 분진 비저항 추정 (DB 미지정 시 기본 영역)
 * 실제 설계는 분진 실측 권장
 */
export function estimateResistivity(industry: string, T_C: number): { low_Ohm_cm: number; high_Ohm_cm: number } {
  // 매우 단순 매핑 — 실제로는 dust-types DB lookup
  const map: Record<string, [number, number]> = {
    cement_kiln:        [1e10, 1e12],
    coal_power:         [1e8, 1e11],
    msw_incineration:   [1e9, 1e11],
    iron_eaf:           [1e6, 1e9],
    woodworking:        [1e3, 1e6],
    welding_fume:       [1e2, 1e5],
    grain_handling:     [1e7, 1e10],
    chemical_mist:      [1e4, 1e7],
    glass_furnace:      [1e9, 1e11],
    asphalt_plant:      [1e8, 1e10],
  };
  const range = map[industry] ?? [1e7, 1e9];
  // 온도 보정 (Bickelhaupt 단순화: log ρ ∝ 1/T)
  const factor = Math.exp(1500 / (T_C + 273.15) - 1500 / 298.15);
  return { low_Ohm_cm: range[0] * factor, high_Ohm_cm: range[1] * factor };
}

/**
 * 처리방식 후보 결정 (스코어링)
 */
export function rankTreatments(
  dust: DustProperties,
  gas: GasProperties,
  context: { water_available: boolean; has_waste_heat_use: boolean }
): TreatmentCandidate[] {
  const candidates: TreatmentCandidate[] = [];

  // 폭발성
  if (dust.flammable && (dust.Kst_bar_m_s ?? 0) > 0) {
    candidates.push({
      type: "dry+explosion_protection",
      score: 0.85,
      reason: `폭발성 분진 (ST ${classifyST(dust.Kst_bar_m_s, true)}) — Cyclone+Bag+ATEX+벤트`,
    });
    if (context.water_available) {
      candidates.push({
        type: "wet",
        score: 0.6,
        reason: "가연성 회피용 습식 (점화원 제거)",
      });
    }
  }

  // 점착성/타르
  if (dust.stickiness === "high" || dust.tar) {
    candidates.push({ type: "wet", score: 0.9, reason: "점착성 분진 — 습식세정" });
    candidates.push({ type: "semi-dry", score: 0.5, reason: "반건식 SDA 분무 후 백필터" });
  }

  // 산성가스
  const HCl = gas.HCl_ppm ?? 0;
  const SO2 = gas.SO2_ppm ?? 0;
  if (HCl > 50) {
    candidates.push({
      type: "semi-dry+SDA",
      score: 0.95,
      reason: `HCl ${HCl} ppm — SDA 중화`,
    });
    candidates.push({ type: "wet", score: 0.8, reason: "습식 흡수 (대안)" });
  }
  if (SO2 > 100) {
    candidates.push({
      type: "wet+FGD",
      score: 0.85,
      reason: `SO₂ ${SO2} ppm — 습식 FGD`,
    });
    candidates.push({
      type: "semi-dry+SDA",
      score: 0.85,
      reason: "반건식 SDA + 백",
    });
  }

  // 다이옥신·Hg (소각)
  if ((gas.PCDD_ng_TEQ_Nm3 ?? 0) > 0.05 || (gas.Hg_ug_Nm3 ?? 0) > 10) {
    candidates.push({
      type: "semi-dry+SDA+AC",
      score: 0.95,
      reason: "다이옥신·Hg 흡착 — SDA+AC+Bag",
    });
  }

  // 고온
  if (gas.T_in_C > 800) {
    candidates.push({
      type: "wet+quench",
      score: 0.9,
      reason: `T ${gas.T_in_C}°C — 직접 quench`,
    });
  } else if (gas.T_in_C > 400) {
    candidates.push({
      type: "dry+precool",
      score: 0.8,
      reason: `T ${gas.T_in_C}°C — HX 냉각 후 건식`,
    });
  }

  // 디폴트 (일반)
  if (candidates.length === 0 || candidates.every((c) => c.score < 0.7)) {
    candidates.push({
      type: "dry",
      score: 0.95,
      reason: "표준 건식 백필터",
    });
  }

  // 정렬·중복제거
  return dedupeAndSort(candidates);
}

function dedupeAndSort(arr: TreatmentCandidate[]): TreatmentCandidate[] {
  const map = new Map<string, TreatmentCandidate>();
  for (const c of arr) {
    const existing = map.get(c.type);
    if (!existing || c.score > existing.score) {
      map.set(c.type, c);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

// ──────────────────────────────────────────────
// 통합 함수
// ──────────────────────────────────────────────

export function runStage1(input: Stage1Input, context?: { water_available?: boolean; has_waste_heat_use?: boolean }): Stage1Output {
  const ctx = {
    water_available: context?.water_available ?? true,
    has_waste_heat_use: context?.has_waste_heat_use ?? false,
  };

  const ST_class = classifyST(input.dust.Kst_bar_m_s, input.dust.flammable);
  const resistivity = estimateResistivity(input.dust.industry, input.gas.T_in_C);

  const P_H2O_atm = (input.gas.H2O_vol_pct ?? 8) / 100;
  const P_SO3_atm = (input.gas.SO3_ppm ?? 0) * 1e-6;
  const dewpoint_acid_C = P_SO3_atm > 0 ? verhoffBanchero(P_H2O_atm, P_SO3_atm) : -999;
  const dewpoint_water_C = waterDewpoint(input.gas.T_in_C, input.gas.RH_in_pct);

  const treatment_candidates = rankTreatments(input.dust, input.gas, ctx);

  return {
    dust: input.dust,
    gas: input.gas,
    derived: {
      ST_class,
      resistivity_estimate: resistivity,
      dewpoint_acid_C,
      dewpoint_water_C,
      treatment_candidates,
    },
  };
}
