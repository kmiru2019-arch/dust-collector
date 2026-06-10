// 동행복권 공식 회차별 결과 API 클라이언트 (브라우저에서 호출).
//
// 엔드포인트: https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=N
// 응답 예: { returnValue:"success", drwNo:1100, drwtNo1..6, bnusNo, drwNoDate }
//
// ⚠️ 네트워크 정책/CORS에 따라 브라우저에서 직접 호출이 차단될 수 있다.
//    실패 시 호출부에서 SAMPLE_DRAWS(합성 데이터)로 graceful fallback 한다.
import type { Draw } from "./types";

interface DhLottoResponse {
  returnValue: string;
  drwNo: number;
  drwtNo1: number;
  drwtNo2: number;
  drwtNo3: number;
  drwtNo4: number;
  drwtNo5: number;
  drwtNo6: number;
  bnusNo: number;
  drwNoDate: string;
}

const ENDPOINT = "https://www.dhlottery.co.kr/common.do";

/** 단일 회차 조회 (없거나 실패하면 null) */
export async function fetchDraw(round: number, signal?: AbortSignal): Promise<Draw | null> {
  try {
    const url = `${ENDPOINT}?method=getLottoNumber&drwNo=${round}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data: DhLottoResponse = await res.json();
    if (data.returnValue !== "success") return null;
    return {
      round: data.drwNo,
      numbers: [
        data.drwtNo1,
        data.drwtNo2,
        data.drwtNo3,
        data.drwtNo4,
        data.drwtNo5,
        data.drwtNo6,
      ].sort((a, b) => a - b),
      bonus: data.bnusNo,
      date: data.drwNoDate,
    };
  } catch {
    return null;
  }
}

/**
 * 이진 탐색으로 "최신 회차"를 추정한다.
 * (2026년 기준 약 1170회 전후 — upper bound를 넉넉히 잡고 줄여나간다)
 */
export async function fetchLatestRound(signal?: AbortSignal): Promise<number | null> {
  let lo = 1;
  let hi = 2000;
  // hi가 유효하지 않을 수 있으니, 존재하는 최댓값을 이진 탐색
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const d = await fetchDraw(mid, signal);
    if (d) lo = mid;
    else hi = mid - 1;
  }
  return lo >= 1 ? lo : null;
}

/**
 * 최근 count개 회차를 가져온다. 최신회차 탐색 실패 시 빈 배열.
 * 병렬 호출 — 서버 부담을 줄이려 batch 단위로 끊는다.
 */
export async function fetchRecentDraws(
  count = 100,
  signal?: AbortSignal
): Promise<Draw[]> {
  const latest = await fetchLatestRound(signal);
  if (!latest) return [];
  const rounds: number[] = [];
  for (let r = latest; r > latest - count && r >= 1; r--) rounds.push(r);

  const out: Draw[] = [];
  const BATCH = 20;
  for (let i = 0; i < rounds.length; i += BATCH) {
    const batch = rounds.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((r) => fetchDraw(r, signal)));
    for (const d of results) if (d) out.push(d);
  }
  return out.sort((a, b) => a.round - b.round);
}
