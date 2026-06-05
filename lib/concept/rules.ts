// Concept 생성 룰셋 — 트레이드오프·법규·리스크 자동 분석

import type { Brief, Concept, ConceptTradeoff } from "./types";
import type { TreatmentType } from "@/lib/calc/dust/types";
import { INDUSTRIES } from "@/lib/data/dust/industries";

/**
 * 처리방식별 기본 효율 (PM + 가스)
 */
export const TREATMENT_PERFORMANCE: Record<string, {
  PM: number; PM25: number; HCl: number; SO2: number; Hg: number; dioxin: number;
}> = {
  dry:                       { PM: 0.999, PM25: 0.995, HCl: 0,    SO2: 0,    Hg: 0,    dioxin: 0 },
  "dry+explosion_protection":{ PM: 0.999, PM25: 0.995, HCl: 0,    SO2: 0,    Hg: 0,    dioxin: 0 },
  "dry+precool":             { PM: 0.999, PM25: 0.995, HCl: 0,    SO2: 0,    Hg: 0,    dioxin: 0 },
  wet:                       { PM: 0.99,  PM25: 0.95,  HCl: 0.99, SO2: 0.90, Hg: 0.60, dioxin: 0.30 },
  "wet+quench":              { PM: 0.99,  PM25: 0.95,  HCl: 0.99, SO2: 0.90, Hg: 0.60, dioxin: 0.30 },
  "wet+FGD":                 { PM: 0.99,  PM25: 0.96,  HCl: 0.99, SO2: 0.98, Hg: 0.70, dioxin: 0.30 },
  "semi-dry":                { PM: 0.999, PM25: 0.99,  HCl: 0.95, SO2: 0.90, Hg: 0.50, dioxin: 0.60 },
  "semi-dry+SDA":            { PM: 0.999, PM25: 0.99,  HCl: 0.99, SO2: 0.95, Hg: 0.50, dioxin: 0.70 },
  "semi-dry+SDA+AC":         { PM: 0.999, PM25: 0.995, HCl: 0.99, SO2: 0.95, Hg: 0.85, dioxin: 0.95 },
};

/**
 * CAPEX 상대계수 (풍량 기준 베이스 × 처리방식 배율)
 * 턴키 기준 (장비+덕트+송풍기+계장+시공). 한국 시장 ±30%.
 * base ≈ 5억원 per 1000 m³/min (건식 백필터 turnkey), 규모 0.7승
 */
export function estimateCapex(Q_m3min: number, treatment: TreatmentType): number {
  const base = 500_000_000 * Math.pow(Q_m3min / 1000, 0.7);
  const multiplier: Record<string, number> = {
    dry: 1.0,
    "dry+explosion_protection": 1.3,
    "dry+precool": 1.5,
    wet: 1.2,
    "wet+quench": 1.3,
    "wet+FGD": 2.5,
    "semi-dry": 1.8,
    "semi-dry+SDA": 2.0,
    "semi-dry+SDA+AC": 2.2,
  };
  return Math.round(base * (multiplier[treatment] ?? 1.0));
}

/**
 * OPEX 연간 (전력 + 소모품 + 폐수/슬러지)
 */
export function estimateOpex(Q_m3min: number, treatment: TreatmentType, op_hours: number, capex: number): number {
  // 전력비 (간이: Q × ΔP × 시간)
  const dP_typ: Record<string, number> = {
    dry: 150, "dry+explosion_protection": 160, "dry+precool": 180,
    wet: 400, "wet+quench": 450, "wet+FGD": 500,
    "semi-dry": 250, "semi-dry+SDA": 280, "semi-dry+SDA+AC": 300,
  };
  const dP = (dP_typ[treatment] ?? 150) * 9.81; // mmAq → Pa
  const kW = (Q_m3min / 60) * dP / (1000 * 0.75 * 0.94);
  const power_won = kW * op_hours * 0.7 * 100; // 부하율 0.7, 100원/kWh

  // 소모품·폐기물
  let consumables = capex * 0.02; // 기본 유지보수 2%
  if (treatment.includes("wet")) consumables += capex * 0.04; // 폐수처리
  if (treatment.includes("SDA")) consumables += capex * 0.05; // 소석회+슬러지
  if (treatment.includes("AC")) consumables += capex * 0.03; // 활성탄

  return Math.round(power_won + consumables);
}

/**
 * 트레이드오프 자동 생성
 */
