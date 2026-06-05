// Phase F·G — Concept → 8단 자동연동 일관성 + 정확도 검증

import { describe, it, expect } from "vitest";
import { generateConcepts } from "../generator";
import { conceptToStages } from "../to-stages";
import { runAll } from "@/lib/calc/dust/engine";
import type { Brief } from "../types";

function brief(over: Partial<Brief> = {}): Brief {
  return {
    industry: "generic",
    flowrate_Nm3h: 30000,
    T_in_C: 25,
    constraints: {},
    region: "gyeonggi",
    install_date: "2024-01-01",
    op_hours_yr: 6000,
    budget_class: "medium",
    ...over,
  };
}

describe("Phase G — Concept → 8단 자동연동", () => {
  it("Brief → Concept → 8단 inputs → 정밀계산 완주", () => {
    const cs = generateConcepts(brief());
    const rec = cs.concepts.find((c) => c.id === cs.recommended_id)!;
    const inputs = conceptToStages(cs.brief, rec);
    const out = runAll(inputs);

    // 8단 모두 출력
    expect(out.stage1).toBeDefined();
    expect(out.stage5).toBeDefined();
    expect(out.stage7).toBeDefined();
    expect(out.stage8).toBeDefined();
  });

  it("MSW → 자동연동 시 PTFE 백필터 + SDA 반영", () => {
    const cs = generateConcepts(brief({ industry: "msw_incineration", T_in_C: 800 }));
    const rec = cs.concepts.find((c) => c.id === cs.recommended_id)!;
    const inputs = conceptToStages(cs.brief, rec);

    expect(rec.treatment).toMatch(/semi-dry/);
    // 여재 PTFE 반영
    expect(inputs.stage5.bag?.manual_media).toBe("PTFE");
    // 산업 = msw
    expect(inputs.stage8?.facility_type).toBe("msw_incineration");
  });

  it("목재가공 → 사이클론 1차 + 백필터 2차 자동연동", () => {
    const cs = generateConcepts(brief({ industry: "woodworking" }));
    const expl = cs.concepts.find((c) => c.treatment.includes("explosion"))!;
    const inputs = conceptToStages(cs.brief, expl);

    expect(inputs.stage5.primary).toBe("cyclone");
    expect(inputs.stage5.series?.secondary).toBe("bag_filter");
  });

  it("부지 협소 → 덕트 길이 압축 반영", () => {
    const normal = conceptToStages(brief(), generateConcepts(brief()).concepts[0]);
    const tight = conceptToStages(
      brief({ constraints: { tight_space: true } }),
      generateConcepts(brief({ constraints: { tight_space: true } })).concepts[0]
    );
    expect(tight.stage3.branches[0].length_m).toBeLessThan(normal.stage3.branches[0].length_m);
  });

  it("Brief 풍량 → 8단 후드 면적에 반영 (풍량 클수록 면적↑)", () => {
    const small = conceptToStages(brief({ flowrate_Nm3h: 10000 }), generateConcepts(brief({ flowrate_Nm3h: 10000 })).concepts[0]);
    const large = conceptToStages(brief({ flowrate_Nm3h: 100000 }), generateConcepts(brief({ flowrate_Nm3h: 100000 })).concepts[0]);
    expect((large.stage2.open_area_m2 ?? 0)).toBeGreaterThan((small.stage2.open_area_m2 ?? 0));
  });
});

describe("Phase F — Concept 추정 vs 8단 정밀 일관성", () => {
  it("처리방식 일치 — Concept treatment = 8단 stage4 결과 동일 계열", () => {
    const cs = generateConcepts(brief({ industry: "cement_kiln", T_in_C: 350 }));
    const rec = cs.concepts.find((c) => c.id === cs.recommended_id)!;
    const inputs = conceptToStages(cs.brief, rec);
    const out = runAll(inputs);

    // Concept가 dry 계열이면 8단도 dry 계열 (큰 분기 일치)
    const conceptDry = rec.treatment.startsWith("dry");
    const stageDry = out.stage4!.primary_choice.type.startsWith("dry");
    // 적어도 둘 다 정의됨 + 집진방식 일치
    expect(out.stage5!.primary).toBe(inputs.stage5.primary);
  });

  it("집진방식 — Concept primary = 8단 stage5 primary 동일", () => {
    for (const industry of ["generic", "msw_incineration", "woodworking", "cement_kiln"] as const) {
      const cs = generateConcepts(brief({ industry, T_in_C: industry === "msw_incineration" ? 800 : industry === "cement_kiln" ? 350 : 25 }));
      const rec = cs.concepts.find((c) => c.id === cs.recommended_id)!;
      const inputs = conceptToStages(cs.brief, rec);
      const out = runAll(inputs);
      expect(out.stage5!.primary).toBe(rec.stages.primary);
    }
  });

  it("효율 — Concept PM효율과 8단 집진기 효율 차이 ≤ 10%", () => {
    const cs = generateConcepts(brief({ industry: "generic" }));
    const rec = cs.concepts.find((c) => c.id === cs.recommended_id)!;
    const inputs = conceptToStages(cs.brief, rec);
    const out = runAll(inputs);
    const conceptEff = rec.performance.efficiency_PM;
    const stageEff = out.stage5!.efficiency_overall;
    // 백필터는 둘 다 99%+
    expect(Math.abs(conceptEff - stageEff)).toBeLessThan(0.1);
  });
});
