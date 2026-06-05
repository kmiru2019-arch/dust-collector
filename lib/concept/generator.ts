// Concept Generator — Brief → 2~3안 자동생성

import type { Brief, Concept, ConceptSet, ConceptStage } from "./types";
import type { TreatmentType, CollectorPrimary, MediaCode, CondenserType, FanArrangement } from "@/lib/calc/dust/types";
import { INDUSTRIES } from "@/lib/data/dust/industries";
import {
  TREATMENT_PERFORMANCE, estimateCapex, estimateOpex, buildTradeoff, scoreConcept,
} from "./rules";

/**
 * 산업·조건 → 후보 처리방식 결정
 */
function candidateTreatments(brief: Brief): TreatmentType[] {
  const p = INDUSTRIES[brief.industry];
  const conc = brief.inlet_conc_g_Nm3 ?? p?.typical_conc_g_m3 ?? 5;
  const T = brief.T_in_C;
  const gas = p?.typical_gas ?? {};
  const flammable = p?.typical_dust.flammable ?? false;
  const isMSW = brief.industry === "msw_incineration" || brief.industry === "hazardous_waste_incineration";
  const acidic = (gas.HCl_ppm ?? 0) > 50 || (gas.SO2_ppm ?? 0) > 100;
  const hasHgDioxin = (gas.Hg_ug_Nm3 ?? 0) > 10 || (gas.PCDD_ng_TEQ_Nm3 ?? 0) > 0.05;

  const set = new Set<TreatmentType>();

  // 소각·산성·Hg → 반건식 우선
  if (isMSW || hasHgDioxin) {
    set.add("semi-dry+SDA+AC");
  } else if (acidic) {
    set.add("semi-dry+SDA");
  }

  // 폭발성 → 건식+방폭
  if (flammable) {
    set.add("dry+explosion_protection");
  }

  // 고온 → 냉각 후 건식
  if (T > 400 && !isMSW) {
    set.add("dry+precool");
  }

  // 습식 (항상 후보 — 산성/점착 대안)
  if (acidic || (p?.typical_dust.name?.includes("미스트"))) {
    set.add("wet");
  }

  // 일반 건식 (항상 후보)
  if (!isMSW) {
    set.add("dry");
  }

  // 최소 2개 보장
  if (set.size < 2) {
    set.add("dry");
    set.add("wet");
  }

  // 최대 3개로 제한 (대표성)
  return Array.from(set).slice(0, 3);
}

/**
 * 처리방식 → 라인업 구성
 */
function buildStages(treatment: TreatmentType, brief: Brief): ConceptStage {
  const T = brief.T_in_C;
  let primary: CollectorPrimary = "bag_filter";
  let secondary: CollectorPrimary | undefined;
  let media: MediaCode | undefined;
  let condenser: CondenserType | null = null;
  let pretreatment: string | undefined;
  let reagent: string | undefined;
  let fan: FanArrangement = "1_ID";

  // 온도 → 여재
  if (T > 240) media = "PTFE";
  else if (T > 200) media = "P84";
  else if (T > 130) media = "Nomex";
  else media = "PE";

  // 냉각 필요
  if (T > 300) {
    condenser = T > 800 ? "direct_quench" : "shell_tube_WHB";
    pretreatment = condenser === "direct_quench" ? "quench" : "boiler_HX";
  }

  switch (treatment) {
    case "dry":
      primary = "bag_filter";
      break;
    case "dry+explosion_protection":
      primary = "cyclone"; secondary = "bag_filter"; media = "PE";
      break;
    case "dry+precool":
      primary = "bag_filter";
      condenser = condenser ?? "shell_tube_WHB";
      break;
    case "wet":
    case "wet+quench":
      primary = "scrubber"; pretreatment = "quench"; condenser = "direct_quench";
      break;
    case "wet+FGD":
      primary = "scrubber"; pretreatment = "GGH"; condenser = "GGH_regenerative";
      break;
    case "semi-dry":
    case "semi-dry+SDA":
      primary = "scrubber"; secondary = "bag_filter"; media = "PTFE";
      reagent = "Ca(OH)₂ (SDA)";
      condenser = "shell_tube_WHB"; pretreatment = "boiler_HX";
      break;
    case "semi-dry+SDA+AC":
      primary = "scrubber"; secondary = "bag_filter"; media = "PTFE";
      reagent = "Ca(OH)₂ (SDA) + 활성탄 (Hg/Dioxin)";
      condenser = "shell_tube_WHB"; pretreatment = "boiler_HX";
      break;
  }

  // 대용량/SDA → FD+ID
  const Q = brief.flowrate_Nm3h / 60;
  if (Q > 50000 || treatment.startsWith("semi-dry") || treatment === "wet+FGD") {
    fan = "FD+ID_balanced";
  }

  return { pretreatment, primary, secondary, reagent, collector_media: media, condenser, fan_arrangement: fan };
}

