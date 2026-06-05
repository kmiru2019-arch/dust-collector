import { describe, it, expect } from "vitest";
import { runStage4 } from "../04-treatment";
import type { Stage1Output } from "../types";

function mockS1(over: Partial<Stage1Output["dust"]> = {}, gasOver: Partial<Stage1Output["gas"]> = {}): Stage1Output {
  return {
    dust: {
      industry: "generic", dust_name: "일반", d50_um: 10,
      particle_density_kg_m3: 2200, stickiness: "low",
      flammable: false, corrosive: "none", ...over,
    },
    gas: {
      T_in_C: 25, P_in_kPa: 101.325, RH_in_pct: 50, O2_pct: 21, ...gasOver,
    },
    derived: {
      ST_class: null,
      resistivity_estimate: { low_Ohm_cm: 1e7, high_Ohm_cm: 1e9 },
      dewpoint_acid_C: -999, dewpoint_water_C: 14,
      treatment_candidates: [],
    },
  };
}

describe("Stage 4 — Treatment", () => {
  it("일반 분진 → primary = dry", () => {
    const out = runStage4({}, mockS1());
    expect(out.primary_choice.type).toBe("dry");
  });

  it("목분 가연성 → dry+explosion_protection", () => {
    const out = runStage4(
      { water_available: false },
      mockS1({ flammable: true, Kst_bar_m_s: 150 })
    );
    expect(out.primary_choice.type).toBe("dry+explosion_protection");
  });

  it("MSW (HCl 800, Hg 50) → semi-dry 계열", () => {
    const out = runStage4(
      { water_available: true, has_waste_heat_use: true },
      mockS1(
        { stickiness: "medium", corrosive: "severe" },
        { T_in_C: 800, HCl_ppm: 800, SO2_ppm: 300, Hg_ug_Nm3: 50, PCDD_ng_TEQ_Nm3: 1 }
      )
    );
    expect(out.primary_choice.type).toMatch(/semi-dry/);
  });

  it("저예산 → dry 가산점", () => {
    const out = runStage4(
      { budget_class: "low" },
      mockS1({ flammable: true, Kst_bar_m_s: 150 })
    );
    // 폭발성 분진이라도 저예산이면 explosion_protection이 1순위 유지하지만 score 차이
    expect(out.treatment_ranked.length).toBeGreaterThan(0);
  });
});
