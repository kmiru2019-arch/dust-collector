import { describe, it, expect } from "vitest";
import { runStage8, classifyBusiness } from "../08-compliance";
import { nfpa68VentArea, analyzeExplosion } from "../08-safety";
import type { Stage1Output, Stage2Output } from "../types";

function mockS1(over: any = {}): Stage1Output {
  return {
    dust: {
      industry: "generic", dust_name: "test", d50_um: 10,
      particle_density_kg_m3: 2200, stickiness: "low",
      flammable: false, corrosive: "none", particulate: true,
      ...over.dust,
    },
    gas: { T_in_C: 25, P_in_kPa: 101.325, RH_in_pct: 50, O2_pct: 21, ...over.gas },
    derived: {
      ST_class: over.dust?.flammable ? "ST1" : null,
      resistivity_estimate: { low_Ohm_cm: 1e7, high_Ohm_cm: 1e9 },
      dewpoint_acid_C: -999, dewpoint_water_C: 14,
      treatment_candidates: [],
    },
  };
}

const mockS2: Stage2Output = {
  hood_type: "enclosing", V_c_applied_m_s: 0.7,
  Q_hood_m3min: 100, dP_hood_Pa: 200,
};

describe("Stage 8 — Compliance & Safety", () => {
  describe("classifyBusiness", () => {
    it("100t → 1종", () => expect(classifyBusiness(100)).toBe("1종"));
    it("50t → 2종", () => expect(classifyBusiness(50)).toBe("2종"));
    it("15t → 3종", () => expect(classifyBusiness(15)).toBe("3종"));
    it("5t → 4종", () => expect(classifyBusiness(5)).toBe("4종"));
    it("1t → 5종", () => expect(classifyBusiness(1)).toBe("5종"));
  });

  describe("nfpa68VentArea", () => {
    it("Kst 150, V 30, P_red 0.1, P_stat 0.05 → 양수", () => {
      const A = nfpa68VentArea({
        V_m3: 30, P_red_bar: 0.1, P_stat_bar: 0.05, Kst: 150,
      });
      expect(A).toBeGreaterThan(0);
    });
    it("Kst 0 → 0", () => {
      expect(nfpa68VentArea({ V_m3: 30, P_red_bar: 0.1, P_stat_bar: 0.05, Kst: 0 })).toBe(0);
    });
    it("P_red <= P_stat → 0", () => {
      expect(nfpa68VentArea({ V_m3: 30, P_red_bar: 0.05, P_stat_bar: 0.1, Kst: 150 })).toBe(0);
    });
  });

  describe("analyzeExplosion", () => {
    it("비가연성 → null", () => {
      const r = analyzeExplosion(mockS1(), 30);
      expect(r).toBeNull();
    });
    it("목분 ST1 → vent_area > 0, ATEX 권장", () => {
      const r = analyzeExplosion(mockS1({ dust: { flammable: true, Kst_bar_m_s: 150 } }), 30);
      expect(r).not.toBeNull();
      expect(r!.vent_area_m2).toBeGreaterThan(0);
      expect(r!.ATEX_recommended).toBe(true);
      expect(r!.zone20_areas.length).toBeGreaterThan(0);
    });
  });

  describe("runStage8", () => {
    it("4종 사업장 → 90% 보조금 매칭", () => {
      const r = runStage8(
        {
          region: "seoul", annual_emission_t: 5,
          install_date: "2020-01-01", facility_type: "general",
        },
        mockS1(), mockS2
      );
      expect(r.classification).toBe("4종");
      expect(r.subsidies.some(s => (s.subsidy_rate ?? 0) >= 0.9)).toBe(true);
    });

    it("1종 + 보일러 → TMS 의무", () => {
      const r = runStage8(
        {
          region: "ulsan", annual_emission_t: 200,
          install_date: "2020-01-01", facility_type: "boiler",
        },
        mockS1(), mockS2
      );
      expect(r.classification).toBe("1종");
      expect(r.TMS_required).toBe(true);
    });

    it("MSW 소각 → 폐기물 4단 의무", () => {
      const r = runStage8(
        {
          region: "incheon", annual_emission_t: 50,
          install_date: "2020-01-01", facility_type: "msw_incineration",
        },
        mockS1(), mockS2
      );
      expect(r.waste_obligations.length).toBeGreaterThan(0);
      expect(r.emission_standards.PCDD).toBeDefined();
    });

    it("목재가공 가연성 → 분진폭발 분석", () => {
      const r = runStage8(
        {
          region: "gyeonggi", annual_emission_t: 5,
          install_date: "2024-01-01", facility_type: "general",
        },
        mockS1({ dust: { flammable: true, Kst_bar_m_s: 150 } }),
        mockS2
      );
      expect(r.explosion).not.toBeNull();
      expect(r.subsidies.some(s => s.id === "kosha_loan")).toBe(true);
    });

    it("발암성 → 분기 1회 측정 + 30년 보존", () => {
      const r = runStage8(
        {
          region: "seoul", annual_emission_t: 5,
          install_date: "2020-01-01", facility_type: "general",
          is_carcinogen: true,
        },
        mockS1(), mockS2
      );
      expect(r.measurement.freq).toBe("quarterly");
      expect(r.measurement.retention_yr).toBe(30);
    });

    it("화학물질 취급 → 환기 의무", () => {
      const r = runStage8(
        {
          region: "ulsan", annual_emission_t: 5,
          install_date: "2020-01-01", facility_type: "general",
          handles_hazardous_chemicals: true,
        },
        mockS1(), mockS2
      );
      expect(r.chemical_obligations.some(o => o.category === "chemical")).toBe(true);
    });

    it("환경영향평가 — 면적 ≥ 30000m²", () => {
      const r = runStage8(
        {
          region: "seoul", annual_emission_t: 5,
          install_date: "2020-01-01", facility_type: "general",
          facility_size_m2: 50000,
        },
        mockS1(), mockS2
      );
      expect(r.eia_required).toBe(true);
    });

    it("안전검사 일정 — 설치+3년 → 이후 2년", () => {
      const r = runStage8(
        {
          region: "seoul", annual_emission_t: 5,
          install_date: "2024-01-01", facility_type: "general",
        },
        mockS1(), mockS2
      );
      expect(r.inspection_schedule.length).toBeGreaterThanOrEqual(5);
      expect(r.inspection_schedule[0]).toContain("2027");
    });

    it("면책 조항 자동 삽입", () => {
      const r = runStage8(
        { region: "seoul", annual_emission_t: 5, install_date: "2020-01-01", facility_type: "general" },
        mockS1(), mockS2
      );
      expect(r.disclaimer).toContain("법적 효력");
    });

    it("노후 시설 (10년+) → 교체 보조금", () => {
      const r = runStage8(
        {
          region: "seoul", annual_emission_t: 5,
          install_date: "2010-01-01", facility_type: "general",
        },
        mockS1(), mockS2
      );
      expect(r.subsidies.some(s => s.id === "env_old_replace")).toBe(true);
    });
  });
});
