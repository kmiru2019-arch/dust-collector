// 최종 1안(Proposal) + 확정 사양(spec) → 기존 8단 계산엔진 입력으로 매핑.
// 상세설계는 기존 엔진/산출물(P&ID·BOM·PDF·슬라이드)을 그대로 재사용.

import type {
  AllStageInputs, DuctMaterial, MediaCode, CollectorPrimary, FacilityType, KoreaRegion,
} from "@/lib/calc/dust/types";
import type { Proposal } from "@/lib/proposal/types";

const n = (v: any, d: number) => (typeof v === "number" && !isNaN(v) ? v : Number(v) || d);

function toDuctMaterial(m?: string): DuctMaterial {
  switch (m) {
    case "SUS304": return "SUS304";
    case "SUS316L": case "Hastelloy": return "SUS316L";
    case "FRP": return "FRP";
    default: return "SS400";
  }
}

const MEDIA_SET: MediaCode[] = ["PE", "PP", "Acrylic", "Nomex", "PPS", "P84", "PTFE", "Glass", "Ceramic", "Metal", "Cellulose", "ePTFE"];
function toMedia(m?: string): MediaCode | undefined {
  return MEDIA_SET.includes(m as MediaCode) ? (m as MediaCode) : undefined;
}

// 처리방식 → 1차 집진방식
function primaryOf(treatment: string): CollectorPrimary {
  if (treatment.startsWith("wet")) return "scrubber";
  if (treatment === "ep") return "ep";
  return "bag_filter"; // dry / semi-dry / SDA / AC
}

const VALID_REGIONS: KoreaRegion[] = [
  "seoul", "busan", "incheon", "daegu", "daejeon", "gwangju", "ulsan", "sejong",
  "gyeonggi", "gangwon", "chungbuk", "chungnam", "jeonbuk", "jeonnam", "gyeongbuk", "gyeongnam", "jeju",
];
function toRegion(r?: string): KoreaRegion {
  return VALID_REGIONS.includes(r as KoreaRegion) ? (r as KoreaRegion) : "gyeonggi";
}

