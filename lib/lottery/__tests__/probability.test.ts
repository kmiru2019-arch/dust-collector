import { describe, it, expect } from "vitest";
import {
  PRIZE_WAYS,
  prizeProbability,
  totalWinningWays,
  anyPrizeProbabilityPerLine,
  atLeastOnePrizeProbability,
  linesForTargetProbability,
  expectedValueFixedTiers,
} from "../probability";
import { TOTAL_COMBINATIONS } from "../types";

describe("로또 확률 (조합론 정확값)", () => {
  it("전체 조합 수 C(45,6) = 8,145,060", () => {
    expect(TOTAL_COMBINATIONS).toBe(8_145_060);
  });

  it("등수별 경우의 수가 조합론과 일치", () => {
    expect(PRIZE_WAYS[1]).toBe(1);
    expect(PRIZE_WAYS[2]).toBe(6); // C(6,5)·1
    expect(PRIZE_WAYS[3]).toBe(228); // C(6,5)·C(38,1)
    expect(PRIZE_WAYS[4]).toBe(11_115); // C(6,4)·C(39,2)
    expect(PRIZE_WAYS[5]).toBe(182_780); // C(6,3)·C(39,3)
  });

  it("1등 확률 = 1 / 8,145,060", () => {
    expect(prizeProbability(1)).toBeCloseTo(1 / 8_145_060, 12);
  });

  it("당첨 총 경우의 수 = 194,130", () => {
    expect(totalWinningWays()).toBe(194_130);
  });

  it("1게임 당첨(5등 이상) 확률 ≈ 2.383%", () => {
    expect(anyPrizeProbabilityPerLine()).toBeCloseTo(0.023833, 5);
  });

  it("5게임 당첨 확률 ≈ 11.4% — 25%에 한참 못 미침", () => {
    const p = atLeastOnePrizeProbability(5);
    expect(p).toBeGreaterThan(0.11);
    expect(p).toBeLessThan(0.12);
    expect(p).toBeLessThan(0.25); // 5게임으로 25%는 불가능
  });

  it("25% 넘기려면 약 12게임 필요 (수학적 하한)", () => {
    expect(linesForTargetProbability(0.25)).toBe(12);
  });

  it("0게임이면 당첨확률 0", () => {
    expect(atLeastOnePrizeProbability(0)).toBe(0);
  });

  it("고정등수(4·5등) 기대수익은 게임당 약 180원 (항상 손실)", () => {
    const ev = expectedValueFixedTiers();
    expect(ev).toBeGreaterThan(170);
    expect(ev).toBeLessThan(190);
    expect(ev).toBeLessThan(1000); // 1게임 1,000원 대비 손실
  });
});
