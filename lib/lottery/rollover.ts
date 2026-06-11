// 이월 잭팟 EV 분석 (Stefan Mandel 방식).
//
// Mandel: 잭팟이 "전체 조합을 다 사는 비용"보다 충분히 크게 이월됐을 때,
//   모든 조합을 구매하면 1등을 확정으로 가져가 +EV가 된다(역사상 14회 성공).
//   이 함수는 로또 6/45에서 그 조건이 성립하는지 정직하게 계산한다.
//   (참고: 한국은 1게임당 1,000원, 1등 분배·세금·대량구매 제한으로 현실성은 거의 없음)
import { TOTAL_COMBINATIONS } from "./types";
import { PRIZE_WAYS, FIXED_PRIZE_KRW } from "./probability";

/** 전체 조합을 모두 구매하는 비용 (8,145,060 × 1,000원) */
export const COST_ALL_COMBINATIONS_KRW = TOTAL_COMBINATIONS * 1000;

/**
 * 전체 조합을 다 사면 하위 등수(4·5등)에서 확정으로 회수되는 금액.
 *   4등: 11,115장 × 50,000원,  5등: 182,780장 × 5,000원
 *   (2·3등은 변동 당첨금이라 보수적으로 제외 → 실제 회수는 이보다 큼)
 */
export const GUARANTEED_LOWER_RETURN_KRW =
  PRIZE_WAYS[4] * (FIXED_PRIZE_KRW[4] ?? 0) + PRIZE_WAYS[5] * (FIXED_PRIZE_KRW[5] ?? 0);

export interface RolloverResult {
  jackpotKRW: number;
  costAllKRW: number;
  /** 잭팟 / 전조합비용 */
  ratio: number;
  guaranteedLowerKRW: number;
  /** 전조합 구매 시 순손익(원) = 잭팟 + 4·5등 확정회수 − 전조합비용 (2·3등·세금·분배 제외) */
  netIfBuyAllKRW: number;
  /** positive: +EV, marginal: 근소, negative: 손해 */
  verdict: "positive" | "marginal" | "negative";
}

/** 현재 잭팟에서 "전조합 구매"가 이득인지 분석 */
export function analyzeRollover(jackpotKRW: number): RolloverResult {
  const jp = Math.max(0, jackpotKRW);
  const net = jp + GUARANTEED_LOWER_RETURN_KRW - COST_ALL_COMBINATIONS_KRW;
  let verdict: RolloverResult["verdict"];
  if (net > COST_ALL_COMBINATIONS_KRW * 0.1) verdict = "positive"; // 비용의 10%↑ 여유 흑자
  else if (net > 0) verdict = "marginal";
  else verdict = "negative";

  return {
    jackpotKRW: jp,
    costAllKRW: COST_ALL_COMBINATIONS_KRW,
    ratio: COST_ALL_COMBINATIONS_KRW ? jp / COST_ALL_COMBINATIONS_KRW : 0,
    guaranteedLowerKRW: GUARANTEED_LOWER_RETURN_KRW,
    netIfBuyAllKRW: net,
    verdict,
  };
}
