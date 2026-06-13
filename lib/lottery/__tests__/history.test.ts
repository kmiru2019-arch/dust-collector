import { describe, it, expect } from "vitest";
import { LOTTO_HISTORY } from "../history";
import { analyzeDraws } from "../stats";

describe("로또 전체 실데이터 (history)", () => {
  it("1~1227회 연속, 누락 없음", () => {
    expect(LOTTO_HISTORY.length).toBe(1227);
    expect(LOTTO_HISTORY[0].round).toBe(1);
    expect(LOTTO_HISTORY[LOTTO_HISTORY.length - 1].round).toBe(1227);
    for (let i = 0; i < LOTTO_HISTORY.length; i++) {
      expect(LOTTO_HISTORY[i].round).toBe(i + 1); // 빠짐 없이 연속
    }
  });

  it("모든 회차: 본번호 6개 1~45 중복없음 + 보너스 유효", () => {
    for (const d of LOTTO_HISTORY) {
      expect(new Set(d.numbers).size).toBe(6);
      for (const n of d.numbers) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(45);
      }
      expect(d.bonus).toBeGreaterThanOrEqual(1);
      expect(d.bonus).toBeLessThanOrEqual(45);
      expect(d.numbers).not.toContain(d.bonus); // 보너스는 본번호와 다름
    }
  });

  it("실제 최신 회차 값 확인 (공식 데이터 대조)", () => {
    const r1227 = LOTTO_HISTORY.find((d) => d.round === 1227)!;
    expect(r1227.numbers).toEqual([1, 14, 16, 34, 41, 44]);
    expect(r1227.bonus).toBe(13);
  });

  it("공정성: 번호 빈도 카이제곱이 임계값(60.5) 미만 → 편향 없음", () => {
    const stats = analyzeDraws(LOTTO_HISTORY);
    const exp = (LOTTO_HISTORY.length * 6) / 45;
    let chi = 0;
    for (const s of stats.perNumber) chi += (s.count - exp) ** 2 / exp;
    expect(chi).toBeLessThan(60.5); // 5% 유의수준, 자유도 44
  });
});
