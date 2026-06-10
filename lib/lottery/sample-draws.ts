// 오프라인 데모·테스트용 "합성(synthetic)" 추첨 데이터.
//
// ⚠️ 이 데이터는 실제 당첨번호가 아니다. 균등 무작위로 생성한 가짜 데이터로,
//    네트워크 없이 엔진을 시연·테스트하기 위한 용도일 뿐이다.
//    실제 분석은 fetch.ts 의 라이브 데이터(동행복권 공식 API)로 수행한다.
import { type Draw, LOTTO_MAX, LOTTO_PICK } from "./types";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** count개의 합성 추첨 결과를 결정론적으로 생성 (실제 데이터 아님) */
export function makeSampleDraws(count = 200, seed = 20260610): Draw[] {
  const rng = mulberry32(seed);
  const draws: Draw[] = [];
  for (let round = 1; round <= count; round++) {
    const pool = Array.from({ length: LOTTO_MAX }, (_, i) => i + 1);
    // Fisher–Yates 부분 셔플
    for (let i = 0; i < LOTTO_PICK + 1; i++) {
      const j = i + Math.floor(rng() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = pool.slice(0, LOTTO_PICK + 1);
    const numbers = picked.slice(0, LOTTO_PICK).sort((a, b) => a - b);
    const bonus = picked[LOTTO_PICK];
    draws.push({ round, numbers, bonus });
  }
  return draws;
}

/** 기본 데모 데이터셋 (합성 200회차) */
export const SAMPLE_DRAWS: Draw[] = makeSampleDraws();
