import { describe, it, expect } from "vitest";
import { generateConcepts } from "../generator";
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

describe("Concept Generator", () => {
  it("일반산업 → 2~3안 생성, 건식 추천", () => {
    const cs = generateConcepts(brief());
    expect(cs.concepts.length).toBeGreaterThanOrEqual(2);
    expect(cs.concepts.length).toBeLessThanOrEqual(3);
    const rec = cs.concepts.find((c) => c.id === cs.recommended_id);
    expect(rec?.treatment).toMatch(/dry/);
    expect(rec?.feasible).toBe(true);
  });

  it("MSW 소각 → 반건식 SDA+AC 추천", () => {
    const cs = generateConcepts(brief({ industry: "msw_incineration", T_in_C: 800 }));
    const rec = cs.concepts.find((c) => c.id === cs.recommended_id);
    expect(rec?.treatment).toMatch(/semi-dry/);
    // 건식 단독은 법규 위배로 feasible=false
    const dryOnly = cs.concepts.find((c) => c.treatment === "dry");
    if (dryOnly) expect(dryOnly.feasible).toBe(false);
  });

  it("목재가공 → 건식 방폭 후보 포함", () => {
    const cs = generateConcepts(brief({ industry: "woodworking" }));
    const hasExplosion = cs.concepts.some((c) => c.treatment.includes("explosion"));
    expect(hasExplosion).toBe(true);
  });

  it("폐수 불가 제약 → 습식안 feasible=false", () => {
    const cs = generateConcepts(brief({
      industry: "chemical_mist",
      constraints: { no_wastewater: true },
    }));
    const wet = cs.concepts.find((c) => c.treatment.startsWith("wet"));
    if (wet) {
      expect(wet.feasible).toBe(false);
      expect(wet.rejection_reason).toContain("폐수");
    }
    // 추천은 비습식
    const rec = cs.concepts.find((c) => c.id === cs.recommended_id);
    expect(rec?.treatment.startsWith("wet")).toBe(false);
  });

  it("CAPEX/OPEX/TCO 계산 — 양수, TCO=CAPEX+OPEX×5", () => {
    const cs = generateConcepts(brief({ flowrate_Nm3h: 60000 }));
    for (const c of cs.concepts) {
      expect(c.cost.capex_won).toBeGreaterThan(0);
      expect(c.cost.opex_won_yr).toBeGreaterThan(0);
      expect(c.cost.tco_5yr_won).toBeCloseTo(c.cost.capex_won + c.cost.opex_won_yr * 5, -3);
    }
  });

  it("풍량 클수록 CAPEX 증가", () => {
    const small = generateConcepts(brief({ flowrate_Nm3h: 10000 }));
    const large = generateConcepts(brief({ flowrate_Nm3h: 100000 }));
    const sDry = small.concepts.find((c) => c.treatment === "dry");
    const lDry = large.concepts.find((c) => c.treatment === "dry");
    if (sDry && lDry) {
      expect(lDry.cost.capex_won).toBeGreaterThan(sDry.cost.capex_won);
    }
  });

  it("추천안은 항상 feasible (가능하면)", () => {
    const cs = generateConcepts(brief({ industry: "cement_kiln", T_in_C: 350 }));
    const rec = cs.concepts.find((c) => c.id === cs.recommended_id);
    expect(rec?.feasible).toBe(true);
  });

  it("순위 1~N 부여", () => {
    const cs = generateConcepts(brief());
    const ranks = cs.concepts.map((c) => c.rank).sort();
    expect(ranks[0]).toBe(1);
  });
});
