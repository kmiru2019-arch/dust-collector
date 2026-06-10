// 다수가 선택하는 "인기 조합" 판별.
//
// 핵심: 인기 조합을 피해도 당첨 확률은 1mm도 오르지 않는다.
// 그러나 만약 당첨된다면 같은 번호를 고른 사람 수가 적어져 1·2등의
// 분배 실수령액이 커진다. 이것이 통계적으로 정당한 "유일한 우위"다.
import { lineMeta } from "./stats";

/** 등차수열인가 (예: 5,10,15,20,25,30) */
function isArithmetic(sorted: number[]): boolean {
  const d = sorted[1] - sorted[0];
  if (d === 0) return false;
  for (let i = 2; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] !== d) return false;
  }
  return true;
}

/**
 * 사람들이 과하게 많이 찍어 "당첨 시 분배 위험"이 큰 조합인지 판정.
 * true이면 회피 대상.
 */
export function isPopularCombo(numbers: number[]): boolean {
  const sorted = [...numbers].sort((a, b) => a - b);
  const m = lineMeta(sorted);

  // 1) 모두 31 이하 → 생일(일/월) 기반 선택 군집. 가장 흔한 함정.
  if (sorted.every((n) => n <= 31)) return true;

  // 2) 등차수열 (1-2-3-4-5-6, 5-10-...-30 등)
  if (isArithmetic(sorted)) return true;

  // 3) 4개 이상 연속수 (1-2-3-4-...)
  if (m.maxConsecutive >= 4) return true;

  // 4) 한 구간(10단위)에 4개 이상 몰림 — 시각적으로 흔히 찍는 패턴
  const buckets = [0, 0, 0, 0, 0];
  for (const n of sorted) buckets[Math.min(4, n <= 9 ? 0 : Math.floor(n / 10))]++;
  if (Math.max(...buckets) >= 4) return true;

  // 5) 끝자리가 모두 같은 수 (5,15,25,35,45 류)
  const ends = new Set(sorted.map((n) => n % 10));
  if (ends.size <= 2) return true;

  return false;
}
