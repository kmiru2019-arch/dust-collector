// 과거 추첨 데이터 통계 분석
import {
  type Draw,
  type DrawStats,
  type NumberStat,
  type LineMeta,
  LOTTO_MAX,
  LOTTO_PICK,
} from "./types";

/** 10단위 구간 인덱스 (1-9→0, 10-19→1, 20-29→2, 30-39→3, 40-45→4) */
export function decadeIndex(n: number): number {
  if (n <= 9) return 0;
  return Math.min(4, Math.floor(n / 10));
}
export const DECADE_LABELS = ["1-9", "10-19", "20-29", "30-39", "40-45"];

/** 저(1~22) / 고(23~45) */
export function isLow(n: number): boolean {
  return n <= 22;
}

/** 한 조합의 산술 복잡도(AC value). 높을수록 "흩어진" 조합. 최대 10. */
export function acValue(numbers: number[]): number {
  const diffs = new Set<number>();
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      diffs.add(Math.abs(numbers[i] - numbers[j]));
    }
  }
  return diffs.size - (numbers.length - 1);
}

/** 한 조합의 구조 메타 계산 */
export function lineMeta(numbers: number[]): LineMeta {
  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const odd = sorted.filter((n) => n % 2 === 1).length;
  const low = sorted.filter(isLow).length;
  let maxRun = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
    if (run > maxRun) maxRun = run;
  }
  const decades = new Set(sorted.map(decadeIndex)).size;
  return {
    sum,
    odd,
    even: sorted.length - odd,
    low,
    high: sorted.length - low,
    maxConsecutive: maxRun,
    decades,
    acValue: acValue(sorted),
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * 과거 추첨 데이터를 분석한다.
 * draws는 어떤 순서든 허용 — 내부에서 회차 기준 정렬한다.
 */
export function analyzeDraws(draws: Draw[]): DrawStats {
  const sorted = [...draws].sort((a, b) => a.round - b.round);
  const totalDraws = sorted.length;
  const latestRound = totalDraws ? sorted[sorted.length - 1].round : 0;

  // 번호별 집계
  const stats: NumberStat[] = [];
  for (let n = 1; n <= LOTTO_MAX; n++) {
    stats.push({
      n,
      count: 0,
      bonusCount: 0,
      freqRate: 0,
      freqIndex: 0,
      lastSeenRound: null,
      gap: totalDraws,
    });
  }

  for (const d of sorted) {
    for (const n of d.numbers) {
      const s = stats[n - 1];
      s.count++;
      s.lastSeenRound = d.round;
    }
    if (d.bonus >= 1 && d.bonus <= LOTTO_MAX) stats[d.bonus - 1].bonusCount++;
  }

  const expectedRate = LOTTO_PICK / LOTTO_MAX; // 각 번호의 이론적 출현 비율
  for (const s of stats) {
    s.freqRate = totalDraws ? s.count / totalDraws : 0;
    s.freqIndex = expectedRate ? s.freqRate / expectedRate : 0;
    s.gap = s.lastSeenRound == null ? totalDraws : latestRound - s.lastSeenRound;
  }

  const byFreqDesc = [...stats].sort((a, b) => b.count - a.count);
  const byGapDesc = [...stats].sort((a, b) => b.gap - a.gap);

  // 합계 통계
  const sums = sorted.map((d) => d.numbers.reduce((a, b) => a + b, 0)).sort((a, b) => a - b);
  const sumStat = {
    min: sums[0] ?? 0,
    max: sums[sums.length - 1] ?? 0,
    mean: sums.length ? sums.reduce((a, b) => a + b, 0) / sums.length : 0,
    p10: percentile(sums, 0.1),
    p90: percentile(sums, 0.9),
  };

  // 홀짝 / 저고 / 연속 / 구간 분포
  const oddEven: Record<string, number> = {};
  const lowHigh: Record<string, number> = {};
  const decadeCounts = [0, 0, 0, 0, 0];
  let consecutive = 0;
  for (const d of sorted) {
    const m = lineMeta(d.numbers);
    const oe = `${m.odd}:${m.even}`;
    const lh = `${m.low}:${m.high}`;
    oddEven[oe] = (oddEven[oe] ?? 0) + 1;
    lowHigh[lh] = (lowHigh[lh] ?? 0) + 1;
    if (m.maxConsecutive >= 2) consecutive++;
    for (const n of d.numbers) decadeCounts[decadeIndex(n)]++;
  }

  return {
    totalDraws,
    latestRound,
    perNumber: stats,
    hot: byFreqDesc.slice(0, 10).map((s) => s.n),
    cold: byFreqDesc.slice(-10).map((s) => s.n).reverse(),
    overdue: byGapDesc.slice(0, 10).map((s) => s.n),
    sum: sumStat,
    oddEven,
    lowHigh,
    consecutiveRate: totalDraws ? consecutive / totalDraws : 0,
    decadeCounts,
  };
}
