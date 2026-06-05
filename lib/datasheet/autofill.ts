// Data Sheet 선택항목 미입력(공백/모름) 시 자동 채움
// 분진 DB·산업 표준·온도/부식 기반으로 빈 칸을 채워 "확정 사양"을 만든다.

import { DUST_TYPES } from "@/lib/data/dust/dust-types";
import { recommendMedia } from "@/lib/data/dust/filter-media";

export interface ResolvedSpec {
  // 사용자 입력 + 자동 채움이 합쳐진 최종 확정 사양
  values: Record<string, any>;
  // 자동으로 채워진 항목 추적 (사용자에게 "이렇게 적용됨" 표시)
  autoFilled: { key: string; label: string; value: string; reason: string }[];
}

// 분진명 → DB 매칭 (느슨한 키워드)
function matchDust(dustType: string) {
  if (!dustType) return undefined;
  const t = dustType.toLowerCase();
  const map: Record<string, string> = {
    비산재: "fly_ash_msw", 비산회: "fly_ash_coal", 시멘트: "cement_kiln",
    목분: "wood_flour", 목재: "wood_flour", 곡물: "grain_wheat", 밀가루: "grain_wheat",
    용접: "welding_fume_steel", 알루미늄: "aluminum_dust", 석회: "limestone",
    카본: "carbon_black", 설탕: "sugar", 전분: "starch", 석면: "asbestos",
    납: "lead_dust", 아연: "zinc_oxide", 유황: "sulfur", 석탄: "fly_ash_coal",
  };
  for (const [kw, code] of Object.entries(map)) {
    if (t.includes(kw)) return DUST_TYPES[code];
  }
  return undefined;
}

export function resolveSpec(input: Record<string, any>): ResolvedSpec {
  const v = { ...input };
  const auto: ResolvedSpec["autoFilled"] = [];
  const dust = matchDust(input.dust_type);

  const fill = (key: string, label: string, value: any, reason: string) => {
    if (v[key] === undefined || v[key] === null || v[key] === "") {
      v[key] = value;
      auto.push({ key, label, value: String(value), reason });
    }
  };

  // 가스 상세
  fill("h2o_vol", "함습률", input.T_in_C > 300 ? 12 : 8, "공정 온도 기반 표준값");
  fill("o2_vol", "O₂", input.T_in_C > 300 ? 8 : 21, "연소/일반 공정 가정");
  fill("draft_type", "흡인/가압", "ID", "흡인식(ID) 표준 권장");
  fill("pressure_mmAq", "정압", 0, "표준 대기압 가정");

  // 분진 물성 (DB 기반)
  if (dust) {
    fill("d50_um", "입경 d50", dust.d50_um, `분진 DB(${dust.name_ko}) 표준값`);
    fill("particle_density", "입자밀도", dust.particle_density_kg_m3, `분진 DB(${dust.name_ko})`);
    fill("stickiness", "점착성", dust.stickiness, `분진 DB(${dust.name_ko})`);
    fill("corrosive", "부식성", dust.corrosive, `분진 DB(${dust.name_ko})`);
    if (dust.resistivity_Ohm_cm) fill("resistivity", "비저항", dust.resistivity_Ohm_cm[0], `분진 DB 추정`);
    if (dust.flammable && dust.Kst_bar_m_s) {
      fill("kst", "Kst", dust.Kst_bar_m_s, `분진 DB(${dust.name_ko})`);
    }
  } else {
    fill("d50_um", "입경 d50", 10, "일반 분진 표준값");
    fill("particle_density", "입자밀도", 2200, "일반 분진 표준값");
    fill("stickiness", "점착성", "low", "기본 가정");
    fill("corrosive", "부식성", "none", "기본 가정");
  }

  // 가연성 미상인데 DB가 가연성이면 보수적 처리
  if (input.flammable === "yes" && (v.kst === undefined || v.kst === "")) {
    fill("kst", "Kst", 150, "미상 → 보수적 ST1 가정");
  }

  // 산성가스 SO3 자동 (SO2 기반)
  if ((input.so2_ppm ?? 0) > 0 && (v.so3_ppm === undefined || v.so3_ppm === "")) {
    fill("so3_ppm", "SO₃", Math.round(input.so2_ppm * 0.02), "SO₂의 2% 추정");
  }

  // 재질 자동 (온도·부식)
  const corrosive = v.corrosive;
  let mat = "SS400";
  if (input.T_in_C > 400 || corrosive === "severe") mat = "SUS316L";
  else if (corrosive === "mild" || input.T_in_C > 150) mat = "SUS304";
  fill("body_material", "본체/덕트 재질", mat, `인입 ${input.T_in_C}°C·부식성(${corrosive}) 기반 권장`);

  // 여재 자동 (백필터 가능성)
  const media = recommendMedia(input.T_out_C ?? input.T_in_C, {
    SO3_ppm: v.so3_ppm, HCl_ppm: input.hcl_ppm,
  }, undefined);
  fill("filter_media", "여재", media, `토출 ${input.T_out_C ?? "-"}°C·산성 기반 권장`);

  // 부지·유틸
  fill("space", "부지", "ample", "표준 배치 가정");
  fill("utility", "유틸리티", "full", "표준 가정");

  // 연간 배출량 추정 → 종별
  if (v.annual_emission_t === undefined || v.annual_emission_t === "") {
    const conc = input.target_emission ?? 30;
    const est = (input.flow_Nm3h * conc * 1e-6 * input.op_hours_yr) / 1000 * 3;
    fill("annual_emission_t", "연간 배출량", Math.round(est * 10) / 10, "풍량·농도·운전시간으로 추정");
  }

  // ATEX 자동
  if (input.flammable === "yes") {
    fill("atex", "ATEX", "yes", "가연성 분진 → ATEX 권장");
  } else {
    fill("atex", "ATEX", "no", "비가연성");
  }

  // 목표 배출 미입력 → 법규 기본
  fill("target_emission", "목표 배출농도", 30, "법규 일반 기준 (미입력 시)");

  return { values: v, autoFilled: auto };
}
