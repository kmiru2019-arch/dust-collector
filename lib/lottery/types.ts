// 로또 6/45 추출기 — 공용 타입 정의
//
// ⚠️ 중요한 수학적 사실:
//   로또 6/45는 매 회차가 완전히 독립적이고 균등한 추첨이다.
//   과거 데이터 분석으로 "당첨 확률 자체"를 높이는 것은 불가능하다.
//   본 엔진의 목적은 (1) 통계의 투명한 제시, (2) 역대 당첨조합의 구조적
//   특성에 부합하는 조합 생성, (3) 다수가 선택하는 조합 회피를 통한
//   "당첨 시 실수령 기대값" 최적화이다. 확률 향상이 아니다.

export const LOTTO_MAX = 45; // 1~45
export const LOTTO_PICK = 6; // 6개 선택
/** C(45,6) = 전체 가능한 조합 수 */
export const TOTAL_COMBINATIONS = 8_145_060;

/** 한 회차의 추첨 결과 */
export interface Draw {
  /** 회차 번호 */
  round: number;
  /** 당첨번호 6개 (오름차순 권장) */
  numbers: number[];
  /** 보너스 번호 */
  bonus: number;
  /** 추첨일 (YYYY-MM-DD, 선택) */
  date?: string;
}

/** 번호별 통계 */
export interface NumberStat {
  /** 번호 (1~45) */
  n: number;
  /** 본번호로 등장한 총 횟수 */
  count: number;
  /** 보너스로 등장한 횟수 */
  bonusCount: number;
  /** 본번호 출현 비율 (count / totalDraws) */
  freqRate: number;
  /** 기대 출현 비율 대비 (1.0 = 평균) */
  freqIndex: number;
  /** 마지막으로 본번호로 나온 회차 (없으면 null) */
  lastSeenRound: number | null;
  /** 마지막 출현 이후 경과 회차 수 (미출현 기간) */
  gap: number;
}

/** 전체 분석 결과 */
export interface DrawStats {
  totalDraws: number;
  latestRound: number;
  perNumber: NumberStat[];
  /** 출현빈도 상위 번호 */
  hot: number[];
  /** 출현빈도 하위 번호 */
  cold: number[];
  /** 미출현 기간 상위(오래 안 나온) 번호 */
  overdue: number[];
  /** 본번호 6개 합계 통계 */
  sum: { min: number; max: number; mean: number; p10: number; p90: number };
  /** 홀:짝 분포 ("4:2" → 발생 횟수) */
  oddEven: Record<string, number>;
  /** 저(1~22):고(23~45) 분포 */
  lowHigh: Record<string, number>;
  /** 연속수(인접) 쌍을 1개 이상 포함한 회차 비율 (0~1) */
  consecutiveRate: number;
  /** 10단위 구간(1-9,10-19,20-29,30-39,40-45)별 출현 횟수 */
  decadeCounts: number[];
}

/** 추출 전략 */
export type Strategy =
  | "balanced" // 균형: 균등 가중 + 구조 제약 (추천)
  | "frequency" // 빈도: 자주 나온 번호 가중
  | "overdue" // 미출현: 오래 안 나온 번호 가중
  | "hybrid"; // 혼합: 빈도 + 미출현 + 기준값 블렌드

/** 생성 옵션 */
export interface GenerateOptions {
  /** 생성할 게임(라인) 수 */
  lines: number;
  /** 전략 */
  strategy: Strategy;
  /** 재현용 시드 (같은 시드 → 같은 결과) */
  seed?: number;
  /** 항상 포함할 번호 (고정수) */
  include?: number[];
  /** 절대 제외할 번호 */
  exclude?: number[];
  /** 다수가 찍는 인기 조합 회피 (당첨 시 분배 최소화) */
  avoidPopular?: boolean;
  /** 구조 제약 적용 여부 */
  enforceStructure?: boolean;
  /** 분배 위험 최소화 — 안전도 높은 조합 우선 선택 (실수령 기대값↑) */
  optimizePayout?: boolean;
}

/** 생성된 한 게임의 평가 메타 */
export interface LineMeta {
  sum: number;
  odd: number;
  even: number;
  low: number;
  high: number;
  maxConsecutive: number;
  decades: number; // 서로 다른 10단위 구간 개수
  acValue: number; // 산술 복잡도 (Arithmetic Complexity)
}

/** 생성된 한 게임 */
export interface GeneratedLine {
  numbers: number[];
  meta: LineMeta;
}

export interface GenerateResult {
  lines: GeneratedLine[];
  strategy: Strategy;
  seed: number;
}
