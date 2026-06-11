// 신디케이트(공동구매) 분석.
//
// 수학적 근거: 1등 확률을 "실제로" 높이는 유일한 합법적 방법은 서로 다른
//   조합을 더 많이 사는 것이다. 여럿이 돈을 모으면 1인당 비용은 낮추면서
//   그룹 전체의 당첨 확률을 게임 수에 비례해 올릴 수 있다(당첨금은 분배).
import { TOTAL_COMBINATIONS } from "./types";
import { prizeProbability, atLeastOnePrizeProbability } from "./probability";

export interface SyndicateInput {
  /** 참여 인원 */
  members: number;
  /** 그룹이 구매하는 총 게임(서로 다른 조합) 수 */
  totalGames: number;
  /** 예상 1등 당첨금(원) — 분배액 계산용. 없으면 분배 생략 */
  jackpotKRW?: number;
}

export interface SyndicateResult {
  members: number;
  totalGames: number;
  costTotalKRW: number;
  costPerMemberKRW: number;
  /** 그룹의 1등 1회↑ 확률 */
  pJackpot: number;
  /** 그룹의 5등↑(무언가 당첨) 확률 */
  pAnyPrize: number;
  /** 단독 1게임 1등 확률 (비교 기준) */
  soloPJackpot: number;
  /** 단독 대비 1등 확률 배수 */
  improvementVsSolo: number;
  /** 1등 당첨 시 1인 분배액(원) */
  jackpotShareKRW?: number;
}

/** 공동구매 시나리오 분석 */
export function analyzeSyndicate(input: SyndicateInput): SyndicateResult {
  const members = Math.max(1, Math.floor(input.members));
  const totalGames = Math.max(0, Math.floor(input.totalGames));

  const pSolo = prizeProbability(1);
  // 서로 다른 조합 가정 → 1등 확률 = 게임수 / 전체조합 (1 상한)
  const pJackpot = Math.min(1, totalGames / TOTAL_COMBINATIONS);
  const pAnyPrize = atLeastOnePrizeProbability(totalGames);

  const costTotalKRW = totalGames * 1000;

  return {
    members,
    totalGames,
    costTotalKRW,
    costPerMemberKRW: Math.round(costTotalKRW / members),
    pJackpot,
    pAnyPrize,
    soloPJackpot: pSolo,
    improvementVsSolo: pSolo ? pJackpot / pSolo : 0,
    jackpotShareKRW:
      input.jackpotKRW != null ? Math.round(input.jackpotKRW / members) : undefined,
  };
}
