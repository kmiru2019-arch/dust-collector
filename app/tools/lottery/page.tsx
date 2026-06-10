"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardTitle, KpiCard } from "@/components/ui/Card";
import { Field, NumberInput, Select, Checkbox } from "@/components/ui/Input";
import {
  analyzeDraws,
  generateLines,
  probabilitySummary,
  fetchRecentDraws,
  SAMPLE_DRAWS,
  type Draw,
  type Strategy,
  type GeneratedLine,
} from "@/lib/lottery";
import { DECADE_LABELS } from "@/lib/lottery/stats";

/** 공식 로또 색상 규칙: 1-10 노랑, 11-20 파랑, 21-30 빨강, 31-40 회색, 41-45 초록 */
function ballColor(n: number): string {
  if (n <= 10) return "bg-yellow-400 text-yellow-900";
  if (n <= 20) return "bg-blue-500 text-white";
  if (n <= 30) return "bg-red-500 text-white";
  if (n <= 40) return "bg-gray-600 text-white";
  return "bg-green-500 text-white";
}

function Ball({ n, dim }: { n: number; dim?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shadow-sm ${ballColor(
        n
      )} ${dim ? "opacity-30" : ""}`}
    >
      {n}
    </span>
  );
}

const STRATEGY_LABELS: Record<Strategy, string> = {
  balanced: "균형형 (추천) — 균등 + 구조 제약",
  frequency: "빈도형 — 자주 나온 번호 가중",
  overdue: "미출현형 — 오래 안 나온 번호 가중",
  hybrid: "혼합형 — 빈도 + 미출현 블렌드",
};

export default function LotteryTool() {
  const [draws, setDraws] = useState<Draw[]>(SAMPLE_DRAWS);
  const [dataSource, setDataSource] = useState<"loading" | "live" | "sample">("loading");

  const [strategy, setStrategy] = useState<Strategy>("balanced");
  const [linesCount, setLinesCount] = useState(5);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [avoidPopular, setAvoidPopular] = useState(true);
  const [enforceStructure, setEnforceStructure] = useState(true);
  const [excludeStr, setExcludeStr] = useState("");
  const [includeStr, setIncludeStr] = useState("");
  const [result, setResult] = useState<GeneratedLine[] | null>(null);

  // 마운트 시 라이브 데이터 시도 → 실패하면 합성 샘플 유지
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      const live = await fetchRecentDraws(100, ctrl.signal);
      if (live.length >= 30) {
        setDraws(live);
        setDataSource("live");
      } else {
        setDataSource("sample");
      }
    })();
    return () => ctrl.abort();
  }, []);

  const stats = useMemo(() => analyzeDraws(draws), [draws]);
  const prob = useMemo(() => probabilitySummary(linesCount), [linesCount]);

  function parseNums(s: string): number[] {
    return s
      .split(/[^0-9]+/)
      .map((x) => parseInt(x, 10))
      .filter((n) => n >= 1 && n <= 45);
  }

  function handleGenerate(newSeed?: number) {
    const useSeed = newSeed ?? seed;
    const { lines } = generateLines(draws, {
      lines: Math.min(20, Math.max(1, linesCount)),
      strategy,
      seed: useSeed,
      avoidPopular,
      enforceStructure,
      include: parseNums(includeStr),
      exclude: parseNums(excludeStr),
    });
    setResult(lines);
  }

  function reroll() {
    const s = Math.floor(Math.random() * 1e9);
    setSeed(s);
    handleGenerate(s);
  }

  const pct = (x: number) => (x * 100).toFixed(2) + "%";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/tools" className="text-sm text-brand-700 hover:underline">
          ← 단일 계산기
        </Link>
        <h1 className="text-3xl font-bold text-brand-900 mt-2 mb-2">로또 6/45 번호 추출기</h1>
        <p className="text-gray-600 mb-6">
          과거 회차 통계 분석 + 구조 제약 + 인기조합 회피 기반의 정밀 번호 생성기.
        </p>

        {/* 솔직한 면책: 가장 중요 */}
        <div className="mb-6 rounded-lg border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold mb-1">⚠️ 먼저 알아두세요 — 확률에 대한 정직한 사실</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              로또는 매 회차가 <b>완전히 독립·균등</b>한 추첨입니다. 과거 패턴으로{" "}
              <b>당첨 확률 자체를 높이는 것은 수학적으로 불가능</b>합니다.
            </li>
            <li>
              1게임이 <b>5등 이상(=무언가) 당첨될 확률은 {pct(prob.perLineAnyPrize)}</b> 뿐입니다.
              {linesCount}게임이면 약 <b>{pct(prob.atLeastOne)}</b>입니다.
            </li>
            <li>
              "당첨 확률 25%"를 넘기려면 이론상 최소 <b>{prob.linesFor25pct}게임</b>이 필요합니다 —
              어떤 알고리즘도 5게임으로는 불가능합니다.
            </li>
            <li>
              이 도구의 유일한 실질 이점은 <b>다수가 찍는 조합을 피해</b> 당첨 시 분배 인원을 줄여{" "}
              <b>실수령 기대값</b>을 높이는 것입니다. 즐기는 선에서 사용하세요.
            </li>
          </ul>
        </div>

        {/* 확률 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <KpiCard label="1게임 당첨확률 (5등↑)" value={pct(prob.perLineAnyPrize)} color="gray" />
          <KpiCard label={`${linesCount}게임 당첨확률`} value={pct(prob.atLeastOne)} color="brand" />
          <KpiCard label="1등 확률" value={`1 / 8,145,060`} color="gray" />
          <KpiCard
            label="고정등수 기대수익/게임"
            value={`${Math.round(prob.evFixedPerLine)}원`}
            hint="1게임 1,000원 대비 손실"
            color="safety"
          />
        </div>

        {/* 생성 설정 */}
        <Card className="mb-6">
          <CardTitle>추출 설정</CardTitle>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="전략">
              <Select value={strategy} onChange={(e) => setStrategy(e.target.value as Strategy)}>
                {(Object.keys(STRATEGY_LABELS) as Strategy[]).map((s) => (
                  <option key={s} value={s}>
                    {STRATEGY_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="게임 수 (1~20)">
              <NumberInput
                min={1}
                max={20}
                value={linesCount}
                onChange={(e) => setLinesCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
              />
            </Field>
            <Field label="고정 포함 번호 (쉼표/공백 구분)" hint="예: 7, 14">
              <input
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                value={includeStr}
                onChange={(e) => setIncludeStr(e.target.value)}
                placeholder="비워두면 자동"
              />
            </Field>
            <Field label="제외 번호" hint="예: 4, 13, 44">
              <input
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                value={excludeStr}
                onChange={(e) => setExcludeStr(e.target.value)}
                placeholder="비워두면 없음"
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <Checkbox
              label="역대 당첨 구조 제약 적용 (합계·홀짝·구간 분산)"
              checked={enforceStructure}
              onChange={(e) => setEnforceStructure(e.target.checked)}
            />
            <Checkbox
              label="인기 조합 회피 (생일·연속·등차)"
              checked={avoidPopular}
              onChange={(e) => setAvoidPopular(e.target.checked)}
            />
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => handleGenerate()}
              className="px-5 py-2.5 rounded-md bg-brand-600 text-white font-semibold hover:bg-brand-700 transition"
            >
              번호 추출
            </button>
            <button
              onClick={reroll}
              className="px-5 py-2.5 rounded-md border border-gray-300 bg-white font-medium hover:bg-gray-50 transition"
            >
              🎲 다시 추출
            </button>
          </div>
        </Card>

        {/* 결과 */}
        {result && (
          <Card className="mb-6">
            <CardTitle>추출 결과 ({result.length}게임)</CardTitle>
            <div className="space-y-3">
              {result.map((line, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <span className="w-8 text-sm font-bold text-gray-500">{String.fromCharCode(65 + i)}</span>
                  <div className="flex gap-1.5">
                    {line.numbers.map((n) => (
                      <Ball key={n} n={n} />
                    ))}
                  </div>
                  <span className="ml-auto text-xs text-gray-500">
                    합 {line.meta.sum} · 홀{line.meta.odd}:짝{line.meta.even} · 저{line.meta.low}:고
                    {line.meta.high} · {line.meta.decades}구간
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">시드: {seed} (같은 시드 → 같은 결과)</p>
          </Card>
        )}

        {/* 통계 */}
        <Card>
          <CardTitle>과거 회차 통계 분석</CardTitle>
          <p className="text-sm text-gray-500 mb-4">
            데이터:{" "}
            {dataSource === "loading" && "불러오는 중…"}
            {dataSource === "live" && (
              <span className="text-green-700 font-medium">
                동행복권 라이브 (최근 {stats.totalDraws}회, ~{stats.latestRound}회차)
              </span>
            )}
            {dataSource === "sample" && (
              <span className="text-amber-700 font-medium">
                오프라인 합성 샘플 {stats.totalDraws}회 (실데이터 차단됨 — 데모용)
              </span>
            )}
          </p>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">🔥 다출현 (Hot) 상위 10</div>
              <div className="flex flex-wrap gap-1.5">
                {stats.hot.map((n) => (
                  <Ball key={n} n={n} />
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">❄️ 소출현 (Cold) 하위 10</div>
              <div className="flex flex-wrap gap-1.5">
                {stats.cold.map((n) => (
                  <Ball key={n} n={n} dim />
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">
                ⏳ 미출현 기간 (Overdue) 상위 10
              </div>
              <div className="flex flex-wrap gap-1.5">
                {stats.overdue.map((n) => (
                  <Ball key={n} n={n} />
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3 pt-2">
              <KpiCard
                label="당첨번호 합계 범위 (p10~p90)"
                value={`${Math.round(stats.sum.p10)}~${Math.round(stats.sum.p90)}`}
                hint={`평균 ${Math.round(stats.sum.mean)}`}
                color="gray"
              />
              <KpiCard
                label="연속수 포함 회차 비율"
                value={`${(stats.consecutiveRate * 100).toFixed(0)}%`}
                color="gray"
              />
              <KpiCard
                label="가장 흔한 홀짝 분포"
                value={
                  Object.entries(stats.oddEven).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-"
                }
                hint="홀:짝"
                color="gray"
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">구간별 출현 분포</div>
              <div className="space-y-1">
                {stats.decadeCounts.map((c, i) => {
                  const max = Math.max(...stats.decadeCounts, 1);
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-14 text-gray-500">{DECADE_LABELS[i]}</span>
                      <div className="flex-1 bg-gray-100 rounded h-4 overflow-hidden">
                        <div
                          className="bg-brand-400 h-full"
                          style={{ width: `${(c / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-gray-600">{c}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <p className="text-xs text-gray-400 mt-6 text-center">
          본 도구는 오락·통계 학습 목적입니다. 당첨을 보장하지 않으며, 과도한 구매는 금물입니다.
        </p>
      </div>
    </main>
  );
}
