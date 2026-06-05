// 산업안전보건기준에 관한 규칙 별표16 — 분진작업 26종
// 출처: 산업안전보건기준에 관한 규칙 별표16 (2024 개정 기준)

export interface Dust26Item {
  id: number;
  desc: string;
  obligations: Array<
    | "isolation_required"      // 밀폐 의무
    | "LEV_required"            // 국소배기 의무
    | "general_ventilation"     // 전체환기
    | "respirator_required"     // 호흡보호구
    | "safety_inspection_3y_then_2y"
    | "explosion_protection"
    | "ATEX_certification_recommended"
    | "carcinogen_handling"
    | "measurement_periodic"
  >;
  recommended_collector?: string;
  recommended_media?: string;
  notes?: string;
}

export const DUST_WORKS_26: Dust26Item[] = [
  { id: 1,  desc: "갱내에서 광물 채굴·운반·파쇄", obligations: ["isolation_required", "LEV_required", "respirator_required"] },
  { id: 2,  desc: "갱외 광물 채굴", obligations: ["respirator_required"] },
  { id: 3,  desc: "광물 분쇄/연마 (밀폐 외)", obligations: ["LEV_required", "safety_inspection_3y_then_2y"] },
  { id: 4,  desc: "광물 분쇄/연마 (밀폐 내)", obligations: ["isolation_required", "LEV_required"] },
  { id: 5,  desc: "광물·암석 운반", obligations: ["LEV_required"] },
  { id: 6,  desc: "광물·암석 절단", obligations: ["LEV_required"] },
  { id: 7,  desc: "광물·암석 조각/마무리", obligations: ["LEV_required"] },
  { id: 8,  desc: "시멘트 제조", obligations: ["isolation_required", "LEV_required"], recommended_collector: "ep_or_bag" },
  { id: 9,  desc: "도자기·내화물 제조", obligations: ["LEV_required"] },
  { id: 10, desc: "광물 조쇄·분쇄", obligations: ["LEV_required"] },
  { id: 11, desc: "곡물 분쇄·계량", obligations: ["LEV_required", "explosion_protection", "ATEX_certification_recommended"], recommended_collector: "cyclone+bag", notes: "곡분 폭발성 (Kst 100~250)" },
  { id: 12, desc: "사료 제조", obligations: ["LEV_required"] },
  { id: 13, desc: "목재 분쇄", obligations: ["LEV_required", "explosion_protection", "ATEX_certification_recommended"], recommended_collector: "cyclone+bag", notes: "목분 폭발성 (Kst 100~200)" },
  { id: 14, desc: "펄프 제조", obligations: ["LEV_required"] },
  { id: 15, desc: "카본블랙·흑연 분쇄", obligations: ["LEV_required"] },
  { id: 16, desc: "석면 취급", obligations: ["isolation_required", "carcinogen_handling", "measurement_periodic"], notes: "1군 발암물질 — 밀폐 절대의무" },
  { id: 17, desc: "주물사 처리", obligations: ["LEV_required"] },
  { id: 18, desc: "금속 용해·주조", obligations: ["LEV_required", "safety_inspection_3y_then_2y"] },
  { id: 19, desc: "금속 용접·용단", obligations: ["LEV_required", "measurement_periodic"], recommended_collector: "cartridge", recommended_media: "PTFE_membrane" },
  { id: 20, desc: "금속 연삭·연마", obligations: ["LEV_required"] },
  { id: 21, desc: "금속 주조", obligations: ["LEV_required"] },
  { id: 22, desc: "도료 분무 도장", obligations: ["LEV_required"], notes: "VOC 배출시설 별도 적용" },
  { id: 23, desc: "시멘트 제품 제조", obligations: ["LEV_required"] },
  { id: 24, desc: "모래 분사 (블라스팅)", obligations: ["LEV_required", "isolation_required", "respirator_required"] },
  { id: 25, desc: "분체 충전·분포·계량", obligations: ["LEV_required"] },
  { id: 26, desc: "그밖에 분진 발생 작업", obligations: ["LEV_required"] },
];

/**
 * 배풍량 의무 트리거 (유해위험방지계획서)
 * 49종 안전검사대상물질 → 60 m³/min
 * 그 외 + 분진작업 5~25호 → 150 m³/min
 */
export const PREVENTION_PLAN_THRESHOLD_M3MIN = {
  designated_chem_49: 60,
  general: 150,
};

export function lookupDust26(code: number | undefined): Dust26Item | undefined {
  if (code == null) return undefined;
  return DUST_WORKS_26.find((d) => d.id === code);
}
