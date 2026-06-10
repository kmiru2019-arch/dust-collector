// 번호 조합 생성 엔진 — 가중 샘플링 + 구조 제약 + 인기조합 회피
//
// ⚠️ 다시 강조: 어떤 가중치도 당첨 "확률"을 높이지 못한다(매 회차 독립).
//   가중치/제약의 목적은 역대 당첨조합의 "구조적 분포"에 부합하는,
//   그리고 다수 선택을 피한 조합을 만들어내는 데 있다.
import {
  type Draw,
  type GenerateOptions,
  type GenerateResult,
  type GeneratedLine,
  type Strategy,
  LOTTO_MAX,
  LOTTO_PICK,
} from "./types";
import { analyzeDraws, lineMeta } from "./stats";
import { isPopularCombo } from "./popularity";

/** 결정론적 PRNG (mulberry32) — 같은 시드는 같은 수열 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 가중치 배열에서 인덱스 1개를 뽑는다 (가중 무작위) */
function weightedPick(weights: number[], rng: () => number): number {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return Math.floor(rng() * weights.length);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/** 전략별로 번호 1~45의 기본 가중치를 만든다 */
function buildWeights(strategy: Strategy, draws: Draw[]): number[] {
  const weights = new Array(LOTTO_MAX).fill(1);
  if (strategy === "balanced" || draws.length === 0) return weights;

  const stats = analyzeDraws(draws);
  const maxCount = Math.max(1, ...stats.perNumber.map((s) => s.count));
  const maxGap = Math.max(1, ...stats.perNumber.map((s) => s.gap));

  for (let i = 0; i < LOTTO_MAX; i++) {
    const s = stats.perNumber[i];
    const freqNorm = s.count / maxCount; // 0~1, 자주 나올수록 큼
    const gapNorm = s.gap / maxGap; // 0~1, 오래 안 나올수록 큼
    if (strategy === "frequency") {
      weights[i] = 0.3 + 1.4 * freqNorm;
    } else if (strategy === "overdue") {
      weights[i] = 0.3 + 1.4 * gapNorm;
    } else {
      // hybrid: 빈도·미출현·기준값 블렌드
      weights[i] = 0.4 + 0.8 * freqNorm + 0.8 * gapNorm;
    }
  }
  return weights;
}

/** 구조 제약을 통과하는가 (역대 당첨조합의 전형적 특성) */
function passesStructure(numbers: number[], sumLo: number, sumHi: number): boolean {
  const m = lineMeta(numbers);
  if (m.sum < sumLo || m.sum > sumHi) return false; // 합계 범위
  if (m.odd === 0 || m.odd === LOTTO_PICK) return false; // 전부 홀/짝 배제
  if (m.low === 0 || m.low === LOTTO_PICK) return false; // 전부 저/고 배제
  if (m.maxConsecutive >= 4) return false; // 4연속 이상 배제
  if (m.decades < 3) return false; // 최소 3개 구간에 분산
  if (m.acValue < 5) return false; // 너무 규칙적인 조합 배제
  return true;
}

/** 한 게임(6개 번호)을 가중치+제약에 맞춰 생성 */
function generateOneLine(
  weights: number[],
  rng: () => number,
  opts: {
    include: number[];
    exclude: Set<number>;
    sumLo: number;
    sumHi: number;
    enforceStructure: boolean;
    avoidPopular: boolean;
  }
): number[] {
  const { include, exclude, sumLo, sumHi, enforceStructure, avoidPopular } = opts;
  const base = include.filter((n) => !exclude.has(n)); // exclude가 include보다 우선
  const available = LOTTO_MAX - exclude.size; // 선택 가능한 번호 개수

  // 고정수만으로 6개가 채워지면 조합이 완전히 결정됨 — 제약을 적용할 자유도가 없으니 즉시 반환
  if (base.length >= LOTTO_PICK) {
    return [...new Set(base)].sort((a, b) => a - b).slice(0, LOTTO_PICK);
  }

  const MAX_ATTEMPTS = 2000;
  // 구조/인기 제약을 끝까지 만족 못 할 수 있는 입력(여유 풀이 좁음)은 완화 시점을 앞당긴다
  const relaxAfter = available <= LOTTO_PICK + 6 ? 0 : Math.floor(MAX_ATTEMPTS / 2);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const chosen = new Set<number>(base);
    // 가중 샘플링으로 6개까지 채운다
    let guard = 0;
    while (chosen.size < LOTTO_PICK && guard++ < 1000) {
      const w = weights.map((wt, i) => {
        const n = i + 1;
        return chosen.has(n) || exclude.has(n) ? 0 : wt;
      });
      const idx = weightedPick(w, rng);
      chosen.add(idx + 1);
    }
    if (chosen.size < LOTTO_PICK) continue;

    const arr = [...chosen].sort((a, b) => a - b);
    // 제약 완화: 일정 시도를 넘기면 제약을 풀어 무한루프 방지 (만족 불가능 입력 대비)
    const relax = attempt >= relaxAfter && attempt > 0;
    if (enforceStructure && !relax && !passesStructure(arr, sumLo, sumHi)) continue;
    if (avoidPopular && !relax && isPopularCombo(arr)) continue;
    return arr;
  }

  // 최후 폴백: 제약 없이 무작위로 채우되 exclude는 끝까지 지킨다.
  const fallback = new Set<number>(base);
  let guard = 0;
  while (fallback.size < LOTTO_PICK && guard++ < 2000) {
    const cand = Math.floor(rng() * LOTTO_MAX) + 1;
    if (!exclude.has(cand)) fallback.add(cand);
  }
  return [...fallback].sort((a, b) => a - b);
}