export function mapToStageInputs(proposal: Proposal, spec: Record<string, any>): AllStageInputs {
  const flow = n(spec.flow_Nm3h, 30000);
  const Qmin = flow / 60;
  const T_in = n(spec.T_in_C, 200);
  const T_out = n(spec.T_out_C, 150);
  const primary = primaryOf(proposal.treatment);
  const dioxin = n(spec.dioxin, 0);
  const hasAcid = n(spec.hcl_ppm, 0) > 0 || n(spec.so2_ppm, 0) > 0;

  const inputs: AllStageInputs = {
    stage1: {
      dust: {
        industry: "generic",
        dust_name: spec.dust_type ?? "분진",
        d50_um: n(spec.d50_um, 10),
        particle_density_kg_m3: n(spec.particle_density, 2200),
        stickiness: (spec.stickiness as any) || "low",
        flammable: spec.flammable === "yes",
        Kst_bar_m_s: spec.kst ? n(spec.kst, 0) : undefined,
        MIE_mJ: spec.mie ? n(spec.mie, 0) : undefined,
        MIT_C: spec.mit ? n(spec.mit, 0) : undefined,
        corrosive: (spec.corrosive as any) || "none",
        particulate: true,
      },
      gas: {
        T_in_C: T_in,
        P_in_kPa: 101.325,
        RH_in_pct: 50,
        O2_pct: n(spec.o2_vol, 21),
        HCl_ppm: n(spec.hcl_ppm, 0) || undefined,
        SO2_ppm: n(spec.so2_ppm, 0) || undefined,
        SO3_ppm: n(spec.so3_ppm, 0) || undefined,
        NOx_ppm: n(spec.nox_ppm, 0) || undefined,
        Hg_ug_Nm3: n(spec.hg_ug, 0) || undefined,
        H2O_vol_pct: n(spec.h2o_vol, 0) || undefined,
        PCDD_ng_TEQ_Nm3: dioxin || undefined,
      },
    },
    stage2: {
      hood_type: "enclosing",
      open_area_m2: 1.0,
      safety_factor: 1.25,
    },
    stage3: {
      branches: [
        { id: "B1", Q_m3min: Qmin, length_m: 30, fittings: [{ type: "elbow_90_R1.5", count: 2 }] },
      ],
      material: toDuctMaterial(spec.body_material),
    },
    stage4: {
      target_efficiency_pct: n(spec.target_emission, 30) <= 10 ? 99.9 : 99,
      target_emission_mg_Sm3: n(spec.target_emission, 30),
      budget_class: "medium",
      has_waste_heat_use: false,
      water_available: spec.wastewater === "ok",
    },
    stage5: {
      primary,
      bag: primary === "bag_filter" ? {
        Q_m3min: Qmin,
        inlet_conc_g_m3: n(spec.inlet_conc_g, 5),
        T_in_C: T_out,
        filter_type: "pulse_jet",
        manual_media: toMedia(spec.filter_media),
        gas_chemistry: {
          HCl_ppm: n(spec.hcl_ppm, 0) || undefined,
          SO3_ppm: n(spec.so3_ppm, 0) || undefined,
          H2O_vol_pct: n(spec.h2o_vol, 0) || undefined,
        },
      } : undefined,
      scrubber: primary === "scrubber" ? {
        type: "venturi",
        Q_m3s: flow / 3600,
        inlet_conc_g_m3: n(spec.inlet_conc_g, 5),
        gas_chemistry: {
          SO2_ppm: n(spec.so2_ppm, 0) || undefined,
          HCl_ppm: n(spec.hcl_ppm, 0) || undefined,
          H2O_vol_pct: n(spec.h2o_vol, 0) || undefined,
        },
        target_efficiency: 0.99,
      } : undefined,
      ep: primary === "ep" ? {
        Q_m3s: flow / 3600,
        target_efficiency: 0.99,
        dust_resistivity_Ohm_cm: n(spec.resistivity, 1e11),
        ep_type: "dry",
        T_in_C: T_out,
      } : undefined,
      // SDA/AC 트레인이면 백필터 전단 사이클론 포함 안건은 secondary로 표현하지 않고 1차 백필터로 단순화
    },
    stage6: {
      // 구조도에 냉각/HX 노드가 없으면 응축기 단계 생략
      skip: !proposal.train.some((nd) => nd.id === "HX" || nd.id === "QUENCH"),
      T_target_C: T_out,
      has_waste_heat_use: false,
      op_hours_yr: n(spec.op_hours_yr, 8000),
      R_kWh_won: 100,
      downstream_collector_type: primary === "scrubber" ? "scrubber" : primary === "ep" ? "ep_dry" : "bag",
      downstream_media: toMedia(spec.filter_media),
    },
    stage7: {
      hood_branches: 1,
      op_hours_yr: n(spec.op_hours_yr, 8000),
      R_kWh_won: 100,
      load_variation_pct: 15,
    },
    stage8: {
      region: toRegion(spec.region),
      annual_emission_t: n(spec.annual_emission_t, 5),
      install_date: spec.install_date || "2025-01-01",
      facility_type: (dioxin > 0 || (spec.process_source ?? "").includes("소각")) ? "incineration" : "general" as FacilityType,
    },
  };

  return inputs;
}

// dust-store에 적용 (각 단 setter 호출 후 1단부터 재계산)
export function applyToDustStore(inputs: AllStageInputs) {
  // 동적 import로 SSR 안전
  const { useDustStore } = require("@/lib/store/dust-store");
  const st = useDustStore.getState();
  st.setStage1Input(inputs.stage1);
  st.setStage2Input(inputs.stage2);
  st.setStage3Input(inputs.stage3);
  st.setStage4Input(inputs.stage4);
  if (inputs.stage5) st.setStage5Input(inputs.stage5);
  if (inputs.stage6) st.setStage6Input(inputs.stage6);
  if (inputs.stage7) st.setStage7Input(inputs.stage7);
  if (inputs.stage8) st.setStage8Input(inputs.stage8);
  st.recalculate(1);
}
