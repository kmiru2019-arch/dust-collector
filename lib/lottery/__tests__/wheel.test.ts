import { describe, it, expect } from "vitest";
import { combinations, nCk, fullWheel, coveringWheel } from "../wheel";

describe("조합 유틸", () => {
  it("nCk가 정확하다", () => {
    expect(nCk(45, 6)).toBe(8_145_060);
    expect(nCk(7, 6)).toBe(7);
    expect(nCk(12, 6)).toBe(924);
    expect(nCk(3, 6)).toBe(0);
  });

  it("combinations 개수가 nCk와 일치", () => {
    expect(combinations([1, 2, 3, 4, 5, 6, 7], 6)).toHaveLength(7);
    expect(combinations([1, 2, 3, 4, 5], 3)).toHaveLength(nCk(5, 3));
  });
});

describe("전체 휠", () => {
  it("7개 풀 → 7게임 (C(7,6))", () => {
    const w = fullWheel([1, 2, 3, 4, 5, 6, 7]);
    expect(w.lineCount).toBe(7);
    expect(w.costKRW).toBe(7000);
    expect(w.abbreviated).toBe(false);
    // 모든 게임은 6개·풀 안의 번호
    for (const l of w.lines) {
      expect(l).toHaveLength(6);
      for (const n of l) expect([1, 2, 3, 4, 5, 6, 7]).toContain(n);
    }
  });
});

describe("축약 휠 (커버링 보장)", () => {
  it("3-보장: 전체보다 게임 수가 적고, 보장을 실제로 만족한다", () => {
    const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const w = coveringWheel(pool, 3);
    expect(w.lineCount).toBeLessThan(nCk(pool.length, 6)); // 축약됨
    expect(w.abbreviated).toBe(true);

    // 보장 검증: 풀에서 뽑은 임의의 당첨 6개 집합에 대해
    //   최소 1게임이 3개 이상 일치해야 한다.
    const winSets = combinations(pool, 6);
    for (const win of winSets) {
      const winSet = new Set(win);
      const ok = w.lines.some((line) => line.filter((n) => winSet.has(n)).length >= 3);
      expect(ok).toBe(true);
    }
  });

  it("6개 미만 풀이면 빈 결과", () => {
    const w = coveringWheel([1, 2, 3], 3);
    expect(w.lineCount).toBe(0);
  });

  it("모든 게임은 풀 안의 서로 다른 6개", () => {
    const pool = [4, 8, 15, 16, 23, 42, 7, 11];
    const w = coveringWheel(pool, 3);
    const poolSet = new Set(pool);
    for (const l of w.lines) {
      expect(new Set(l).size).toBe(6);
      for (const n of l) expect(poolSet.has(n)).toBe(true);
    }
  });
});
