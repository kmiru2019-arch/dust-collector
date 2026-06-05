import { describe, it, expect } from "vitest";
import { runStage3, swameeJain, airViscosity } from "../03-duct";
import type { Stage1Output, Stage2Output } from "../types";

const mockS1: Stage1Output = {
  dust: {
    industry: "generic", dust_name: "일반", d50_um: 10,
    particle_density_kg_m3: 2200, stickiness: "low",
    flammable: false, corrosive: "none",
  },
  gas: { T_in_C: 25, P_in_kPa: 101.325, RH_in_pct: 50, O2_pct: 21 },
  derived: {
    ST_class: null,
    resistivity_estimate: { low_Ohm_cm: 1e7, high_Ohm_cm: 1e9 },
    dewpoint_acid_C: -999, dewpoint_water_C: 14,
    treatment_candidates: [],
  },
};

const mockS2: Stage2Output = {
  hood_type: "enclosing", V_c_applied_m_s: 0.7,
  Q_hood_m3min: 100, dP_hood_Pa: 200,
};

describe("Stage 3 — Duct", () => {
  describe("swameeJain", () => {
    it("층류 Re 1000 → f = 0.064", () => {
      expect(swameeJain(1000, 0.0001)).toBeCloseTo(0.064, 2);
    });
    it("난류 Re 1e5 → f ≈ 0.018", () => {
      const f = swameeJain(1e5, 0.0001);
      expect(f).toBeGreaterThan(0.015);
      expect(f).toBeLessThan(0.025);
    });
  });

  describe("airViscosity", () => {
    it("25°C ≈ 1.85e-5 Pa·s", () => {
      expect(airViscosity(25)).toBeCloseTo(1.85e-5, 6);
    });
    it("350°C ≈ 3.05e-5 (Sutherland)", () => {
      const μ = airViscosity(350);
      expect(μ).toBeGreaterThan(2.5e-5);
      expect(μ).toBeLessThan(3.5e-5);
    });
  });

  describe("runStage3", () => {
    it("100 m³/min, V_t 18 → D 약 350mm 표준", () => {
      const out = runStage3(
        {
          branches: [
            {
              id: "B1",
              Q_m3min: 100,
              length_m: 30,
              fittings: [{ type: "elbow_90_R1.5", count: 2 }],
            },
          ],
          material: "SS400",
          transport_velocity_m_s: 18,
        },
        mockS1, mockS2
      );
      expect(out.branches[0].D_m).toBeCloseTo(0.350, 2);
      expect(out.branches[0].V_actual_m_s).toBeGreaterThan(15);
      expect(out.branches[0].V_actual_m_s).toBeLessThan(22);
      expect(out.warnings.length).toBe(0);
    });

    it("반송속도 미달 → 경고", () => {
      const out = runStage3(
        {
          branches: [
            { id: "B1", Q_m3min: 100, length_m: 30, fittings: [] },
          ],
          material: "SS400",
          transport_velocity_m_s: 5,  // 너무 낮음
        },
        mockS1, mockS2
      );
      // 반송속도 5 → 큰 직경 → 실제 V도 낮음
      expect(out.warnings.some(w => w.includes("미달"))).toBe(true);
    });
  });
});
