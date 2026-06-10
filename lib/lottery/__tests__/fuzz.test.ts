// 무작위 시드 + 극단 입력 퍼즈 테스트.
// 코드가 옳다면 "어떤 시드"에서도 불변식이 성립해야 한다(플레이키여서는 안 됨).
import { describe, it, expect } from "vitest";
import { generateLines } from "../generate";
import { lineMeta } from "../stats";
import { isPopularCombo } from "../popularity";
import { makeSampleDraws } from "../sample-draws";
import type { Strategy } from "../types";

const draws = makeSampleDraws(200);
const strategies: Strategy[] = ["balanced", "frequency", "overdue", "hybrid"];

function assertLineValid(numbers: number[]) {
  expect(numbers).toHaveLength(6);
  expect(new Set(numbers).size).toBe(6);
  for (const n of numbers) {
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(45);
  }
  expect([...numbers].sort((a, b) => a - b)).toEqual(numbers);
}

describe("퍼즈 — 무작위 시드 불변식", () => {
  it("400회 × 다양한 설정: 6개 유효·중복없음·게임간 유일", () => {
    for (let i = 0; i < 400; i++) {
      const seed = Math.floor(Math.random() * 2 ** 31);
      const strategy = strategies[i % strategies.length];
      const lines = 1 + Math.floor(Math.random() * 20);
      const { lines: out } = generateLines(draws, {
        lines,
        strategy,
        seed,
        avoidPopular: i % 2 === 0,
        enforceStructure: i % 3 === 0,
      });
      expect(out.length).toBeLessThanOrEqual(lines);
      const keys = new Set<string>();
      for (const l of out) {
        assertLineValid(l.numbers);
        const key = l.numbers.join(",");
        expect(keys.has(key)).toBe(false); // 게임 간 중복 금지
        keys.add(key);
      }
    }
  });

  it("include+exclude 겹침/중복 입력에도 깨지지 않는다", () => {
    for (let i = 0; i < 100; i++) {
      const seed = Math.floor(Math.random() * 2 ** 31);
      const { lines } = generateLines(draws, {
        lines: 5,
        strategy: strategies[i % 4],
        seed,
        include: [7, 14, 7], // 중복 포함
        exclude: [14, 1, 2], // 14는 include와 충돌
      });
      for (const l of lines) {
        assertLineValid(l.numbers);
        expect(l.numbers).toContain(7);
        expect(l.numbers).not.toContain(1);
        expect(l.numbers).not.toContain(2);
        // 충돌(14): exclude가 우선되어 미포함이어야 한다
        expect(l.numbers).not.toContain(14);
      }
    }
  });

  it("제외 과다(6개 미만 잔여)에도 무한루프/예외 없이 종료", () => {
    // 41개 제외 → 4개만 남아 6개 구성 불가. 안전 종료만 보장하면 OK.
    const start = Date.now();
    const { lines } = generateLines(draws, {
      lines: 3,
      strategy: "balanced",
      seed: 123,
      exclude: Array.from({ length: 41 }, (_, k) => k + 1),
    });
    expect(Date.now() - start).toBeLessThan(2000);
    expect(Array.isArray(lines)).toBe(true);
  });

  it("include가 인기조합을 강제해도 안전 종료(회피 불가 시 완화)", () => {
    const { lines } = generateLines(draws, {
      lines: 5,
      strategy: "balanced",
      seed: 7,
      include: [3, 9, 15, 21, 27, 31], // 전부 ≤31 → 인기조합 강제
      avoidPopular: true,
      enforceStructure: true,
    });
    for (const l of lines) {
      assertLineValid(l.numbers);
      expect(l.numbers).toEqual([3, 9, 15, 21, 27, 31]);
    }
  });

  it("avoidPopular/enforceStructure 활성 시 제약 충족(제약 가능한 입력 한정)", () => {
    for (let i = 0; i < 100; i++) {
      const seed = Math.floor(Math.random() * 2 ** 31);
      const { lines } = generateLines(draws, {
        lines: 8,
        strategy: strategies[i % 4],
        seed,
        avoidPopular: true,
        enforceStructure: true,
      });
      for (const l of lines) {
        expect(isPopularCombo(l.numbers)).toBe(false);
        const m = lineMeta(l.numbers);
        expect(m.odd).toBeGreaterThan(0);
        expect(m.odd).toBeLessThan(6);
        expect(m.maxConsecutive).toBeLessThan(4);
        expect(m.decades).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
