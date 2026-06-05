import { describe, it, expect } from "vitest";
import { runStage7, decideArrangement, selectFanType, calcFanPower, calcVFDPayback } from "../07-fan";
import type { Stage1Output, Stage2Output, Stage3Output, Stage5Output, Stage6Output } from "../types";

const mockS2: Stage2Output = {
  hood_type: "enclosing", V_c_applied_m_s: 0.7,
  Q_hood_m3min: 1000, dP_hood_Pa: 200,
};

const mockS1: Stage1Output = {
  dust: {
    industry: "generic", dust_name: "test", d50_um: 10,
    particle_density_kg_m3: 2200, stickiness: "low",
    flammable: false, corrosive: "none",
  },
  gas: { T_in_C: 80, P_in_kPa: 101.325, RH_in_pct: 50, O2_pct: 21 },
  derived: {
    ST_class: null,
    resistivity_estimate: { low_Ohm_cm: 1e7, high_Ohm_cm: 1e9 },
    dewpoint_acid_C: -999, dewpoint_water_C: 14,
    treatment_candidates: [],
  },
};

const mockS3: Stage3Output = {
  branches: [],
  total: { Q_total_m3min: 1000, dP_duct_Pa: 500, V_min_m_s: 18, V_max_m_s: 20 },
  warnings: [],
};

const mockS5: Stage5Output = {
  primary: "bag_filter", efficiency_overall: 0.999, dP_collector_Pa: 1500, warnings: [],
};

const mockS6: Stage6Output = {
  type: null, T_target_C: 80,
  T_dewpoint_acid_C: -999, T_dewpoint_water_C: 14, margin_K: 80,
  m_condensate_kg_h: 0, waste_heat_kW: 0,
  material_recommendation: "Carbon steel", insulation_thickness_mm: 80,
  startup_heating_required: false, warnings: [],
};

describe("Stage 7 — Fan", () => {
  describe("decideArrangement", () => {
    it("Q 1000, ΔP 200mmAq, 1지점 → 1_ID", () => {
      expect(decideArrangement({
        Q_m3min: 1000, dP_Pa: 1960, hood_branches: 1, treatment: "dry",
      })).toBe("1_ID");
    });
    it("Q 30000, ΔP 500mmAq → FD+ID", () => {
      expect(decideArrangement({
        Q_m3min: 30000, dP_Pa: 4900, hood_branches: 5, treatment: "dry",
      })).toBe("FD+ID_balanced");
    });
    it("Q 100000 → N+1", () => {
      expect(decideArrangement({
        Q_m3min: 100000, dP_Pa: 4900, hood_branches: 10, treatment: "dry",
      })).toBe("Nplus1_parallel");
    });
    it("SDA 처리 → FD+ID 강제", () => {
      expect(decideArrangement({
        Q_m3min: 5000, dP_Pa: 3000, hood_branches: 2, treatment: "semi-dry+SDA",
      })).toBe("FD+ID_balanced");
    });
  });

  describe("selectFanType", () => {
    it("FD 역할 → Radial", () => {
      expect(selectFanType({
        role: "FD", conc_in_fan_g_m3: 0.01, abrasive_dust: false,
        T_in_C: 100, dP_Pa: 1000, Q_m3min: 1000,
      })).toBe("Radial");
    });
    it("ID·고온 → Radial", () => {
      expect(selectFanType({
        role: "ID", conc_in_fan_g_m3: 0.01, abrasive_dust: false,
        T_in_C: 350, dP_Pa: 1000, Q_m3min: 1000,
      })).toBe("Radial");
    });
    it("ID·청정·고정압·대용량 → Airfoil", () => {
      expect(selectFanType({
        role: "ID", conc_in_fan_g_m3: 0.01, abrasive_dust: false,
        T_in_C: 100, dP_Pa: 5000, Q_m3min: 20000,
      })).toBe("Airfoil");
    });
    it("ID·중정압 → Turbo_BC", () => {
      expect(selectFanType({
        role: "ID", conc_in_fan_g_m3: 0.01, abrasive_dust: false,
        T_in_C: 100, dP_Pa: 2500, Q_m3min: 5000,
      })).toBe("Turbo_BC");
    });
  });

  describe("calcFanPower", () => {
    it("Q 10 m³/s, ΔP 2000 Pa, Turbo η 0.80 → BHP ~27 kW", () => {
      const r = calcFanPower(10, 2000, "Turbo_BC");
      expect(r.BHP_kW).toBeCloseTo(27.4, 0);
      expect(r.motor_kW).toBeGreaterThanOrEqual(30); // 표준 사이즈 round up
    });
  });

  describe("calcVFDPayback", () => {
    it("부하변동 30%, 8000h, 75kW → use_VFD true", () => {
      const r = calcVFDPayback({
        load_variation_pct: 30, op_hours_yr: 8000, motor_kW: 75, R_kWh_won: 100,
      });
      expect(r.use_VFD).toBe(true);
      expect(r.payback_yr).toBeDefined();
      expect(r.payback_yr).toBeLessThan(10);
    });
    it("부하변동 5% → use_VFD false", () => {
      const r = calcVFDPayback({
        load_variation_pct: 5, op_hours_yr: 8000, motor_kW: 75, R_kWh_won: 100,
      });
      expect(r.use_VFD).toBe(false);
    });
    it("소형모터 20kW → use_VFD false", () => {
      const r = calcVFDPayback({
        load_variation_pct: 30, op_hours_yr: 8000, motor_kW: 20, R_kWh_won: 100,
      });
      expect(r.use_VFD).toBe(false);
    });
  });

  describe("runStage7", () => {
    it("일반 백필터 1팬 ID", () => {
      const r = runStage7(
        { hood_branches: 1, op_hours_yr: 6000, R_kWh_won: 100 },
        mockS1, mockS2, mockS3, mockS5, mockS6, "dry"
      );
      expect(r.arrangement).toBe("1_ID");
      expect(r.fan_count).toBe(1);
      expect(r.total_kW).toBeGreaterThan(0);
    });

    it("습식 처리 → 재질 FRP 또는 SS316L", () => {
      const r = runStage7(
        { hood_branches: 1 },
        mockS1, mockS2, mockS3, mockS5, mockS6, "wet"
      );
      expect(r.fan_material).toMatch(/FRP|SS316L/);
    });

    it("연간 운전비 계산", () => {
      const r = runStage7(
        { op_hours_yr: 8000, R_kWh_won: 100 },
        mockS1, mockS2, mockS3, mockS5, mockS6, "dry"
      );
      expect(r.annual_kWh).toBeGreaterThan(0);
      expect(r.annual_cost_won).toBeCloseTo(r.annual_kWh * 100, 0);
    });
  });
});
