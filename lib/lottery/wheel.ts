// 휠링(wheeling) — 고른 번호 풀(pool)에서 여러 게임을 조합.
//
// 휠링은 1등 "확률 자체"를 마법처럼 올리지 않는다. 단지 고른 번호 안에서
// 게임 수를 늘리는 방식이며, 게임 수에 비례해서만 1등 확률이 커진다.
// 다만 "고른 번호가 모두 당첨번호에 포함되면 ○개 이상 맞음"을 보장하는
// 구조(커버링 디자인)를 만들 수 있어, 적은 게임으로 하위 등수를 확보한다.
import { LOTTO_PICK } from "./types";

/** nCk */
export function combinations<T>(arr: T[], k: number): T[][] {
  const res: T[][] = [];
  const n = arr.length;
  if (k > n || k < 0) return res;
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    res.push(idx.map((i) => arr[i]));
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) break;
    idx[i]++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
  return res;
}

/** C(n,k) 개수 (조합을 만들지 않고 계산) */
export function nCk(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}

export interface WheelResult {
  lines: number[][];
  poolSize: number;
  lineCount: number;
  costKRW: number;
  /** 보장 설명 (사람이 읽는 문구) */
  guarantee: string;
  /** 전체 휠 대비 게임 수 절감 여부 */
  abbreviated: boolean;
}

/** 전체 휠 — 풀의 모든 6개 조합 (C(K,6)게임). 작은 풀에만 권장. */
export function fullWheel(pool: number[]): WheelResult {
  const uniq = [...new Set(pool)].sort((a, b) => a - b);
  const lines = combinations(uniq, LOTTO_PICK);
  return {
    lines,
    poolSize: uniq.length,
    lineCount: lines.length,
    costKRW: lines.length * 1000,
    guarantee:
      "고른 번호 중 6개가 모두 당첨되면 1등 보장. (모든 조합 구매)",
    abbreviated: false,
  };
}

/**
 * 축약 휠 — 그리디 커버링.
 * 보장: "고른 번호 안에 당첨번호 6개가 모두 들어오면, 최소 1게임이 `guarantee`개 이상 일치".
 * guarantee=3 → 5등 보장, 4 → 4등 보장 (게임 수는 늘어남).
 */
export function coveringWheel(pool: number[], guarantee: 3 | 4 | 5 = 3): WheelResult {
  const uniq = [...new Set(pool)].sort((a, b) => a - b);
  const K = uniq.length;
  if (K < LOTTO_PICK) {
    return { lines: [], poolSize: K, lineCount: 0, costKRW: 0, guarantee: "번호를 6개 이상 고르세요.", abbreviated: true };
  }

  // 덮어야 할 대상: 풀의 모든 `guarantee`-부분집합 (키로 관리)
  const targets = combinations(uniq, guarantee);
  const key = (c: number[]) => c.join(",");
  const uncovered = new Set(targets.map(key));

  // 후보: 풀의 모든 6개 조합. 각 후보는 자신이 포함하는 guarantee-부분집합을 덮는다.
  const candidates = combinations(uniq, LOTTO_PICK);
  const lines: number[][] = [];

  // 그리디: 매번 "아직 안 덮인 대상"을 가장 많이 덮는 후보 선택
  while (uncovered.size > 0) {
    let best: number[] | null = null;
    let bestCover: string[] = [];
    for (const cand of candidates) {
      const subs = combinations(cand, guarantee).map(key);
      const newly = subs.filter((s) => uncovered.has(s));
      if (newly.length > bestCover.length) {
        best = cand;
        bestCover = newly;
        if (newly.length === subs.length) break; // 더 좋아질 수 없음(전부 새로 덮음)
      }
    }
    if (!best) break;
    lines.push(best);
    for (const s of bestCover) uncovered.delete(s);
  }

  const full = nCk(K, LOTTO_PICK);
  const prizeName = guarantee === 3 ? "5등(3개)" : guarantee === 4 ? "4등(4개)" : "3등(5개)";
  return {
    lines,
    poolSize: K,
    lineCount: lines.length,
    costKRW: lines.length * 1000,
    guarantee: `고른 ${K}개 안에 당첨번호 6개가 모두 들어오면 ${prizeName} 이상 1게임 보장. (전체 ${full}게임 → ${lines.length}게임으로 축약)`,
    abbreviated: lines.length < full,
  };
}
