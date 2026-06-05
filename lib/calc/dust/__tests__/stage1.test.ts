import { describe, it, expect } from "vitest";
import {
  classifyST, verhoffBanchero, waterDewpoint,
  estimateResistivity, rankTreatments, runStage1,
} from "../01-properties";

describe("Stage 1 — Properties", () => {
  describe("classifyST", () => {
    it("비가연성 → null", () => {
      expect(classifyST(0, false)).toBeNull();
    });
    it("Kst 150 → ST1", () => {
      expect(classifyST(150, true)).toBe("ST1");
    });
    it("Kst 250 → ST2", () => {
      expect(classifyST(250, true)).toBe("ST2");
    });
    it("Kst 400 → ST3", () => {
      expect(classifyST(400, true)).toBe("ST3");
    });
    it("Kst 미실측·가연성 → ST1 보수적", () => {
      expect(classifyST(undefined, true)).toBe("ST1");
    });
  });

  describe("verhoffBanchero", () => {
    it("일반 석탄 보일러 (H2O 8%, SO3 10ppm) ≈ 130~150°C", () => {
      const T = verhoffBanchero(0.08, 10e-6);
      expect(T).toBeGreaterThan(120);
      expect(T).toBeLessThan(170);
    });
    it("0 분압 → -999", () => {
      expect(verhoffBanchero(0, 1e-6)).toBe(-999);
    });
  });

  describe("waterDewpoint", () => {
    it("25°C, 50% RH → ~14°C", () => {
      expect(waterDewpoint(25, 50)).toBeCloseTo(13.85, 0);
    });
    it("100°C, 100% RH → ~100°C", () => {
      expect(waterDewpoint(100, 100)).toBeCloseTo(100, 0);
    });
  });

  describe("estimateResistivity", () => {
    it("시멘트 킬른 → 10¹⁰~10¹²", () => {
      const r = estimateResistivity("cement_kiln", 350);
      expect(r.low_Ohm_cm).toBeLessThan(r.high_Ohm_cm);
      // 온도가 높으면 비저항 낮아짐 (모델 단순화)
    });
  });

  describe("rankTreatments", () => {
    it("일반 분진 → dry 1순위", () => {
      const r = rankTreatments(
        { industry: "generic", dust_name: "일반", d50_um: 10, particle_density_kg_m3: 2200,
          stickiness: "low", flammable: false, corrosive: "none" },
        { T_in_C: 25, P_in_kPa: 101.325, RH_in_pct: 50, O2_pct: 21 },
        { water_available: true, has_waste_heat_use: false }
      );
      expect(r[0].type).toBe("dry");
    });

    it("목분 (가연성) → dry+explosion_protection 1순위", () => {
      const r = rankTreatments(
        { industry: "woodworking", dust_name: "목분", d50_um: 50, particle_density_kg_m3: 600,
          stickiness: "low", flammable: true, Kst_bar_m_s: 150, corrosive: "none" },
        { T_in_C: 25, P_in_kPa: 101.325, RH_in_pct: 50, O2_pct: 21 },
        { water_available: false, has_waste_heat_use: false }
      );
      expect(r[0].type).toBe("dry+explosion_protection");
    });

    it("MSW 소각 (HCl 800, Hg 50) → SDA 계열", () => {
      const r = rankTreatments(
        { industry: "msw_incineration", dust_name: "비산재", d50_um: 5, particle_density_kg_m3: 2200,
          stickiness: "medium", flammable: false, corrosive: "severe" },
        { T_in_C: 800, P_in_kPa: 101.325, RH_in_pct: 30, O2_pct: 8, HCl_ppm: 800, SO2_ppm: 300, Hg_ug_Nm3: 50, PCDD_ng_TEQ_Nm3: 1 },
        { water_available: true, has_waste_heat_use: true }
      );
      expect(r[0].type).toMatch(/semi-dry|wet/);
    });
  });

  describe("runStage1", () => {
    it("일반 입력 → 정상 출력", () => {
      const out = runStage1({
        dust: {
          industry: "generic", dust_name: "일반", d50_um: 10,
          particle_density_kg_m3: 2200, stickiness: "low",
          flammable: false, corrosive: "none",
        },
        gas: {
          T_in_C: 25, P_in_kPa: 101.325, RH_in_pct: 50, O2_pct: 21,
        },
      });
      expect(out.derived.ST_class).toBeNull();
      expect(out.derived.treatment_candidates.length).toBeGreaterThan(0);
      expect(out.derived.treatment_candidates[0].type).toBe("dry");
    });
  });
});
