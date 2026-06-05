// 8단 통합 풀 파이프라인 테스트

import { describe, it, expect } from "vitest";
import { runAll } from "../engine";
import type { AllStageInputs, PSD } from "../types";

const psd: PSD = {
  bins: [
    { d_um: 0.5, mass_frac: 0.10 },
    { d_um: 1, mass_frac: 0.10 },
    { d_um: 5, mass_frac: 0.25 },
    { d_um: 10, mass_frac: 0.30 },
    { d_um: 30, mass_frac: 0.15 },
    { d_um: 100, mass_frac: 0.10 },
  ],
};

describe("Engine 8단 통합 — 풀 파이프라인", () => {
  it("일반산업 풀 파이프라인 (8단 모두 출력)", () => {
    const inputs: AllStageInputs = {
      stage1: {
        dust: {
          industry: "generic", dust_name: "일반 분진",
          d50_um: 10, particle_density_kg_m3: 2200,
          stickiness: "low", flammable: false, corrosive: "none",
          particulate: true,
        },
        gas: { T_in_C: 80, P_in_kPa: 101.325, RH_in_pct: 50, O2_pct: 21 },
      },
      stage2: { hood_type: "enclosing", open_area_m2: 1.0, safety_factor: 1.25 },
      stage3: {
        branches: [{ id: "B1", Q_m3min: 100, length_m: 30, fittings: [{ type: "elbow_90_R1.5", count: 2 }] }],
        material: "SS400",
      },
      stage4: { target_efficiency_pct: 99, water_available: true },
      stage5: { primary: "bag_filter", bag: { inlet_conc_g_m3: 5 } },
      stage6: { has_waste_heat_use: false, downstream_collector_type: "bag" },
      stage7: { hood_branches: 1, op_hours_yr: 6000, R_kWh_won: 100 },
      stage8: {
        region: "gyeonggi", annual_emission_t: 5,
        install_date: "2024-01-01", facility_type: "general",
      },
    };

    const out = runAll(inputs);

    expect(out.stage1).toBeDefined();
    expect(out.stage2).toBeDefined();
    expect(out.stage3).toBeDefined();
    expect(out.stage4).toBeDefined();
    expect(out.stage5).toBeDefined();
    expect(out.stage6).toBeDefined();
    expect(out.stage7).toBeDefined();
    expect(out.stage8).toBeDefined();

    expect(out.stage1!.derived.ST_class).toBeNull();
    expect(out.stage4!.primary_choice.type).toBe("dry");
    expect(out.stage5!.primary).toBe("bag_filter");
    expect(out.stage5!.bag).toBeDefined();
    expect(out.stage7!.arrangement).toBe("1_ID");
    expect(out.stage8!.classification).toBe("4종");
  });

  it("목재가공 (목분 폭발성) — 사이클론+백 + 분진폭발 자동", () => {
    const inputs: AllStageInputs = {
      stage1: {
        dust: {
          industry: "woodworking", dust_name: "목분",
          d50_um: 50, particle_density_kg_m3: 600,
          stickiness: "low", flammable: true, Kst_bar_m_s: 150, MIE_mJ: 30,
          corrosive: "none", particulate: true,
        },
        gas: { T_in_C: 25, P_in_kPa: 101.325, RH_in_pct: 50, O2_pct: 21 },
      },
      stage2: {
        hood_type: "exterior_lateral",
        source_area_m2: 0.5, capture_distance_X_m: 0.3,
      },
      stage3: {
        branches: [{ id: "B1", Q_m3min: 200, length_m: 50, fittings: [{ type: "elbow_90_R1.5", count: 4 }] }],
        material: "SS400",
      },
      stage4: { water_available: false },
      stage5: {
        primary: "cyclone",
        cyclone: { standard: "Stairmand_HE" },
        series: { secondary: "bag_filter" },
      },
      stage6: { downstream_collector_type: "bag", downstream_media: "PE" },
      stage7: { hood_branches: 1 },
      stage8: {
        region: "gyeonggi", annual_emission_t: 3,
        install_date: "2024-01-01", facility_type: "general",
      },
    };

    const out = runAll(inputs);

    expect(out.stage1!.derived.ST_class).toBe("ST1");
    expect(out.stage4!.primary_choice.type).toBe("dry+explosion_protection");
    expect(out.stage5!.cyclone).toBeDefined();
    expect(out.stage8!.explosion).not.toBeNull();
    expect(out.stage8!.explosion!.ATEX_recommended).toBe(true);
  });

  it("MSW 소각 — SDA + Bag(PTFE) + 컴플라이언스 12항목", () => {
    const inputs: AllStageInputs = {
      stage1: {
        dust: {
          industry: "msw_incineration", dust_name: "비산재",
          d50_um: 5, particle_density_kg_m3: 2200,
          stickiness: "medium", flammable: false, corrosive: "severe",
          particulate: true,
        },
        gas: {
          T_in_C: 800, P_in_kPa: 101.325, RH_in_pct: 30, O2_pct: 8,
          HCl_ppm: 800, SO2_ppm: 300, Hg_ug_Nm3: 50, PCDD_ng_TEQ_Nm3: 1,
          H2O_vol_pct: 18, SO3_ppm: 5,
        },
      },
      stage2: { hood_type: "enclosing", open_area_m2: 5.0 },
      stage3: {
        branches: [{ id: "B1", Q_m3min: 5000, length_m: 100, fittings: [] }],
        material: "SUS316L",
      },
      stage4: { water_available: true, has_waste_heat_use: true },
      stage5: { primary: "bag_filter", bag: { inlet_conc_g_m3: 5, manual_media: "PTFE" } },
      stage6: { has_waste_heat_use: true, fuel_type: "msw", downstream_collector_type: "bag", downstream_media: "PTFE" },
      stage7: { hood_branches: 1, redundancy_required: false },
      stage8: {
        region: "incheon", annual_emission_t: 50,
        install_date: "2024-06-01", facility_type: "msw_incineration",
        facility_capacity: 5,
        worker_count: 20, daily_exposure_h: 8,
      },
    };

    const out = runAll(inputs);

    expect(out.stage1!.derived.dewpoint_acid_C).toBeGreaterThan(100);
    expect(out.stage4!.primary_choice.type).toMatch(/semi-dry/);
    expect(out.stage5!.bag!.media.code).toBe("PTFE");
    expect(out.stage6!.type).toBeDefined();
    expect(out.stage8!.classification).toBe("2종");
    expect(out.stage8!.emission_standards.PCDD).toBeDefined();
    expect(out.stage8!.waste_obligations.length).toBeGreaterThan(0);
    expect(out.stage8!.citations.length).toBeGreaterThan(5);
  });

  it("Stage N 출력은 N+1 입력 — 데이터 흐름 검증", () => {
    const inputs: AllStageInputs = {
      stage1: {
        dust: { industry: "generic", dust_name: "x", d50_um: 10, particle_density_kg_m3: 2200, stickiness: "low", flammable: false, corrosive: "none", particulate: true },
        gas: { T_in_C: 25, P_in_kPa: 101.325, RH_in_pct: 50, O2_pct: 21 },
      },
      stage2: { hood_type: "enclosing", open_area_m2: 1 },
      stage3: { branches: [{ id: "B1", Q_m3min: 100, length_m: 30, fittings: [] }], material: "SS400" },
      stage4: {},
      stage5: { primary: "bag_filter" },
      stage6: {},
      stage7: {},
      stage8: { region: "seoul", annual_emission_t: 5, install_date: "2024-01-01", facility_type: "general" },
    };

    const out = runAll(inputs);

    // Stage 3 풍량이 Stage 7 송풍기 입력에 반영
    expect(out.stage7!.fans[0].Q_m3min).toBeGreaterThan(out.stage3!.total.Q_total_m3min);

    // Stage 5 백필터 dP가 Stage 7 송풍기 dP에 반영
    expect(out.stage7!.fans[0].dP_Pa).toBeGreaterThan(out.stage5!.dP_collector_Pa);
  });
});
