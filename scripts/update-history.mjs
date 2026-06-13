// 로또 신규 회차 자동 업데이트 (GitHub Actions 주간 실행용).
//   1) lib/lottery/lotto-history.json 의 최신 회차 확인
//   2) 동행복권 공식 API에서 그 다음 회차부터 순차 조회
//   3) 새 회차가 있으면 JSON에 append 후 저장
// Node 20+ 내장 fetch 사용. 의존성 없음.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.resolve(__dirname, "../lib/lottery/lotto-history.json");
const ENDPOINT = "https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=";

async function fetchDraw(round) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${ENDPOINT}${round}`, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      const d = await res.json();
      if (d.returnValue !== "success") return null;
      return [round, d.drwtNo1, d.drwtNo2, d.drwtNo3, d.drwtNo4, d.drwtNo5, d.drwtNo6, d.bnusNo];
    } catch {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return null;
}

async function main() {
  const data = JSON.parse(readFileSync(JSON_PATH, "utf8"));
  const latest = data.length ? Math.max(...data.map((d) => d[0])) : 0;
  console.log(`현재 최신 회차: ${latest}`);

  const added = [];
  let next = latest + 1;
  // 한 번 실행에 최대 10회차까지 따라잡기 (정상 운영 시 보통 1회차)
  for (let i = 0; i < 10; i++) {
    const draw = await fetchDraw(next);
    if (!draw) break; // 아직 추첨 안 됨 → 종료
    data.push(draw);
    added.push(next);
    console.log(`+ ${next}회 추가: ${draw.slice(1, 7).join(",")} +${draw[7]}`);
    next++;
  }

  if (added.length === 0) {
    console.log("새 회차 없음. 변경 없이 종료.");
    return;
  }

  data.sort((a, b) => a[0] - b[0]);
  const body = data.map((d) => "  [" + d.join(",") + "]").join(",\n");
  writeFileSync(JSON_PATH, "[\n" + body + "\n]\n");
  console.log(`✅ ${added.length}개 회차 추가: ${added.join(", ")}`);
}

main().catch((e) => {
  console.error("업데이트 실패:", e);
  process.exit(1);
});
