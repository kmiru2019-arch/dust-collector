// Concept + Brief → 8단 위저드 입력 자동 매핑

import type { Brief, Concept } from "./types";
import type { AllStageInputs, FacilityType } from "@/lib/calc/dust/types";
import { INDUSTRIES } from "@/lib/data/dust/industries";
import { DUST_TYPES } from "@/lib/data/dust/dust-types";
import { getStandardLayout, compactLayout } from "@/lib/data/dust/standard-layout";

function mapFacilityType(industry: string): FacilityType {
  const map: Record<string, FacilityType> = {
    msw_incineration: "msw_incineration",
    hazardous_waste_incineration: "hazardous_waste_incineration",
    cement_kiln: "cement_kiln",
    cement_mill: "cement_mill",
    coal_power: "coal_power",
    iron_eaf: "iron_eaf",
    non_ferrous_smelting: "non_ferrous",
  };
  return map[industry] ?? "general";
}

export function conceptToStages(brief: Brief, concept: Concept): AllStageInputs {
  const ind = INDUSTRIES[brief.industry];
  const dust = DUST_TYPES[ind?.typical_dust?.name ?? ""] ?? Object.values(DUST_TYPES).find(d => d.code === brief.industry);
  const Q_m3min = brief.flowrate_Nm3h / 60;

  // 표준 배치 → 덕트 길이
  const layout = brief.constraints.tight_space
    ? compactLayout(getStandardLayout(ind?.preset ?? "preset_1"))
    : getStandardLayout(ind?.preset ?? "preset_1");
  const totalLength = layout.total_length_m;
  const totalElbows = layout.segments.reduce((s, seg) => s + (seg.elbow_90 ?? 0), 0);

  return {
    stage1: {
      dust: {
        industry: brief.industry,
        dust_name: ind?.typical_dust.name ?? "분진",
        d50_um: ind?.typical_dust.d50_um ?? 10,
        particle_density_kg_m3: ind?.typical_dust.particle_density_kg_m3 ?? 2200,
        stickiness: dust?.stickiness ?? "low",
        flammable: ind?.typical_dust.flammable ?? false,
        Kst_bar_m_s: ind?.typical_dust.Kst_bar_m_s,
        corrosive: dust?.corrosive ?? "none",
        particulate: true,
      },
      gas: {
        T_in_C: brief.T_in_C,
        P_in_kPa: 101.325,
        RH_in_pct: 30,
        O2_pct: ind?.typical_gas ? 8 : 21,
        HCl_ppm: ind?.typical_gas.HCl_ppm,
        SO2_ppm: ind?.typical_gas.SO2_ppm,
        SO3_ppm: ind?.typical_gas.SO2_ppm ? Math.round((ind.typical_gas.SO2_ppm) * 0.02) : undefined,
        NOx_ppm: ind?.typical_gas.NOx_ppm,
        Hg_ug_Nm3: ind?.typical_gas.Hg_ug_Nm3,
        PCDD_ng_TEQ_Nm3: ind?.typical_gas.PCDD_ng_TEQ_Nm3,
        H2O_vol_pct: brief.T_in_C > 200 ? 12 : 8,
      },
    },
    stage2: {
      hood_type: "enclosing",
      open_area_m2: Math.max(1, Q_m3min / 50), // 풍량 역산 (대략)
      safety_factor: 1.25,
    },
    stage3: {
      branches: [{
        id: "B1",
        Q_m3min: 100, // engine이 Stage2 후드풍량으로 자동 대체
        length_m: totalLength,
        fittings: totalElbows > 0 ? [{ type: "elbow_90_R1.5", count: totalElbows }] : [],
      }],
      material: brief.T_in_C > 150 ? "SUS316L" : "SS400",
    },
    stage4: {
      target_efficiency_pct: (brief.target_emission_mg_Sm3 ?? 30) <= 10 ? 99.9 : 99,
      target_emission_mg_Sm3: brief.target_emission_mg_Sm3 ?? ind?.target_emission_mg_Sm3 ?? 30,
      budget_class: brief.budget_class,
      water_available: !brief.constraints.no_wastewater,
      has_waste_heat_use: brief.T_in_C > 300,
    },
    stage5: {
      primary: concept.stages.primary,
      bag: concept.stages.collector_media ? { manual_media: concept.stages.collector_media, inlet_conc_g_m3: brief.inlet_conc_g_Nm3 ?? ind?.typical_conc_g_m3 ?? 5 } : undefined,
      cyclone: concept.stages.primary === "cyclone" ? { standard: "Stairmand_HE" } : undefined,
      ep: concept.stages.primary === "ep" ? { ep_type: "dry" } : undefined,
      scrubber: concept.stages.primary === "scrubber"
        ? { type: concept.treatment.includes("SDA") ? "sda" : "venturi" }
        : undefined,
      series: concept.stages.secondary ? { secondary: concept.stages.secondary } : undefined,
    },
    stage6: {
      has_waste_heat_use: brief.T_in_C > 300,
      fuel_type: brief.industry.includes("incineration") ? "msw" : brief.industry === "coal_power" ? "coal" : "other",
      downstream_collector_type: concept.stages.secondary === "bag_filter" || concept.stages.primary === "bag_filter"
        ? "bag" : concept.stages.primary === "ep" ? "ep_dry" : "scrubber",
      downstream_media: concept.stages.collector_media,
      op_hours_yr: brief.op_hours_yr,
      R_kWh_won: 100,
    },
    stage7: {
      hood_branches: 1,
      op_hours_yr: brief.op_hours_yr,
      R_kWh_won: 100,
      load_variation_pct: 20,
      redundancy_required: brief.flowrate_Nm3h > 200000,
    },
    stage8: {
      region: brief.region as any,
      annual_emission_t: estimateAnnualEmission(brief),
      install_date: brief.install_date,
      facility_type: mapFacilityType(brief.industry),
      facility_size_m2: Math.round(layout.footprint_W_m * layout.footprint_D_m),
    },
  };
}

// 연간 배출량 추정 (풍량 × 목표농도 × 운전시간)
function estimateAnnualEmission(brief: Brief): number {
  const conc_mg = brief.target_emission_mg_Sm3 ?? 30;
  const t = (brief.flowrate_Nm3h * conc_mg * 1e-6 * brief.op_hours_yr) / 1000; // ton/yr (먼지만)
  // 전체 오염물질은 먼지의 ~3배 가정 (SOx/NOx 포함)
  return Math.round(t * 3 * 10) / 10;
}
