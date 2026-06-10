import { describe, it, expect } from "vitest";
import { generateLines } from "../generate";
import { isPopularCombo } from "../popularity";
import { lineMeta } from "../stats";
import { makeSampleDraws } from "../sample-draws";
import { LOTTO_PICK } from "../types";

const draws = makeSampleDraws(200);

describe("번호 생성 엔진", () => {
  it("요청한 게임 수만큼, 각 6개 서로 다른 번호를 만든다", () => {
    const { lines } = generateLines(draws, { lines: 5, strategy: "balanced", seed: 1 });
    expect(lines).toHaveLength(5);
    for (const l of lines) {
      expect(l.numbers).toHaveLength(LOTTO_PICK);
      expect(new Set(l.numbers).size).toBe(LOTTO_PICK); // 중복 없음
      expect(Math.min(...l.numbers)).toBeGreaterThanOrEqual(1);
      expect(Math.max(...l.numbers)).toBeLessThanOrEqual(45);
      // 오름차순 정렬 확인
      expect([...l.numbers].sort((a, b) => a - b)).toEqual(l.numbers);
    }
  });

  it("같은 시드는 같은 결과 (재현성)", () => {
    const a = generateLines(draws, { lines: 5, strategy: "hybrid", seed: 42 });
    const b = generateLines(draws, { lines: 5, strategy: "hybrid", seed: 42 });
    expect(a.lines.map((l) => l.numbers)).toEqual(b.lines.map((l) => l.numbers));
  });

  it("다른 시드는 (거의 항상) 다른 결과", () => {
    const a = generateLines(draws, { lines: 5, strategy: "balanced", seed: 1 });
    const b = generateLines(draws, { lines: 5, strategy: "balanced", seed: 2 });
    expect(a.lines.map((l) => l.numbers)).not.toEqual(b.lines.map((l) => l.numbers));
  });

  it("게임 간 중복 조합이 없다", () => {
    const { lines } = generateLines(draws, { lines: 5, strategy: "balanced", seed: 7 });
    const keys = lines.map((l) => l.numbers.join(","));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("구조 제약 적용 시 전부 홀/전부 짝, 전부 저/고가 없다", () => {
    const { lines } = generateLines(draws, {
      lines: 10,
      strategy: "balanced",
      seed: 3,
      enforceStructure: true,
    });
    for (const l of lines) {
      const m = lineMeta(l.numbers);
      expect(m.odd).toBeGreaterThan(0);
      expect(m.odd).toBeLessThan(6);
      expect(m.low).toBeGreaterThan(0);
      expect(m.low).toBeLessThan(6);
      expect(m.maxConsecutive).toBeLessThan(4);
      expect(m.decades).toBeGreaterThanOrEqual(3);
    }
  });

  it("avoidPopular 시 인기 조합(생일군집·등차·연속)이 안 나온다", () => {
    const { lines } = generateLines(draws, {
      lines: 10,
      strategy: "balanced",
      seed: 99,
      avoidPopular: true,
    });
    for (const l of lines) {
      expect(isPopularCombo(l.numbers)).toBe(false);
    }
  });

  it("고정수(include)는 항상 포함된다", () => {
    const { lines } = generateLines(draws, {
      lines: 5,
      strategy: "balanced",
      seed: 5,
      include: [7, 14],
    });
    for (const l of lines) {
      expect(l.numbers).toContain(7);
      expect(l.numbers).toContain(14);
    }
  });

  it("제외수(exclude)는 절대 나오지 않는다", () => {
    const excluded = [1, 2, 3, 4, 5];
    const { lines } = generateLines(draws, {
      lines: 5,
      strategy: "balanced",
      seed: 6,
      exclude: excluded,
    });
    for (const l of lines) {
      for (const e of excluded) expect(l.numbers).not.toContain(e);
    }
  });

  it("과거 데이터 없이도 동작한다 (balanced)", () => {
    const { lines } = generateLines([], { lines: 5, strategy: "balanced", seed: 1 });
    expect(lines).toHaveLength(5);
  });

  it("frequency/overdue 전략도 유효한 게임을 만든다", () => {
    for (const strategy of ["frequency", "overdue"] as const) {
      const { lines } = generateLines(draws, { lines: 5, strategy, seed: 11 });
      expect(lines).toHaveLength(5);
      for (const l of lines) expect(new Set(l.numbers).size).toBe(6);
    }
  });
});

describe("인기 조합 판별", () => {
  it("생일 군집(전부 31 이하)을 잡는다", () => {
    expect(isPopularCombo([1, 5, 12, 18, 25, 31])).toBe(true);
  });
  it("등차수열을 잡는다", () => {
    expect(isPopularCombo([5, 10, 15, 20, 25, 30])).toBe(true);
  });
  it("연속수(1-2-3-4-5-6)를 잡는다", () => {
    expect(isPopularCombo([1, 2, 3, 4, 5, 6])).toBe(true);
  });
  it("흩어진 정상 조합은 통과시킨다", () => {
    expect(isPopularCombo([3, 14, 22, 33, 38, 44])).toBe(false);
  });
});
