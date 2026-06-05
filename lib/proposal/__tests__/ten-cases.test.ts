// 10종 분진·온도·압력 케이스 → 제안 → 최종안 매핑 → 실제 8단 엔진 실행 → 산출 검증
// 선정안의 설비 구성이 상세설계(엔진)에 정확히 반영되는지 확인.

import { describe, it, expect } from "vitest";
import { resolveSpec } from "@/lib/datasheet/autofill";
import { generateProposals } from "@/lib/proposal/generator";
import { mapToStageInputs } from "@/lib/converge/to-stage-inputs";
import { deriveDesignStages } from "@/lib/converge/design-stages";
import { runFromStage } from "@/lib/calc/dust/engine";

interface Case {
  name: string;
  dust_type: string;
  T_in_C: number;
  T_out_C: number;
  pressure_mmAq?: number;
  flow_Nm3h: number;
  inlet_conc_g: number;
  flammable?: "yes" | "no";
  wastewater?: "ok" | "no";
  extra?: Record<string, any>;
}

const CASES: Case[] = [
  { name: "MSW 소각 비산재(고온·산성·다이옥신)", dust_type: "비산재", T_in_C: 850, T_out_C: 160, flow_Nm3h: 50000, inlet_conc_g: 5, wastewater: "ok", extra: { hcl_ppm: 800, so2_ppm: 200, hg_ug: 50, dioxin: 1.5 } },
  { name: "시멘트 킬른(고온·대용량)", dust_type: "시멘트분진", T_in_C: 350, T_out_C: 150, flow_Nm3h: 120000, inlet_conc_g: 30, wastewater: "ok" },
  { name: "석탄화력 비산회(고비저항)", dust_type: "석탄재", T_in_C: 140, T_out_C: 130, flow_Nm3h: 200000, inlet_conc_g: 20, wastewater: "ok", extra: { so2_ppm: 300 } },
  { name: "목공 목분(저온·가연성)", dust_type: "목분", T_in_C: 30, T_out_C: 30, flow_Nm3h: 20000, inlet_conc_g: 3, flammable: "yes" },
  { name: "곡물 분진(가연성·저온)", dust_type: "곡물분진", T_in_C: 25, T_out_C: 25, flow_Nm3h: 15000, inlet_conc_g: 4, flammable: "yes" },
  { name: "용접 흄(미세·저온)", dust_type: "용접흄", T_in_C: 40, T_out_C: 40, flow_Nm3h: 8000, inlet_conc_g: 1, flammable: "no" },
  { name: "비철 제련 납분진(중금속)", dust_type: "납분진", T_in_C: 300, T_out_C: 140, flow_Nm3h: 30000, inlet_conc_g: 8, wastewater: "ok", extra: { pb_mg: 5 } },
  { name: "화학 미스트(점착·습식)", dust_type: "미스트", T_in_C: 80, T_out_C: 60, flow_Nm3h: 12000, inlet_conc_g: 2, wastewater: "ok", extra: { stickiness: "high" } },
  { name: "카본블랙(미세·저온)", dust_type: "카본블랙", T_in_C: 90, T_out_C: 80, flow_Nm3h: 18000, inlet_conc_g: 6, flammable: "no" },
  { name: "아스팔트 플랜트(중온·일반)", dust_type: "석회석분진", T_in_C: 180, T_out_C: 120, flow_Nm3h: 40000, inlet_conc_g: 15, wastewater: "ok" },
];

function baseInput(c: Case) {
  return {
    project_name: c.name, process_source: c.name, region: "gyeonggi", install_date: "2025-01-01",
    flow_Nm3h: c.flow_Nm3h, T_in_C: c.T_in_C, T_out_C: c.T_out_C,
    dust_type: c.dust_type, inlet_conc_g: c.inlet_conc_g, target_emission: 10,
    flammable: c.flammable ?? "no", op_hours_yr: 8000, wastewater: c.wastewater ?? "ok",
    ...(c.pressure_mmAq != null ? { pressure_mmAq: c.pressure_mmAq } : {}),
    ...(c.extra ?? {}),
  };
}

describe("10종 케이스 — 제안→매핑→엔진 일관성", () => {
  for (const c of CASES) {
    it(`${c.name}`, () => {
      const spec = resolveSpec(baseInput(c)).values;
      const ps = generateProposals(spec);
      expect(ps.proposals.length).toBeGreaterThanOrEqual(2);

      const final = ps.proposals.find((p) => p.id === ps.recommendedId)!;
      expect(final).toBeTruthy();
      expect(final.feasible).toBe(true);

      // 상세설계 단계: 항상단계 포함, 1..N 연속
      const stages = deriveDesignStages(final);
      expect(stages.length).toBeGreaterThanOrEqual(3);
      stages.forEach((s, i) => expect(s.no).toBe(i + 1));
      expect(stages[0].title).toContain("성상");
      expect(stages[stages.length - 1].title).toContain("법규");

      // 실제 8단 엔진 실행
      const inputs = mapToStageInputs(final, spec);
      const out = runFromStage(1, inputs, {});

      // 핵심 산출이 합리적 범위
      expect(out.stage5).toBeTruthy();
      expect(out.stage5!.efficiency_overall).toBeGreaterThan(0.9);
      expect(out.stage7!.total_kW).toBeGreaterThan(0);
      expect(out.stage8!.classification).toBeTruthy();

      // 냉각 노드 유무 ↔ stage6.skip / 응축기 형식 일치
      const hasCooling = final.train.some((nd) => nd.id === "HX" || nd.id === "QUENCH");
      expect(inputs.stage6!.skip).toBe(!hasCooling);
      if (!hasCooling) {
        expect(out.stage6!.type).toBeNull();
        expect(out.stage6!.m_condensate_kg_h).toBe(0);
      }

      // 처리방식 ↔ 1차 집진방식 일치
      if (final.treatment.startsWith("wet")) expect(inputs.stage5!.primary).toBe("scrubber");
      else if (final.treatment === "ep") expect(inputs.stage5!.primary).toBe("ep");
      else expect(inputs.stage5!.primary).toBe("bag_filter");
    });
  }
});
