// 당첨 시 "분배 위험" 점수 + 정직한 손익(기대값) 계산.
//
// ⚠️ 다시 강조: 아래 어떤 값도 당첨 확률을 바꾸지 않는다.
//   splitRisk는 "이 조합을 다른 사람도 골랐을 가능성"의 휴리스틱 추정으로,
//   당첨됐을 때 1·2등 당첨금을 나눠 가질 인원(=실수령액)에만 영향을 준다.
import { lineMeta, acValue, decadeIndex } from "./stats";
import { type PrizeRank } from "./types";
import { prizeProbability, atLeastOnePrizeProbability, FIXED_PRIZE_KRW } from "./probability";

/**
 * 분배 위험 점수 (0~100). 높을수록 "남들도 많이 고르는 흔한 조합" → 당첨 시 분배 손해.
 * 사람들이 실제로 자주 선택하는 패턴(생일·연속·등차·규칙성)에 가중.
 */
export function splitRisk(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const m = lineMeta(sorted);
  let risk = 0;

  // 1) 생일(1~31) 군집 — 가장 강력한 편향
  const le31 = sorted.filter((n) => n <= 31).length;
  risk += Math.max(0, le31 - 3) * 11; // 4개=11, 5개=22, 6개=33
  const le12 = sorted.filter((n) => n <= 12).length; // 월(1~12)까지 겹치면 더 흔함
  risk += Math.max(0, le12 - 3) * 4;

  // 2) 연속수
  if (m.maxConsecutive >= 4) risk += 28;
  else if (m.maxConsecutive === 3) risk += 14;
  else if (m.maxConsecutive === 2) risk += 5;

  // 3) 등차/규칙성 (AC value 낮음)
  const ac = acValue(sorted);
  if (ac <= 3) risk += 24;
  else if (ac <= 5) risk += 10;

  // 4) 끝수 쏠림 (5,15,25,35,45 류)
  const ends = new Set(sorted.map((n) => n % 10));
  if (ends.size <= 2) risk += 16;
  else if (ends.size === 3) risk += 6;

  // 5) 한 10단위 구간 몰림
  const buckets = [0, 0, 0, 0, 0];
  for (const n of sorted) buckets[decadeIndex(n)]++;
  if (Math.max(...buckets) >= 4) risk += 14;

  // 6) 모두 5의 배수 / 모두 짝수·홀수 등 단순 규칙
  if (sorted.every((n) => n % 5 === 0)) risk += 12;
  if (m.odd === 0 || m.odd === 6) risk += 8;

  return Math.min(100, Math.round(risk));
}

/** 실수령 안전도 (0~100). 높을수록 당첨 시 단독 수령 가능성↑ */
export function payoutSafety(numbers: number[]): number {
  return 100 - splitRisk(numbers);
}

export interface TicketEvaluation {
  lines: number;
  costKRW: number; // 총 구매비 (1게임 1,000원)
  pJackpot: number; // 1등 1회 이상 확률
  pAnyPrize: number; // 5등 이상 1회 이상 확률
  evFixedKRW: number; // 4·5등 고정당첨금 기대수익
  netExpectedKRW: number; // 기대 손익 (고정등수 기준, 변동등수 제외)
  avgSafety: number; // 평균 실수령 안전도
  perRank: Record<PrizeRank, number>; // N게임 기준 등수별 1회↑ 확률
}

/** 여러 게임(라인)의 정직한 확률·손익 평가 */
export function evaluateTicket(lines: number[][]): TicketEvaluation {
  const n = lines.length;
  const pAnyPrize = atLeastOnePrizeProbability(n);
  const pJackpot = 1 - Math.pow(1 - prizeProbability(1), n);

  // 등수별 "1회 이상" 확률 (독립 근사)
  const perRank = {} as Record<PrizeRank, number>;
  for (const r of [1, 2, 3, 4, 5] as PrizeRank[]) {
    perRank[r] = 1 - Math.pow(1 - prizeProbability(r), n);
  }

  // 고정등수(4·5등) 기대수익 = n × Σ p_r × 상금
  let evPerLine = 0;
  for (const r of [4, 5] as PrizeRank[]) {
    evPerLine += prizeProbability(r) * (FIXED_PRIZE_KRW[r] ?? 0);
  }
  const evFixedKRW = evPerLine * n;
  const costKRW = n * 1000;

  const avgSafety = n
    ? Math.round(lines.reduce((a, l) => a + payoutSafety(l), 0) / n)
    : 0;

  return {
    lines: n,
    costKRW,
    pJackpot,
    pAnyPrize,
    evFixedKRW,
    netExpectedKRW: evFixedKRW - costKRW,
    avgSafety,
    perRank,
  };
}
