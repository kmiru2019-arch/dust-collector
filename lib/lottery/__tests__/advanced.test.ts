import { describe, it, expect } from "vitest";
import { analyzeSyndicate } from "../syndicate";
import { analyzeRollover, COST_ALL_COMBINATIONS_KRW, GUARANTEED_LOWER_RETURN_KRW } from "../rollover";
import { prizeProbability } from "../probability";

describe("신디케이트(공동구매) 분석", () => {
  it("게임 수에 비례해 1등 확률이 선형으로 커진다", () => {
    const a = analyzeSyndicate({ members: 10, totalGames: 100 });
    expect(a.pJackpot).toBeCloseTo(100 / 8_145_060, 12);
    expect(a.improvementVsSolo).toBeCloseTo(100, 6); // 단독 1게임 대비 100배
  });

  it("1인당 비용 = 총비용 / 인원", () => {
    const a = analyzeSyndicate({ members: 5, totalGames: 50 });
    expect(a.costTotalKRW).toBe(50_000);
    expect(a.costPerMemberKRW).toBe(10_000);
  });

  it("당첨금은 인원수로 분배된다", () => {
    const a = analyzeSyndicate({ members: 20, totalGames: 100, jackpotKRW: 2_000_000_000 });
    expect(a.jackpotShareKRW).toBe(100_000_000); // 20억 / 20명
  });

  it("단독(1게임)은 개선 배수 1배", () => {
    const a = analyzeSyndicate({ members: 1, totalGames: 1 });
    expect(a.improvementVsSolo).toBeCloseTo(1, 6);
    expect(a.pJackpot).toBeCloseTo(prizeProbability(1), 12);
  });
});

describe("이월 잭팟 EV 분석 (Mandel)", () => {
  it("전조합 구매 비용은 약 81.45억원", () => {
    expect(COST_ALL_COMBINATIONS_KRW).toBe(8_145_060_000);
  });

  it("4·5등 확정 회수액 ≈ 14.7억원", () => {
    expect(GUARANTEED_LOWER_RETURN_KRW).toBe(11_115 * 50_000 + 182_780 * 5_000);
    expect(GUARANTEED_LOWER_RETURN_KRW).toBe(1_469_650_000);
  });

  it("한국 현실(잭팟 ~20억)에서는 명백히 손해(negative)", () => {
    const r = analyzeRollover(2_000_000_000);
    expect(r.verdict).toBe("negative");
    expect(r.netIfBuyAllKRW).toBeLessThan(0);
  });

  it("잭팟이 전조합비용을 크게 넘으면 +EV(positive)", () => {
    const r = analyzeRollover(20_000_000_000); // 200억 가정
    expect(r.verdict).toBe("positive");
    expect(r.netIfBuyAllKRW).toBeGreaterThan(0);
    expect(r.ratio).toBeGreaterThan(2);
  });

  it("순손익 = 잭팟 + 4·5등확정 − 전조합비용", () => {
    const jp = 10_000_000_000;
    const r = analyzeRollover(jp);
    expect(r.netIfBuyAllKRW).toBe(jp + GUARANTEED_LOWER_RETURN_KRW - COST_ALL_COMBINATIONS_KRW);
  });
});