/** 메인 진입점: N개의 서로 다른 게임을 생성한다 */
export function generateLines(draws: Draw[], options: GenerateOptions): GenerateResult {
  const {
    lines,
    strategy,
    seed = Date.now() & 0xffffffff,
    include = [],
    exclude = [],
    avoidPopular = true,
    enforceStructure = true,
  } = options;

  const rng = mulberry32(seed);
  const weights = buildWeights(strategy, draws);
  const excludeSet = new Set(exclude.filter((n) => n >= 1 && n <= LOTTO_MAX));
  const validInclude = include.filter((n) => n >= 1 && n <= LOTTO_MAX).slice(0, LOTTO_PICK);

  // 합계 허용범위: 데이터가 있으면 p10~p90, 없으면 역대 통념(100~175)
  let sumLo = 100;
  let sumHi = 175;
  if (draws.length >= 30) {
    const s = analyzeDraws(draws).sum;
    sumLo = Math.round(s.p10);
    sumHi = Math.round(s.p90);
  }

  // 선택 가능한 번호가 6개 미만이면 유효한 게임을 만들 수 없다 → 빈 결과
  const available = LOTTO_MAX - excludeSet.size;
  if (available < LOTTO_PICK) return { lines: [], strategy, seed };

  // 고정수가 6개면 조합이 하나로 결정 → 서로 다른 게임은 1개뿐
  const effectiveBase = validInclude.filter((n) => !excludeSet.has(n));
  const maxDistinct = effectiveBase.length >= LOTTO_PICK ? 1 : lines;
  const target = Math.min(lines, maxDistinct);

  const result: GeneratedLine[] = [];
  const seen = new Set<string>();
  let safety = 0;
  while (result.length < target && safety++ < target * 200) {
    const nums = generateOneLine(weights, rng, {
      include: validInclude,
      exclude: excludeSet,
      sumLo,
      sumHi,
      enforceStructure,
      avoidPopular,
    });
    const key = nums.join(",");
    if (seen.has(key)) continue; // 게임 간 중복 방지
    seen.add(key);
    result.push({ numbers: nums, meta: lineMeta(nums) });
  }

  return { lines: result, strategy, seed };
}
