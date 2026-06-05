import { describe, it, expect } from "vitest";
import { runStage6 } from "../06-condenser";
import type { Stage1Output, Stage3Output } from "../types";

function mockS1(over: any = {}): Stage1Output {
  return {
    dust: {
      industry: "generic", dust_name: "test", d50_um: 10,
      particle_density_kg_m3: 2200, stickiness: "low",
      flammable: false, corrosive: "none",
      ...over.dust,
    },
    gas: {
      T_in_C: 200, P_in_kPa: 101.325, RH_in_pct: 30, O2_pct: 8,
      H2O_vol_pct: 8, SO3_ppm: 5,
      ...over.gas,
    },
    derived: {
      ST_class: null,
      resistivity_estimate: { low_Ohm_cm: 1e7, high_Ohm_cm: 1e9 },
      dewpoint_acid_C: -999, dewpoint_water_C: 14,
      treatment_candidates: [],
    },
  };
}

const mockS3: Stage3Output = {
  branches: [],
  total: { Q_total_m3min: 1000, dP_duct_Pa: 500, V_min_m_s: 18, V_max_m_s: 20 },
  warnings: [],
};

describe("Stage 6 — Condenser", () => {
  it("일반 보일러 350°C + 백필터 PE → 냉각 필요", () => {
    const r = runStage6(
      { has_waste_heat_use: true, fuel_type: "oil", downstream_collector_type: "bag", downstream_media: "PE" },
      mockS1({ gas: { T_in_C: 350 } }),
      mockS3
    );
    expect(r.type).not.toBeNull();
    expect(r.T_target_C).toBeLessThan(200);
    expect(r.waste_heat_kW).toBeGreaterThan(0);
  });

  it("MSW 800°C → Quench", () => {
    const r = runStage6(
      { fuel_type: "msw", downstream_collector_type: "bag", downstream_media: "PTFE" },
      mockS1({ gas: { T_in_C: 800, H2O_vol_pct: 18, HCl_ppm: 800 } }),
      mockS3
    );
    expect(r.type).toBe("shell_tube_WHB");  // MSW > 400°C 분기
  });

  it("점착성 분진 → Direct Quench", () => {
    const r = runStage6(
      {},
      mockS1({ dust: { stickiness: "high" }, gas: { T_in_C: 400 } }),
      mockS3
    );
    expect(r.type).toBe("direct_quench");
  });

  it("저온 (T_in 100, target 90) → 냉각 불필요", () => {
    const r = runStage6(
      { downstream_collector_type: "bag", downstream_media: "PE" },
      mockS1({ gas: { T_in_C: 100 } }),
      mockS3
    );
    // T_target = max(130-30, dewpoint+20) = 100, T_in=100 → 차이 0 → null
    expect(r.type).toBeNull();
  });

  it("산성가스 + 저온목표 → 노점 경고", () => {
    const r = runStage6(
      { T_target_C: 100, downstream_collector_type: "bag", downstream_media: "PE" },
      mockS1({ gas: { T_in_C: 250, H2O_vol_pct: 10, SO3_ppm: 20 } }),
      mockS3
    );
    expect(r.T_dewpoint_acid_C).toBeGreaterThan(100);
    expect(r.warnings.some(w => w.includes("산응축"))).toBe(true);
  });

  it("ROI 계산 — 폐열활용 시", () => {
    const r = runStage6(
      { has_waste_heat_use: true, op_hours_yr: 8000, R_kWh_won: 100 },
      mockS1({ gas: { T_in_C: 400 } }),
      mockS3
    );
    if (r.type) {
      expect(r.ROI_yr).toBeDefined();
      expect(r.ROI_yr).toBeGreaterThan(0);
    }
  });

  it("Hastelloy 추천 — 노점 마진 부족", () => {
    const r = runStage6(
      { T_target_C: 130, downstream_collector_type: "bag", downstream_media: "PE" },
      mockS1({ gas: { T_in_C: 250, H2O_vol_pct: 12, SO3_ppm: 30 } }),
      mockS3
    );
    expect(r.material_recommendation).toContain("Hastelloy");
  });
});
