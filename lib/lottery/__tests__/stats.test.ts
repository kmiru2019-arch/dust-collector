import { describe, it, expect } from "vitest";
import { analyzeDraws, lineMeta, acValue, decadeIndex, isLow } from "../stats";
import { makeSampleDraws } from "../sample-draws";
import type { Draw } from "../types";

describe("조합 메타 계산", () => {
  it("lineMeta가 합·홀짝·저고·연속·구간을 정확히 센다", () => {
    const m = lineMeta([1, 2, 3, 10, 22, 45]);
    expect(m.sum).toBe(83);
    expect(m.odd).toBe(3); // 1,3,45
    expect(m.even).toBe(3); // 2,10,22
    expect(m.low).toBe(5); // 1,2,3,10,22 (<=22)
    expect(m.high).toBe(1); // 45
    expect(m.maxConsecutive).toBe(3); // 1,2,3
    expect(m.decades).toBe(4); // 1-9,10-19,20-29,40-45
  });

  it("decadeIndex / isLow 경계값", () => {
    expect(decadeIndex(9)).toBe(0);
    expect(decadeIndex(10)).toBe(1);
    expect(decadeIndex(45)).toBe(4);
    expect(isLow(22)).toBe(true);
    expect(isLow(23)).toBe(false);
  });

  it("acValue: 등차수열은 낮고 흩어진 조합은 높다", () => {
    expect(acValue([1, 2, 3, 4, 5, 6])).toBe(0); // 차이 {1,2,3,4,5}=5개 - 5
    expect(acValue([1, 5, 11, 19, 30, 44])).toBeGreaterThanOrEqual(7);
  });
});

describe("과거 데이터 분석", () => {
  const draws = makeSampleDraws(200);

  it("총 회차·최신회차 집계", () => {
    const s = analyzeDraws(draws);
    expect(s.totalDraws).toBe(200);
    expect(s.latestRound).toBe(200);
    expect(s.perNumber).toHaveLength(45);
  });

  it("모든 번호 출현 횟수 합 = 회차수 × 6", () => {
    const s = analyzeDraws(draws);
    const total = s.perNumber.reduce((a, b) => a + b.count, 0);
    expect(total).toBe(200 * 6);
  });

  it("hot/cold/overdue 각 10개씩", () => {
    const s = analyzeDraws(draws);
    expect(s.hot).toHaveLength(10);
    expect(s.cold).toHaveLength(10);
    expect(s.overdue).toHaveLength(10);
  });

  it("순서가 섞여 있어도 회차 기준 정렬 후 분석", () => {
    const shuffled: Draw[] = [...draws].reverse();
    const s = analyzeDraws(shuffled);
    expect(s.latestRound).toBe(200);
  });

  it("합계 통계 p10 ≤ mean ≤ p90", () => {
    const s = analyzeDraws(draws);
    expect(s.sum.p10).toBeLessThanOrEqual(s.sum.mean);
    expect(s.sum.mean).toBeLessThanOrEqual(s.sum.p90);
  });

  it("빈 입력도 안전하게 처리", () => {
    const s = analyzeDraws([]);
    expect(s.totalDraws).toBe(0);
    expect(s.perNumber).toHaveLength(45);
  });
});
