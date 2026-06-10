// 로또 6/45 확률·기대값 — 조합론 기반 (근사 없음, 정확값)
//
// 등수 정의 (대한민국 로또 6/45):
//   1등: 본번호 6개 일치
//   2등: 본번호 5개 + 보너스 일치
//   3등: 본번호 5개 일치 (보너스 불일치)
//   4등: 본번호 4개 일치 (고정 50,000원)
//   5등: 본번호 3개 일치 (고정 5,000원)

import { TOTAL_COMBINATIONS } from "./types";

export type PrizeRank = 1 | 2 | 3 | 4 | 5;

/**
 * 각 등수에 해당하는 "당첨 조합 경우의 수".
 *   1등: C(6,6) = 1
 *   2등: C(6,5)·1(보너스) = 6
 *   3등: C(6,5)·C(38,1) = 228  (5개 일치 234가지 중 2등 6가지 제외)
 *   4등: C(6,4)·C(39,2) = 11,115
 *   5등: C(6,3)·C(39,3) = 182,780
 */
export const PRIZE_WAYS: Record<PrizeRank, number> = {
  1: 1,
  2: 6,
  3: 228,
  4: 11_115,
  5: 182_780,
};

/** 고정 당첨금 (1~3등은 변동/pari-mutuel이라 제외) */
export const FIXED_PRIZE_KRW: Partial<Record<PrizeRank, number>> = {
  4: 50_000,
  5: 5_000,
};

/** 1게임에서 특정 등수에 당첨될 확률 */
export function prizeProbability(rank: PrizeRank): number {
  return PRIZE_WAYS[rank] / TOTAL_COMBINATIONS;
}

/** 당첨 조합 총 경우의 수 (1~5등 합) */
export function totalWinningWays(): number {
  return (Object.values(PRIZE_WAYS) as number[]).reduce((a, b) => a + b, 0);
}

/** 1게임에서 "5등 이상(=무언가 당첨)"이 될 확률 */
export function anyPrizeProbabilityPerLine(): number {
  return totalWinningWays() / TOTAL_COMBINATIONS;
}

/**
 * N게임 구매 시 "최소 1게임이 당첨(5등 이상)"될 확률.
 * 서로 다른 조합이면 독립에 가깝다(미세하게 음의 상관) — 1-(1-p)^N 근사가 사실상 정확.
 */
export function atLeastOnePrizeProbability(lines: number): number {
  const p = anyPrizeProbabilityPerLine();
  return 1 - Math.pow(1 - p, Math.max(0, lines));
}

/** 특정 목표 확률(예: 0.25)을 넘기려면 최소 몇 게임이 필요한가 */
export function linesForTargetProbability(target: number): number {
  const p = anyPrizeProbabilityPerLine();
  if (target <= 0) return 0;
  if (target >= 1) return Infinity;
  return Math.ceil(Math.log(1 - target) / Math.log(1 - p));
}

/**
 * 고정 당첨금(4·5등)만으로 계산한 1게임 기대수익(원).
 * 1~3등은 당첨금이 변동/분배이므로 별도. 이 값만으로는 항상 마이너스(=손실)다.
 */
export function expectedValueFixedTiers(): number {
  let ev = 0;
  for (const r of [4, 5] as PrizeRank[]) {
    ev += prizeProbability(r) * (FIXED_PRIZE_KRW[r] ?? 0);
  }
  return ev;
}

/** 한눈에 보는 요약 (UI 표시용) */
export function probabilitySummary(lines: number) {
  return {
    perLineAnyPrize: anyPrizeProbabilityPerLine(),
    atLeastOne: atLeastOnePrizeProbability(lines),
    linesFor25pct: linesForTargetProbability(0.25),
    linesFor50pct: linesForTargetProbability(0.5),
    evFixedPerLine: expectedValueFixedTiers(),
    perRank: {
      1: prizeProbability(1),
      2: prizeProbability(2),
      3: prizeProbability(3),
      4: prizeProbability(4),
      5: prizeProbability(5),
    } as Record<PrizeRank, number>,
  };
}