export function buildTradeoff(treatment: TreatmentType, brief: Brief): ConceptTradeoff {
  const t: ConceptTradeoff = { pros: [], cons: [], regulatory: [] };
  const isMSW = brief.industry === "msw_incineration" || brief.industry === "hazardous_waste_incineration";

  // 처리방식별
  if (treatment.startsWith("dry")) {
    t.pros.push("운영비 최저 (폐수 無, 약품 無)");
    t.pros.push("구조 단순 — 유지보수 용이");
    if (!treatment.includes("explosion")) {
      t.cons.push("산성가스(HCl/SO₂) 처리 불가 — 별도 후단 필요 시 검토");
    }
    if (treatment.includes("explosion_protection")) {
      t.pros.push("폭발성 분진 안전 (사이클론 1차 격리 + 방폭벤트)");
      t.regulatory.push("KOSHA D-43 분진폭발 방지 + ATEX/IECEx 인증 권장");
    }
  }
  if (treatment.startsWith("wet")) {
    t.pros.push("산성가스·미스트 동시 처리");
    t.pros.push("점착성·고온 분진 대응 우수");
    t.cons.push(`폐수 발생 — 처리시설 + 운영비 증가`);
    if (brief.constraints.no_wastewater) {
      t.fatal = t.fatal ?? [];
      t.fatal.push("폐수 발생 — 사용자 '폐수 불가' 제약 위배");
    }
    t.cons.push("부식 — FRP/SUS316L 재질 필수 (CAPEX↑)");
    t.regulatory.push("폐수 방류 → 물환경보전법 수질기준 적용");
  }
  if (treatment.startsWith("semi-dry")) {
    t.pros.push("폐수 無 (반건식 핵심) — 잔수 즉시 증발");
    t.pros.push("산성가스 + 다이옥신 + Hg 동시 처리 (소각 표준)");
    t.cons.push("SDA 슬러지 발생 → 매립/재활용 비용");
    t.cons.push("소석회·활성탄 소모품 연간 비용");
    t.cons.push("노점 회피 설계 필수 (출구온도 + 시동 보조히터)");
    if (treatment.includes("AC")) {
      t.regulatory.push("활성탄으로 다이옥신·Hg 동시 제거 (잔류성유기오염물질관리법)");
    }
  }

  // 소각 법규
  if (isMSW) {
    t.regulatory.push("폐기물관리법: 집진+산성가스+NOx+다이옥신 4단 의무");
    t.regulatory.push("다이옥신 0.1 ng-TEQ/Sm³ (≥2t/h)");
    t.regulatory.push("TMS 굴뚝자동측정 의무");
    if (treatment.startsWith("dry") && !treatment.includes("SDA")) {
      t.fatal = t.fatal ?? [];
      t.fatal.push("소각시설 — 건식 단독은 산성가스·다이옥신 미처리로 법규 위배");
    }
  }

  // 부지 제약
  if (brief.constraints.tight_space && treatment.startsWith("semi-dry")) {
    t.cons.push("SDA 흡수탑 높이 부담 — 부지 협소 시 배치 검토 필요");
  }

  return t;
}

/**
 * 종합 점수 (0~100) — 효율·비용·법규·제약
 */
export function scoreConcept(c: Concept, brief: Brief): number {
  // 제약 위배·치명 = 0
  if (!c.feasible) return 0;
  if (c.tradeoff.fatal && c.tradeoff.fatal.length > 0) return 0;

  let score = 50;

  // PM 효율 가중
  const targetEff = (brief.target_emission_mg_Sm3 ?? 30) <= 10 ? 0.999 : 0.99;
  if (c.performance.efficiency_PM >= targetEff) score += 15;
  else score -= 20;

  // ── 가스 처리 요구도 충족 (핵심) ──
  const p = INDUSTRIES[brief.industry];
  const gas = p?.typical_gas ?? {};
  const isIncin = brief.industry.includes("incineration");
  const needDioxin = isIncin || (gas.PCDD_ng_TEQ_Nm3 ?? 0) > 0.05;
  const needHg = (gas.Hg_ug_Nm3 ?? 0) > 10;
  const needAcid = (gas.HCl_ppm ?? 0) > 50 || (gas.SO2_ppm ?? 0) > 100;

  if (needDioxin && (c.performance.removal_dioxin ?? 0) < 0.9) score -= 30;
  else if (needDioxin) score += 15;
  if (needHg && (c.performance.removal_Hg ?? 0) < 0.7) score -= 20;
  if (needAcid && (c.performance.removal_HCl ?? 0) < 0.9) score -= 25;
  else if (needAcid) score += 10;

  // 폐수 제약 만족
  if (brief.constraints.no_wastewater && !c.treatment.includes("wet")) score += 10;

  // 트레이드오프 균형
  score += Math.min(12, c.tradeoff.pros.length * 4);
  score -= Math.min(8, c.tradeoff.cons.length * 1.5);

  return Math.max(0, Math.min(100, score));
}
