// Concept Workflow 공통 타입
// Brief (사용자 요구사항) → Concept (3안) → 결정 → 8단 정밀설계

import type { IndustryCode, TreatmentType, CollectorPrimary, MediaCode, CondenserType, FanArrangement } from "@/lib/calc/dust/types";

// ───────── Brief (Tier 1 — 사용자 필수 입력 6~8개) ─────────
export interface Brief {
  // 1. 공정
  industry: IndustryCode;
  process_note?: string;

  // 2~3. 풍량·온도
  flowrate_Nm3h: number;          // 처리 풍량 (Nm³/h)
  T_in_C: number;                 // 가스 입구 온도
  T_target_out_C?: number;        // 목표 출구 온도 (응축기 후, 비우면 자동)

  // 4. 분진
  inlet_conc_g_Nm3?: number;      // 비우면 산업 평균

  // 5. 목표
  target_emission_mg_Sm3?: number; // 비우면 법규 자동

  // 6. 제약 (체크박스)
  constraints: {
    no_wastewater?: boolean;       // 폐수 불가
    tight_space?: boolean;         // 부지 협소
    atex_required?: boolean;       // ATEX 인증 필요
    budget_cap_won?: number;       // 예산 상한
  };

  // 7. 시설
  region: string;                  // 소재지 (시·도)
  install_date: string;            // 신·증설일 ISO

  // 8. 운전
  op_hours_yr: number;             // 운전 시간 (h/yr)

  // 예산 등급 (선택)
  budget_class?: "low" | "medium" | "high";
}

// ───────── Concept (안 1개) ─────────
export interface ConceptStage {
  // 라인업 구성 (직렬)
  pretreatment?: string;           // quench / GGH / boiler_HX
  primary: CollectorPrimary;       // 1차 집진
  secondary?: CollectorPrimary;    // 2차 (직렬)
  reagent?: string;                // SDA: Ca(OH)2, AC injection
  collector_media?: MediaCode;
  condenser?: CondenserType | null;
  fan_arrangement: FanArrangement;
}

export interface ConceptPerformance {
  efficiency_PM: number;           // 0~1
  efficiency_PM25?: number;
  removal_HCl?: number;
  removal_SO2?: number;
  removal_Hg?: number;
  removal_dioxin?: number;
}

export interface ConceptCost {
  capex_won: number;
  opex_won_yr: number;
  tco_5yr_won: number;
  capex_breakdown?: { item: string; won: number }[];
}

export interface ConceptTradeoff {
  pros: string[];                  // ✓ 장점
  cons: string[];                  // ⚠ 검토할 점
  fatal?: string[];                // ❌ 치명적 문제 (제외 사유)
  regulatory: string[];            // 📋 법규
}

export interface Concept {
  id: string;                      // "concept_dry" | "concept_wet" | "concept_semidry"
  treatment: TreatmentType;
  label: string;                   // "반건식 SDA + 백필터"
  stages: ConceptStage;
  performance: ConceptPerformance;
  cost: ConceptCost;
  tradeoff: ConceptTradeoff;
  feasible: boolean;               // 제약 위배 시 false
  rejection_reason?: string;       // feasible=false 사유
  score: number;                   // 0~100 종합점수
  rank?: number;                   // 1, 2, 3
  confidence: number;              // 0~1 추정 정확도 (예: 0.9)
}

export interface ConceptSet {
  brief: Brief;
  concepts: Concept[];             // 2~3안
  recommended_id: string;          // 1순위
  recommendation_rationale: string;
  generated_at?: string;
}

// ───────── Q&A 시나리오 ─────────
export interface QAScenario {
  id: string;
  category: "collector" | "reagent" | "temperature" | "fan" | "safety" | "cost" | "regulatory";
  question: string;                // "사이클론을 앞에 추가하면?"
  applies_to: (c: Concept, b: Brief) => boolean; // 이 시나리오가 적용 가능한가
}

export interface QAAnswer {
  scenario_id: string;
  text: string;
  delta?: {
    label: string;
    before: string;
    after: string;
  }[];
  recommendation?: "권장" | "비권장" | "조건부";
  confidence: number;
  trace?: string;                  // 계산 근거
}

// ───────── 설비 외형·배치 ─────────
export interface EquipmentDimension {
  type: string;                    // baghouse / cyclone / ep / sda ...
  W_mm?: number;                   // 폭
  D_mm?: number;                   // 깊이 (또는 본체 직경)
  H_mm: number;                    // 높이
  inlet_dia_mm?: number;           // 입구 노즐 Ø
  outlet_dia_mm?: number;          // 출구 노즐 Ø
  clearance_mm: number;            // 점검·정비 이격
  hopper_H_mm?: number;            // 호퍼 추가 높이
  note?: string;
}

export interface LayoutSegment {
  id: string;
  from: string;                    // 설비 코드
  to: string;
  length_m: number;                // 표준 최단 길이
  elbow_90?: number;
  elbow_45?: number;
  tee?: number;
  expansion?: number;
}

export interface StandardLayout {
  segments: LayoutSegment[];
  total_length_m: number;
  footprint_W_m: number;           // 필요 부지 폭
  footprint_D_m: number;           // 필요 부지 깊이
  max_height_m: number;
}
