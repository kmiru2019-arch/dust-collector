// 법규 룰셋 시드 데이터 (TS 임베드 — YAML 대체)
// 출처: 대기환경보전법 시행령·시행규칙, 산안법, KOSHA Guide

/**
 * 사업장 종별 분류 (시행령 별표1의3)
 */
export const BUSINESS_CLASSIFICATION = [
  { emission_min_t: 80, class: "1종" as const },
  { emission_min_t: 20, class: "2종" as const },
  { emission_min_t: 10, class: "3종" as const },
  { emission_min_t: 2,  class: "4종" as const },
  { emission_min_t: 0,  class: "5종" as const },
];

/**
 * 배출허용기준 (시행규칙 별표8) — 시점·시설별
 */
export const EMISSION_STANDARDS = [
  {
    facility_type: "msw_incineration",
    install_after: "2015-01-01",
    region: "general",
    limits: {
      dust: { value: 25, unit: "mg/Sm3" },
      SO2: { value: 50, unit: "ppm" },
      NOx: { value: 70, unit: "ppm" },
      HCl: { value: 20, unit: "ppm" },
      HF: { value: 2, unit: "ppm" },
      Hg: { value: 0.05, unit: "mg/Sm3" },
      Pb: { value: 0.2, unit: "mg/Sm3" },
      Cd: { value: 0.05, unit: "mg/Sm3" },
      PCDD: { value: 0.1, unit: "ng-TEQ/Sm3" },
    },
  },
  {
    facility_type: "msw_incineration",
    install_after: "1900-01-01",  // 기존시설
    region: "general",
    limits: {
      dust: { value: 30, unit: "mg/Sm3" },
      SO2: { value: 70, unit: "ppm" },
      NOx: { value: 100, unit: "ppm" },
      HCl: { value: 25, unit: "ppm" },
      Hg: { value: 0.08, unit: "mg/Sm3" },
      PCDD: { value: 5, unit: "ng-TEQ/Sm3" },
    },
  },
  {
    facility_type: "coal_power",
    install_after: "2015-01-01",
    region: "general",
    limits: {
      dust: { value: 10, unit: "mg/Sm3" },
      SO2: { value: 50, unit: "ppm" },
      NOx: { value: 70, unit: "ppm" },
    },
  },
  {
    facility_type: "cement_kiln",
    install_after: "2015-01-01",
    region: "general",
    limits: {
      dust: { value: 30, unit: "mg/Sm3" },
      SO2: { value: 200, unit: "ppm" },
      NOx: { value: 270, unit: "ppm" },
    },
  },
  {
    facility_type: "boiler",
    install_after: "2015-01-01",
    region: "general",
    limits: {
      dust: { value: 30, unit: "mg/Sm3" },
      SO2: { value: 100, unit: "ppm" },
      NOx: { value: 100, unit: "ppm" },
    },
  },
];

/**
 * 비산먼지 발생사업 (시행규칙 별표14) — 11개 업종
 */
export const FUGITIVE_DUST_INDUSTRIES = [
  "cement_lime_plaster",
  "primary_metal",
  "fertilizer_feed",
  "construction",
  "transport_powder",
  "mining_crushing",
  "outdoor_cutting_grinding",
  "open_storage",
  "loading_unloading",
  "glass_ceramic",
  "coal_coke_storage",
];

/**
 * KOSHA 별표13 제어풍속 (이미 kosha-controls.ts에 임베드됨)
 */

/**
 * 분진작업 26종 의무 (이미 dust26-list.ts)
 */

/**
 * 보조금 룰셋
 */
export const SUBSIDY_RULES = [
  {
    id: "env_smb_install",
    name: "환경부 소규모사업장 방지시설 설치지원",
    eligibility: { class_in: ["4종", "5종"] },
    type: "grant" as const,
    subsidy_rate: 0.90,
    max_amount: 300_000_000,
    cycle: "annual",
    agency: "환경부+지자체",
    link: "https://me.go.kr/home/web/board/read.do?boardMasterId=39&boardId=1728990",
  },
  {
    id: "env_old_replace_15y",
    name: "노후 방지시설 교체 지원 (15년 이상)",
    eligibility: { facility_age_min: 15 },
    type: "grant" as const,
    subsidy_rate: 0.70,
    max_amount: 500_000_000,
    agency: "환경부",
  },
  {
    id: "env_old_replace_10y",
    name: "노후 방지시설 교체 지원 (10년 이상)",
    eligibility: { facility_age_min: 10, facility_age_max: 14 },
    type: "grant" as const,
    subsidy_rate: 0.50,
    max_amount: 500_000_000,
    agency: "환경부",
  },
  {
    id: "kemc_vfd",
    name: "에너지효율향상 — 인버터 보조",
    eligibility: { motor_kW_min: 30, VFD_required: true },
    type: "grant" as const,
    subsidy_rate: 0.30,
    agency: "한국에너지공단",
    link: "https://www.energy.or.kr/",
  },
  {
    id: "kosha_loan_explosion",
    name: "안전보건투자 융자 — 분진폭발 방지시설",
    eligibility: { explosion_protection: true },
    type: "loan" as const,
    interest_rate: 0.015,
    max_amount: 1_000_000_000,
    agency: "안전보건공단",
  },
  {
    id: "seoul_local",
    name: "서울시 방지시설 추가지원",
    eligibility: { region: "seoul", class_in: ["3종", "4종", "5종"] },
    type: "grant" as const,
    subsidy_rate: 0.10, // 추가
    agency: "서울특별시",
  },
];

/**
 * 안전검사 도래일 계산
 * 최초: 설치+3년, 정기: 이후 2년마다
 */
export function calcInspectionSchedule(install_date: string, years_ahead: number = 10): string[] {
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
