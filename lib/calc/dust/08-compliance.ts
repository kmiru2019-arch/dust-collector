// Stage 8-B — 법규 컴플라이언스 12항목 자동판정

import type {
  Stage8Input, Stage8Output, ClassNo, Stage1Output, Stage2Output, Stage5Output, Stage7Output,
  ObligationItem, SubsidyMatch,
} from "./types";
import { lookupDust26, PREVENTION_PLAN_THRESHOLD_M3MIN } from "@/lib/data/dust/dust26-list";
import { CONTROL_VELOCITY } from "@/lib/data/dust/kosha-controls";
import { analyzeExplosion } from "./08-safety";

/**
 * 사업장 종별 분류 (시행령 별표1의3)
 */
export function classifyBusiness(annual_emission_t: number): ClassNo {
  if (annual_emission_t >= 80) return "1종";
  if (annual_emission_t >= 20) return "2종";
  if (annual_emission_t >= 10) return "3종";
  if (annual_emission_t >= 2) return "4종";
  return "5종";
}

/**
 * 배출허용기준 (별표8) — 단순 lookup
 */
function lookupEmissionStandards(facility_type: Stage8Input["facility_type"], install_date: string): Record<string, { value: number; unit: string }> {
  const post_2015 = new Date(install_date) >= new Date("2015-01-01");
  const baseline: Record<string, { value: number; unit: string }> = {
    dust: { value: 30, unit: "mg/Sm3" },
    SO2: { value: 100, unit: "ppm" },
    NOx: { value: 100, unit: "ppm" },
    Pb: { value: 0.2, unit: "mg/Sm3" },
    Cd: { value: 0.05, unit: "mg/Sm3" },
    Hg: { value: 0.05, unit: "mg/Sm3" },
  };

  if (facility_type.includes("incineration")) {
    return {
      dust: { value: post_2015 ? 25 : 30, unit: "mg/Sm3" },
      SO2: { value: 50, unit: "ppm" },
      NOx: { value: 70, unit: "ppm" },
      HCl: { value: 20, unit: "ppm" },
      HF: { value: 2, unit: "ppm" },
      ...baseline,
      PCDD: { value: 0.1, unit: "ng-TEQ/Sm3" },
    };
  }
  if (facility_type.includes("cement") || facility_type === "kiln") {
    return { ...baseline, dust: { value: 30, unit: "mg/Sm3" } };
  }
  if (facility_type === "coal_power") {
    return { ...baseline, dust: { value: post_2015 ? 10 : 25, unit: "mg/Sm3" }, SO2: { value: 50, unit: "ppm" }, NOx: { value: 70, unit: "ppm" } };
  }
  return baseline;
}

/**
 * 안전검사 도래일 (산안법 제93조)
 * 최초: 설치+3년, 이후 2년마다
 */
function inspectionSchedule(install_date: string, years_ahead: number = 10): string[] {
  const installed = new Date(install_date);
  const first = new Date(installed);
  first.setFullYear(first.getFullYear() + 3);
  const dates: string[] = [];
  for (let i = 0; i < years_ahead; i++) {
    const d = new Date(first);
    d.setFullYear(d.getFullYear() + i * 2);
    dates.push(d.toISOString().substring(0, 10));
  }
  return dates;
}

/**
 * 보조금 매칭
 */
function matchSubsidies(input: Stage8Input, classification: ClassNo, design: { fan?: Stage7Output; explosion?: any }): SubsidyMatch[] {
  const matches: SubsidyMatch[] = [];

  if (classification === "4종" || classification === "5종") {
    matches.push({
      id: "env_smb_install",
      name: "환경부 소규모사업장 방지시설 설치지원",
      type: "grant",
      subsidy_rate: 0.90,
      max_amount_won: 300_000_000,
      deadline: "매년 초 지자체 공고",
      agency: "환경부+지자체",
      link: "https://me.go.kr/home/web/board/read.do?boardMasterId=39&boardId=1728990",
    });
  }

  const facility_age = new Date().getFullYear() - new Date(input.install_date).getFullYear();
  if (facility_age >= 10) {
    matches.push({
      id: "env_old_replace",
      name: "노후 방지시설 교체 지원",
      type: "grant",
      subsidy_rate: 0.50 + (facility_age >= 15 ? 0.20 : 0),
      max_amount_won: 500_000_000,
      agency: "환경부",
    });
  }

  if (design.fan?.fans?.some((f) => f.VFD)) {
    matches.push({
      id: "kemc_vfd",
      name: "에너지효율향상 — 인버터 보조",
      type: "grant",
      subsidy_rate: 0.30,
      agency: "한국에너지공단",
      link: "https://www.energy.or.kr/",
    });
  }

  if (design.explosion) {
    matches.push({
      id: "kosha_loan",
      name: "안전보건투자 융자 — 분진폭발 방지시설",
      type: "loan",
      interest_rate: 0.015,
      max_amount_won: 1_000_000_000,
      agency: "안전보건공단",
    });
  }

  return matches;
}

