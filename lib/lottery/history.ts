// 로또 6/45 전체 당첨 기록 — 동행복권 공식 데이터.
// 원천 데이터는 lotto-history.json (포맷: [회차, 본번호6, 보너스]).
// 매주 GitHub Actions(.github/workflows/update-lotto.yml)가 자동으로 신규 회차를 추가한다.
import RAW from "./lotto-history.json";
import type { Draw } from "./types";

/** 전체 회차 실데이터 (오름차순) */
export const LOTTO_HISTORY: Draw[] = (RAW as number[][]).map(
  ([round, a, b, c, d, e, f, bonus]) => ({
    round,
    numbers: [a, b, c, d, e, f],
    bonus,
  })
);

/** 가장 최근(최신) 회차 */
export const LATEST_ROUND = LOTTO_HISTORY.length
  ? LOTTO_HISTORY[LOTTO_HISTORY.length - 1].round
  : 0;