const TREATMENT_LABELS: Record<string, string> = {
  dry: "건식 백필터 단독",
  "dry+explosion_protection": "건식 사이클론+백필터 (방폭)",
  "dry+precool": "건식 냉각+백필터",
  wet: "습식 벤추리 스크러버",
  "wet+quench": "습식 Quench+벤추리",
  "wet+FGD": "습식 FGD (석회석-석고)",
  "semi-dry": "반건식 SDA+백필터",
  "semi-dry+SDA": "반건식 SDA+백필터",
  "semi-dry+SDA+AC": "반건식 SDA+활성탄+백필터",
};

export function generateConcepts(brief: Brief): ConceptSet {
  const Q_m3min = brief.flowrate_Nm3h / 60;
  const treatments = candidateTreatments(brief);

  const concepts: Concept[] = treatments.map((treatment) => {
    const stages = buildStages(treatment, brief);
    const perf = TREATMENT_PERFORMANCE[treatment] ?? TREATMENT_PERFORMANCE.dry;
    const capex = estimateCapex(Q_m3min, treatment);
    const opex = estimateOpex(Q_m3min, treatment, brief.op_hours_yr, capex);
    const tco5 = capex + opex * 5;
    const tradeoff = buildTradeoff(treatment, brief);
    const feasible = !(tradeoff.fatal && tradeoff.fatal.length > 0);

    const c: Concept = {
      id: `concept_${treatment.replace(/[+]/g, "_")}`,
      treatment,
      label: TREATMENT_LABELS[treatment] ?? treatment,
      stages,
      performance: {
        efficiency_PM: perf.PM,
        efficiency_PM25: perf.PM25,
        removal_HCl: perf.HCl,
        removal_SO2: perf.SO2,
        removal_Hg: perf.Hg,
        removal_dioxin: perf.dioxin,
      },
      cost: { capex_won: capex, opex_won_yr: opex, tco_5yr_won: tco5 },
      tradeoff,
      feasible,
      rejection_reason: feasible ? undefined : tradeoff.fatal?.[0],
      score: 0,
      confidence: 0.9,
    };
    c.score = scoreConcept(c, brief);
    return c;
  });

  // 점수 순 정렬 + 순위
  concepts.sort((a, b) => b.score - a.score);
  concepts.forEach((c, i) => { c.rank = i + 1; });

  const recommended = concepts.find((c) => c.feasible) ?? concepts[0];

  // 추천 근거
  const rationale = recommended.feasible
    ? `${recommended.label} — ${recommended.tradeoff.pros[0] ?? "조건 만족"}. ` +
      `효율 PM ${(recommended.performance.efficiency_PM * 100).toFixed(1)}%, ` +
      `5년 TCO ${(recommended.cost.tco_5yr_won / 1e8).toFixed(0)}억원. ` +
      (brief.constraints.no_wastewater && !recommended.treatment.includes("wet") ? "폐수 無 제약 만족." : "")
    : "모든 안이 제약 위배 — 전문가 검토 필요";

  return {
    brief,
    concepts,
    recommended_id: recommended.id,
    recommendation_rationale: rationale,
  };
}
