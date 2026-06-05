// Q&A 시나리오 — 미리 정의된 대화형 질의응답 (룰엔진 기반)
// 각 답변은 계산 근거(trace) 포함, Claude API 불필요

import type { Brief, Concept, QAAnswer } from "./types";
import { estimateCapex, estimateOpex } from "./rules";

export interface QAItem {
  id: string;
  category: string;
  question: string;
  applies: (c: Concept, b: Brief) => boolean;
  answer: (c: Concept, b: Brief) => QAAnswer;
}

const Q = (brief: Brief) => brief.flowrate_Nm3h / 60; // m³/min

export const QA_SCENARIOS: QAItem[] = [
  // ── 집진기 구성 ──
  {
    id: "add_cyclone",
    category: "collector",
    question: "앞에 사이클론을 추가하면?",
    applies: (c) => c.stages.primary === "bag_filter" && c.stages.secondary !== "cyclone",
    answer: (c, b) => {
      const addCapex = estimateCapex(Q(b), "dry") * 0.25;
      return {
        scenario_id: "add_cyclone",
        text: "사이클론 1단 추가 시: 조분 70~90% 사전 제거 → 백필터 부하 감소, 수명 3~5배 연장.",
        delta: [
          { label: "CAPEX", before: `${(c.cost.capex_won / 1e8).toFixed(1)}억`, after: `+${(addCapex / 1e8).toFixed(1)}억` },
          { label: "백필터 수명", before: "기준", after: "3~5배" },
          { label: "폭발성 분진 안전", before: "백필터만", after: "사이클론 1차 격리" },
        ],
        recommendation: "권장",
        confidence: 0.9,
        trace: "사이클론 Stairmand HE 설치비 = 백필터 CAPEX의 ~25%",
      };
    },
  },
  {
    id: "remove_secondary",
    category: "collector",
    question: "2차 집진기를 빼고 1개만 쓰면?",
    applies: (c) => !!c.stages.secondary,
    answer: (c) => ({
      scenario_id: "remove_secondary",
      text: "2차 집진기 제거 시 CAPEX 절감되나, 효율·법규 미달 위험. 1차 단독 효율을 먼저 확인하세요.",
      delta: [
        { label: "효율", before: `${(c.performance.efficiency_PM * 100).toFixed(1)}%`, after: "1차 단독 효율로 저하" },
        { label: "CAPEX", before: "기준", after: "감소" },
      ],
      recommendation: "조건부",
      confidence: 0.85,
      trace: "1차 단독으로 목표 배출농도 만족 시에만 권장",
    }),
  },
  // ── 약품 (SDA/AC) ──
  {
    id: "reduce_ac",
    category: "reagent",
    question: "활성탄 주입량을 줄이면?",
    applies: (c) => c.treatment.includes("AC"),
    answer: () => ({
      scenario_id: "reduce_ac",
      text: "활성탄 100→50 mg/Nm³ 감량 시: Hg 처리율 85→65%, 다이옥신 95→85%. 환경부 Hg 0.05 mg/Sm³는 통과 가능하나 마진 감소.",
      delta: [
        { label: "Hg 처리율", before: "85%", after: "65%" },
        { label: "다이옥신", before: "95%", after: "85%" },
        { label: "활성탄 비용", before: "기준", after: "-47%" },
      ],
      recommendation: "조건부",
      confidence: 0.8,
      trace: "PAC 주입량-Hg 흡착 등온식 기반. 실측 검증 권장",
    }),
  },
  {
    id: "increase_ca_s",
    category: "reagent",
    question: "소석회(Ca/S) 비율을 높이면?",
    applies: (c) => c.treatment.includes("SDA"),
    answer: () => ({
      scenario_id: "increase_ca_s",
      text: "Ca/S 1.6→2.0 증가 시: SO₂/HCl 제거율 향상, 단 슬러지 발생량·약품비 증가.",
      delta: [
        { label: "SO₂ 제거", before: "95%", after: "98%" },
        { label: "슬러지", before: "기준", after: "+25%" },
        { label: "약품비", before: "기준", after: "+25%" },
      ],
      recommendation: "조건부",
      confidence: 0.85,
    }),
  },
  // ── 온도 ──
  {
    id: "lower_outlet_temp",
    category: "temperature",
    question: "출구 온도를 더 낮추면?",
    applies: (c) => !!c.stages.condenser,
    answer: () => ({
      scenario_id: "lower_outlet_temp",
      text: "출구온도 추가 냉각 시 폐열 회수 ↑, 단 황산노점 이하로 내려가면 산응축·부식 위험. 노점+20K 마진 필수.",
      delta: [
        { label: "폐열 회수", before: "기준", after: "증가" },
        { label: "산응축 위험", before: "안전", after: "노점 근접 시 발생" },
      ],
      recommendation: "조건부",
      confidence: 0.88,
      trace: "Verhoff-Banchero 황산노점 + 20K 마진 룰",
    }),
  },
  // ── 송풍기 ──
  {
    id: "single_to_double_fan",
    category: "fan",
    question: "송풍기를 1팬에서 2팬(FD+ID)으로?",
    applies: (c) => c.stages.fan_arrangement === "1_ID",
    answer: () => ({
      scenario_id: "single_to_double_fan",
      text: "FD+ID 2팬 구성 시: 총 정압 분담 → 각 팬 마진 확보, 균압운전 가능. 단 CAPEX·제어 복잡도 증가. 고정압(>600mmAq)·다지점·SDA 시 권장.",
      delta: [
        { label: "팬 수", before: "1대 (ID)", after: "2대 (FD+ID)" },
        { label: "CAPEX", before: "기준", after: "+40%" },
        { label: "운전 안정성", before: "부압", after: "균압 가능" },
      ],
      recommendation: "조건부",
      confidence: 0.85,
    }),
  },
  {
    id: "add_vfd",
    category: "fan",
    question: "인버터(VFD)를 적용하면?",
    applies: () => true,
    answer: (c, b) => ({
      scenario_id: "add_vfd",
      text: "VFD 적용 시 부분부하에서 전력 30~50% 절감 (어피니티 P∝N³). 부하변동 >20%, 운전 >4000h, 모터 ≥30kW 시 회수 1.5~2년.",
      delta: [
        { label: "전력 절감", before: "댐퍼 제어", after: "30~50% 절감" },
        { label: "회수 기간", before: "-", after: "1.5~2년" },
      ],
      recommendation: b.op_hours_yr > 4000 ? "권장" : "조건부",
      confidence: 0.9,
      trace: "어피니티 법칙 P ∝ (N/N_max)³",
    }),
  },
  // ── 안전 ──
  {
    id: "atex_cost",
    category: "safety",
    question: "ATEX 방폭 인증 비용 영향은?",
    applies: (c) => c.treatment.includes("explosion") || c.tradeoff.regulatory.some((r) => r.includes("ATEX")),
    answer: (c) => ({
      scenario_id: "atex_cost",
      text: "ATEX/IECEx 인증 시: 폭발벤트(NFPA68)·격리밸브(NFPA69)·방폭전기기기 추가. CAPEX +15~20%. 가연성 분진(ST1+) 법적 필수.",
      delta: [
        { label: "CAPEX", before: `${(c.cost.capex_won / 1e8).toFixed(1)}억`, after: "+15~20%" },
        { label: "안전", before: "기본", after: "분진폭발 대응" },
      ],
      recommendation: "권장",
      confidence: 0.85,
      trace: "KOSHA D-43 + NFPA 68/69",
    }),
  },
  // ── 비용 ──
  {
    id: "tco_breakdown",
    category: "cost",
    question: "5년 TCO 구성을 자세히?",
    applies: () => true,
    answer: (c) => ({
      scenario_id: "tco_breakdown",
      text: `5년 TCO ${(c.cost.tco_5yr_won / 1e8).toFixed(0)}억원 = 초기 CAPEX ${(c.cost.capex_won / 1e8).toFixed(1)}억 + 연 OPEX ${(c.cost.opex_won_yr / 1e8).toFixed(2)}억 × 5년.`,
      delta: [
        { label: "CAPEX", before: "", after: `${(c.cost.capex_won / 1e8).toFixed(1)}억` },
        { label: "연 OPEX", before: "", after: `${(c.cost.opex_won_yr / 1e8).toFixed(2)}억` },
        { label: "5년 합계", before: "", after: `${(c.cost.tco_5yr_won / 1e8).toFixed(0)}억` },
      ],
      confidence: 0.8,
    }),
  },
  {
    id: "subsidy",
    category: "regulatory",
    question: "정부 보조금 받을 수 있나?",
    applies: () => true,
    answer: () => ({
      scenario_id: "subsidy",
      text: "4·5종 사업장은 환경부 소규모사업장 방지시설 설치지원 (90% 국비+지방비). 노후(10년+) 교체 50~70%. VFD 적용 시 에너지효율 보조 30%.",
      recommendation: "권장",
      confidence: 0.85,
      trace: "환경부 정부지원 환경사업 종합안내서 2025",
    }),
  },
];

/**
 * 특정 Concept·Brief에 적용 가능한 Q&A만 필터
 */
export function getApplicableQA(concept: Concept, brief: Brief): QAItem[] {
  return QA_SCENARIOS.filter((qa) => {
    try { return qa.applies(concept, brief); } catch { return false; }
  });
}
