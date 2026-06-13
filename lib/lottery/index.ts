// 로또 6/45 추출기 — 공개 API
//
// 한눈에 보는 사용 예:
//   import { analyzeDraws, generateLines, probabilitySummary, SAMPLE_DRAWS } from "@/lib/lottery";
//   const stats = analyzeDraws(SAMPLE_DRAWS);
//   const { lines } = generateLines(SAMPLE_DRAWS, { lines: 5, strategy: "balanced" });
//   const prob = probabilitySummary(5);
export * from "./types";
export * from "./probability";
export * from "./stats";
export * from "./popularity";
export * from "./payout";
export * from "./wheel";
export * from "./syndicate";
export * from "./rollover";
export * from "./generate";
export * from "./fetch";
export { SAMPLE_DRAWS, makeSampleDraws } from "./sample-draws";
export { LOTTO_HISTORY } from "./history";
