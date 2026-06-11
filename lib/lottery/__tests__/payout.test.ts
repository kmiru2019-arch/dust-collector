import { describe, it, expect } from "vitest";
import { splitRisk, payoutSafety, evaluateTicket } from "../payout";
import { generateLines } from "../generate";
import { makeSampleDraws } from "../sample-draws";

describe("분배 위험 점수", () => {
  it("0~100 범위, safety = 100 - risk", () => {
    const nums = [3, 14, 22, 33, 38, 44];
    const r = splitRisk(nums);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(100);
    expect(payoutSafety(nums)).toBe(100 - r);
  });

  it("흔한 조합(생일 군집·연속·등차)이 흩어진 조합보다 위험이 높다", () => {
    const birthday = splitRisk([1, 5, 12, 18, 25, 31]); // 전부 ≤31
    const arithmetic = splitRisk([5, 10, 15, 20, 25, 30]);
    const scattered = splitRisk([3, 17, 24, 33, 39, 44]);
    expect(birthday).toBeGreaterThan(scattered);
    expect(arithmetic).toBeGreaterThan(scattered);
  });

  it("1-2-3-4-5-6은 매우 높은 위험", () => {
    expect(splitRisk([1, 2, 3, 4, 5, 6])).toBeGreaterThan(60);
  });
});

describe("정직한 손익 평가", () => {
  it("5게임: 비용 5,000원, 기대손익은 마이너스", () => {
    const ev = evaluateTicket([
      [1, 2, 3, 4, 5, 6],
      [7, 8, 9, 10, 11, 12],
      [13, 14, 15, 16, 17, 18],
      [19, 20, 21, 22, 23, 24],
      [25, 26, 27, 28, 29, 30],
    ]);
    expect(ev.lines).toBe(5);
    expect(ev.costKRW).toBe(5000);
    expect(ev.netExpectedKRW).toBeLessThan(0); // 항상 손실
    expect(ev.pAnyPrize).toBeGreaterThan(0.11);
    expect(ev.pAnyPrize).toBeLessThan(0.12);
  });

  it("게임 수가 늘면 1등 확률도 비례해서 커진다", () => {
    const one = evaluateTicket([[1, 2, 3, 4, 5, 6]]);
    const ten = evaluateTicket(Array.from({ length: 10 }, (_, i) => [i + 1, i + 2, i + 3, i + 4, i + 5, i + 6]));
    expect(ten.pJackpot).toBeGreaterThan(one.pJackpot);
    expect(ten.pJackpot).toBeCloseTo(one.pJackpot * 10, 9);
  });

  it("등수별 1회↑ 확률은 5등 > 4등 > 3등 > 2등 > 1등 (1등이 가장 낮음)", () => {
    const ev = evaluateTicket([[1, 2, 3, 4, 5, 6]]);
    expect(ev.perRank[5]).toBeGreaterThan(ev.perRank[4]);
    expect(ev.perRank[4]).toBeGreaterThan(ev.perRank[3]);
    expect(ev.perRank[3]).toBeGreaterThan(ev.perRank[2]);
    expect(ev.perRank[2]).toBeGreaterThan(ev.perRank[1]);
  });
});

describe("optimizePayout 생성", () => {
  const draws = makeSampleDraws(200);
  it("최적화 시 평균 안전도가 비최적화 대비 같거나 높다", () => {
    let optBetter = 0;
    for (let s = 1; s <= 20; s++) {
      const opt = generateLines(draws, { lines: 5, strategy: "balanced", seed: s, optimizePayout: true });
      const base = generateLines(draws, { lines: 5, strategy: "balanced", seed: s, optimizePayout: false });
      const aOpt = opt.lines.reduce((a, l) => a + payoutSafety(l.numbers), 0) / opt.lines.length;
      const aBase = base.lines.reduce((a, l) => a + payoutSafety(l.numbers), 0) / base.lines.length;
      if (aOpt >= aBase) optBetter++;
    }
    expect(optBetter).toBeGreaterThanOrEqual(18); // 대부분의 시드에서 향상
  });

  it("최적화해도 여전히 5게임 유효·중복없음", () => {
    const { lines } = generateLines(draws, { lines: 5, strategy: "balanced", seed: 3, optimizePayout: true });
    expect(lines).toHaveLength(5);
    const keys = new Set(lines.map((l) => l.numbers.join(",")));
    expect(keys.size).toBe(5);
  });
});
