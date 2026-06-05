import { describe, it, expect } from "vitest";
import { runAll } from "../engine";
import type { AllStageInputs } from "../types";

describe("Engine — Stage 1~4 통합", () => {
  it("일반산업 풀 파이프라인 — 정상 통과", () => {
    const inputs: AllStageInputs = {
      stage1: {
        dust: {
          industry: "generic", dust_name: "일반 분진",
          d50_um: 10, particle_density_kg_m3: 2200,
          stickiness: "low", flammable: false, corrosive: "none",
        },
        gas: {
          T_in_C: 25, P_in_kPa: 101.325, RH_in_pct: 50, O2_pct: 21,
        },
      },
      stage2: {
        hood_type: "enclosing", open_area_m2: 1.0, safety_factor: 1.25,
      },
      stage3: {
        branches: [
          {
            id: "B1", Q_m3min: 100, length_m: 30,
            fittings: [{ type: "elbow_90_R1.5", count: 2 }],
          },
        ],
        material: "SS400",
      },
      stage4: { target_efficiency_pct: 99 },
    };

    const out = runAll(inputs);

    expect(out.stage1).toBeDefined();
    expect(out.stage2).toBeDefined();
    expect(out.stage3).toBeDefined();
    expect(out.stage4).toBeDefined();

    expect(out.stage1!.derived.ST_class).toBeNull();
    expect(out.stage2!.Q_hood_m3min).toBeCloseTo(52.5, 1);
    // Stage 2 후드 풍량(52.5)이 Stage 3 덕트 가지[0] Q에 자동 연결됨
    // (디폴트 100 → 후드 풍량으로 대체)
    expect(out.stage3!.total.Q_total_m3min).toBeCloseTo(52.5, 1);
    expect(out.stage4!.primary_choice.type).toBe("dry");
  });

  it("목재가공 (목분 폭발성) → dry+explosion_protection", () => {
    const inputs: AllStageInputs = {
      stage1: {
        dust: {
          industry: "woodworking", dust_name: "목분",
          d50_um: 50, particle_density_kg_m3: 600,
          stickiness: "low", flammable: true, Kst_bar_m_s: 150,
          MIE_mJ: 30, MIT_C: 400, corrosive: "none",
        },
        gas: {
          T_in_C: 25, P_in_kPa: 101.325, RH_in_pct: 50, O2_pct: 21,
        },
      },
      stage2: {
        hood_type: "exterior_lateral",
        source_area_m2: 0.5, capture_distance_X_m: 0.3,
      },
      stage3: {
        branches: [
          { id: "B1", Q_m3min: 200, length_m: 50, fittings: [{ type: "elbow_90_R1.5", count: 4 }] },
        ],
        material: "SS400",
      },
      stage4: { water_available: false },
    };

    const out = runAll(inputs);

    expect(out.stage1!.derived.ST_class).toBe("ST1");
    expect(out.stage4!.primary_choice.type).toBe("dry+explosion_protection");
  });

  it("MSW 소각 — 800°C, HCl·Hg → semi-dry 계열", () => {
    const inputs: AllStageInputs = {
      stage1: {
        dust: {
          industry: "msw_incineration", dust_name: "비산재",
          d50_um: 5, particle_density_kg_m3: 2200,
          stickiness: "medium", flammable: false, corrosive: "severe",
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
    };

    const out = runAll(inputs);

    expect(out.stage1!.derived.dewpoint_acid_C).toBeGreaterThan(100);
    expect(out.stage4!.primary_choice.type).toMatch(/semi-dry/);
  });
});
