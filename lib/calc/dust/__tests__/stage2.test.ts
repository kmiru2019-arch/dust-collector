import { describe, it, expect } from "vitest";
import { runStage2, calcHoodFlowrate, airDensity } from "../02-hood";
import type { Stage1Output } from "../types";

const mockS1: Stage1Output = {
  dust: {
    industry: "generic", dust_name: "일반",
    d50_um: 10, particle_density_kg_m3: 2200,
    stickiness: "low", flammable: false, corrosive: "none",
    particulate: true,
  },
  gas: {
    T_in_C: 25, P_in_kPa: 101.325, RH_in_pct: 50, O2_pct: 21,
  },
  derived: {
    ST_class: null,
    resistivity_estimate: { low_Ohm_cm: 1e7, high_Ohm_cm: 1e9 },
    dewpoint_acid_C: -999,
    dewpoint_water_C: 14,
    treatment_candidates: [],
  },
};

describe("Stage 2 — Hood", () => {
  describe("airDensity", () => {
    it("표준 (25°C, 101.325 kPa) ≈ 1.18 kg/m³", () => {
      expect(airDensity(25)).toBeCloseTo(1.184, 2);
    });
    it("고온 (350°C) ≈ 0.566", () => {
      expect(airDensity(350)).toBeCloseTo(0.566, 2);
    });
  });

  describe("calcHoodFlowrate", () => {
    it("포위형 0.5 m² × V_c 0.7 × SF 1.25 = 26.25 m³/min", () => {
      const Q = calcHoodFlowrate(
        { hood_type: "enclosing", open_area_m2: 0.5, safety_factor: 1.25 },
        0.7
      );
      expect(Q).toBeCloseTo(26.25, 1);
    });
    it("캐노피 — P=2, V_c=1.5, H=1 → 252 m³/min", () => {
      const Q = calcHoodFlowrate(
        { hood_type: "canopy", source_perimeter_m: 2, hood_height_H_m: 1.0 },
        1.5
      );
      // 1.4 × 2 × 1.5 × 1 × 60 = 252
      expect(Q).toBeCloseTo(252, 0);
    });
  });

  describe("runStage2", () => {
    it("입자상 + 포위형 → V_c 0.7", () => {
      const out = runStage2(
        { hood_type: "enclosing", open_area_m2: 1.0, safety_factor: 1.25 },
        mockS1
      );
      expect(out.V_c_applied_m_s).toBe(0.7);
      expect(out.Q_hood_m3min).toBeCloseTo(60 * 1.0 * 0.7 * 1.25, 1);
    });

    it("발암성 → V_c 1.5배", () => {
      const out = runStage2(
        { hood_type: "enclosing", open_area_m2: 1.0 },
        { ...mockS1, dust: { ...mockS1.dust, carcinogen: true } }
      );
      expect(out.V_c_applied_m_s).toBeCloseTo(0.7 * 1.5, 2);
    });
  });
});