export function runStage8(
  input: Stage8Input,
  s1: Stage1Output,
  s2: Stage2Output,
  s5?: Stage5Output,
  s7?: Stage7Output
): Stage8Output {
  // 사업장 종별
  const classification = classifyBusiness(input.annual_emission_t);

  // 배출허용기준
  const standards = lookupEmissionStandards(input.facility_type, input.install_date);

  // TMS
  const TMS_required =
    classification === "1종" ||
    (classification === "2종" && (input.facility_type === "boiler" || input.facility_type.includes("incineration"))) ||
    (classification === "3종" && (input.facility_type === "boiler" || input.facility_type === "coal_power"));

  // 비산먼지 (시행규칙 별표14 — 11업종)
  const fugitive_dust_industries = [
    "cement_kiln", "cement_mill", "iron_eaf", "non_ferrous", "coal_power",
  ];
  const fugitive_dust_obligation = fugitive_dust_industries.includes(input.facility_type);

  // VOC
  const VOC_obligation = (input.VOC_use_t_yr ?? 0) > 5;

  // 분진작업 26종
  const dust26_code = (s2 as any)?.dust26_code ?? (input as any)?.dust26_code;
  const dust26 = lookupDust26(dust26_code);
  const dust26_obligations: ObligationItem[] = (dust26?.obligations ?? []).map((ob) => ({
    category: "osh",
    item: `분진작업 제${dust26?.id}호 — ${ob}`,
    required: true,
    citation: "산업안전보건기준에 관한 규칙 별표16",
  }));

  // 제어풍속 (Stage 2에서 적용된 값을 그대로 보고)
  const dust_state = s1.dust.particulate !== false ? "particle" : "gas";
  const control_velocity_m_s = CONTROL_VELOCITY[s2.hood_type][dust_state];

  // 안전검사 도래일
  const inspection_schedule = inspectionSchedule(input.install_date, 10);

  // 유해위험방지계획서
  const Q_threshold = (input as any).is_designated_chem
    ? PREVENTION_PLAN_THRESHOLD_M3MIN.designated_chem_49
    : PREVENTION_PLAN_THRESHOLD_M3MIN.general;
  const prevention_plan_required = s2.Q_hood_m3min >= Q_threshold;
  const submit_deadline = input.work_start_date
    ? new Date(new Date(input.work_start_date).getTime() - 15 * 86400000).toISOString().substring(0, 10)
    : undefined;

  // 작업환경측정
  const measurement = {
    freq: input.is_carcinogen ? ("quarterly" as const) : ("biannual" as const),
    retention_yr: input.is_carcinogen ? 30 : 5,
  };

  // 분진폭발
  const explosion = analyzeExplosion(s1, 30);

  // 폐기물·화관·위험물 의무
  const waste_obligations: ObligationItem[] = [];
  if (input.facility_type.includes("incineration")) {
    waste_obligations.push({
      category: "waste",
      item: "대기방지시설 4단 의무 (집진+산성가스+NOx+다이옥신)",
      required: true,
      citation: "폐기물관리법 시행규칙 별표9",
    });
  }

  const chemical_obligations: ObligationItem[] = [];
  if (input.handles_hazardous_chemicals) {
    chemical_obligations.push({
      category: "chemical",
      item: "강제배기 ≥18 m³/h·m² + 배기구 2m이상",
      required: true,
      citation: "화학물질관리법 시행규칙 별표5",
    });
  }
  if (input.handles_hazardous_substances) {
    chemical_obligations.push({
      category: "hazardous",
      item: "환기구 바닥 2m이상 + 인화방지망",
      required: true,
      citation: "위험물안전관리법 시행규칙 별표18",
    });
  }

  // 환경영향평가
  const eia_required =
    (input.facility_size_m2 ?? 0) >= 30000 || (input.is_industrial_complex ?? false);

  // 보조금
  const subsidies = matchSubsidies(input, classification, { fan: s7, explosion });

  // 인용
  const citations = [
    "대기환경보전법 시행령 별표1의3",
    "동 시행규칙 별표8",
    "산업안전보건법 제93조",
    "동 법 제48조",
    "동 법 제125조",
    "산업안전보건기준에 관한 규칙 별표13",
    "산업안전보건기준에 관한 규칙 별표16",
    "KOSHA W-1-2019",
    "KOSHA D-43-2012",
  ];

  return {
    classification,
    emission_standards: standards,
    TMS_required,
    fugitive_dust_obligation,
    VOC_obligation,
    dust26_obligations,
    control_velocity_m_s,
    inspection_schedule,
    prevention_plan: { required: prevention_plan_required, deadline: submit_deadline },
    measurement,
    explosion,
    waste_obligations,
    chemical_obligations,
    eia_required,
    subsidies,
    citations,
    disclaimer:
      "본 컴플라이언스 평가는 입력값 기반 자동 추정이며, 법적 효력 또는 인증을 대체하지 않습니다. 실제 인허가·안전검사·인증은 관할기관(환경부·안전보건공단·ATEX 공인기관)을 통해 진행하십시오. 분진폭발 평가는 KOSHA D-43-2012 및 NFPA 68 식 기반이며, ATEX/IECEx 인증을 대체하지 않습니다.",
  };
}
