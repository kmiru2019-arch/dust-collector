"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InstallButton } from "./_pwa";
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

/* ── 볼 ─────────────────────────────────────────── */
function ballStyle(n: number): string {
  if (n <= 10) return "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950";
  if (n <= 20) return "bg-gradient-to-br from-sky-400 to-blue-600 text-white";
  if (n <= 30) return "bg-gradient-to-br from-rose-400 to-red-600 text-white";
  if (n <= 40) return "bg-gradient-to-br from-slate-400 to-slate-600 text-white";
  return "bg-gradient-to-br from-emerald-400 to-green-600 text-white";
}

function Ball({ n, delay, animate, size = 44 }: { n: number; delay?: number; animate?: boolean; size?: number }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full font-extrabold shadow-lg ${ballStyle(
        n
      )} ${animate ? "ball-pop" : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.4, animationDelay: delay ? `${delay}ms` : undefined }}
    >
      <span className="absolute left-[22%] top-[18%] h-[26%] w-[26%] rounded-full bg-white/40 blur-[1px]" />
      {n}
    </span>
  );
}

/* ── 저장 데이터 ─────────────────────────────────── */
interface SavedSet {
  id: string;
  numbers: number[];
  ts: number;
}
const SAVE_KEY = "lotto:saved:v1";

const STRATEGIES: { id: Strategy; label: string; desc: string }[] = [
  { id: "balanced", label: "균형", desc: "균등 + 구조 제약 (추천)" },
  { id: "frequency", label: "다출현", desc: "자주 나온 번호 가중" },
  { id: "overdue", label: "미출현", desc: "오래 안 나온 번호 가중" },
  { id: "hybrid", label: "혼합", desc: "빈도 + 미출현 블렌드" },
];

export default function LotteryApp() {
  const [draws, setDraws] = useState<Draw[]>(SAMPLE_DRAWS);
  const [source, setSource] = useState<"loading" | "live" | "sample">("loading");

  const [strategy, setStrategy] = useState<Strategy>("balanced");
  const [linesCount, setLinesCount] = useState(5);
  const [avoidPopular, setAvoidPopular] = useState(true);
  const [enforceStructure, setEnforceStructure] = useState(true);
  const [includeStr, setIncludeStr] = useState("");
  const [excludeStr, setExcludeStr] = useState("");

  const [result, setResult] = useState<GeneratedLine[] | null>(null);
  const [drawId, setDrawId] = useState(0); // 애니메이션 재시작용 키
  const [drawing, setDrawing] = useState(false);
  const [saved, setSaved] = useState<SavedSet[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* 라이브 데이터 시도 */
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      const live = await fetchRecentDraws(100, ctrl.signal);
      if (live.length >= 30) {
        setDraws(live);
        setSource("live");
      } else setSource("sample");
    })();
    return () => ctrl.abort();
  }, []);

  /* 저장 데이터 로드 */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {}
  }, []);
  const persist = useCallback((next: SavedSet[]) => {
    setSaved(next);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const stats = useMemo(() => analyzeDraws(draws), [draws]);
  const prob = useMemo(() => probabilitySummary(linesCount), [linesCount]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  function parseNums(s: string): number[] {
    return s
      .split(/[^0-9]+/)
      .map((x) => parseInt(x, 10))
      .filter((n) => n >= 1 && n <= 45);
  }

  const draw = useCallback(() => {
    setDrawing(true);
    const seed = Math.floor(Math.random() * 1e9);
    const { lines } = generateLines(draws, {
      lines: Math.min(20, Math.max(1, linesCount)),
      strategy,
      seed,
      avoidPopular,
      enforceStructure,
      include: parseNums(includeStr),
      exclude: parseNums(excludeStr),
    });
    setResult(lines);
    setDrawId((d) => d + 1);
    // 마지막 볼 등장까지의 대략적 시간 후 버튼 잠금 해제
    const total = (lines[0]?.numbers.length ?? 6) * 80 + 500;
    setTimeout(() => setDrawing(false), Math.min(total, 1200));
  }, [draws, linesCount, strategy, avoidPopular, enforceStructure, includeStr, excludeStr]);

  const linesToText = (lines: { numbers: number[] }[]) =>
    lines.map((l, i) => `${String.fromCharCode(65 + i)}. ${l.numbers.join(", ")}`).join("\n");

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash("복사했어요 📋");
    } catch {
      flash("복사 실패");
    }
  };
  const share = async (text: string) => {
    if (typeof navigator !== "undefined" && (navigator as Navigator).share) {
      try {
        await (navigator as Navigator).share({ title: "행운로또 추천번호", text });
      } catch {}
    } else copy(text);
  };

  const saveLine = (numbers: number[]) => {
    if (saved.some((s) => s.numbers.join(",") === numbers.join(","))) {
      flash("이미 저장됨");
      return;
    }
    persist([{ id: `${Date.now()}-${Math.random()}`, numbers, ts: Date.now() }, ...saved].slice(0, 50));
    flash("저장했어요 ⭐");
  };

  const pct = (x: number) => (x * 100).toFixed(2) + "%";
  const mostOddEven = Object.entries(stats.oddEven).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  return (
    <main className="relative mx-auto min-h-screen max-w-md px-4 pb-28 pt-6 lotto-glow">
      {/* 헤더 */}
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-lg font-black text-amber-950 shadow-lg">
            6
          </span>
          <div>
            <h1 className="text-lg font-extrabold leading-none tracking-tight">행운로또</h1>
            <p className="text-[11px] text-slate-400">6/45 통계 추출기</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              source === "live"
                ? "bg-emerald-400/15 text-emerald-300"
                : source === "sample"
                ? "bg-amber-400/15 text-amber-300"
                : "bg-slate-500/15 text-slate-300"
            }`}
          >
            {source === "loading" ? "데이터…" : source === "live" ? `LIVE ~${stats.latestRound}회` : "샘플데이터"}
          </span>
          <InstallButton />
        </div>
      </header>

      {/* 정직한 확률 안내 */}
      <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-3 text-[12px] leading-relaxed text-slate-300 backdrop-blur">
        <p>
          <b className="text-amber-300">정직한 확률</b> · 로또는 매 회차가 완전히 독립적이라 패턴으로 당첨확률을
          높일 수 없어요. 이 앱은 <b className="text-slate-100">통계·구조 분석</b>으로 합리적 조합을 만들고{" "}
          <b className="text-slate-100">인기조합을 피해</b> 당첨 시 분배를 줄이는 데 초점을 둡니다.
        </p>
      </div>

      {/* 확률 KPI */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        {[
          { label: "1게임 당첨", value: pct(prob.perLineAnyPrize), sub: "5등 이상" },
          { label: `${linesCount}게임 당첨`, value: pct(prob.atLeastOne), sub: "1개 이상" },
          { label: "25%까지", value: `${prob.linesFor25pct}게임`, sub: "이론 최소" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
            <div className="text-[10px] text-slate-400">{k.label}</div>
            <div className="text-base font-extrabold text-slate-50">{k.value}</div>
            <div className="text-[9px] text-slate-500">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* 전략 칩 */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        {STRATEGIES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStrategy(s.id)}
            className={`rounded-xl px-2 py-2 text-center transition ${
              strategy === s.id
                ? "bg-amber-400 text-amber-950 shadow-lg"
                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <div className="text-xs font-bold">{s.label}</div>
          </button>
        ))}
      </div>
      <p className="mb-4 text-center text-[11px] text-slate-400">
        {STRATEGIES.find((s) => s.id === strategy)?.desc}
      </p>

      {/* 결과 */}
      {result && (
        <section key={drawId} className="mb-5 space-y-2.5">
          {result.map((line, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 backdrop-blur"
            >
              <span className="w-5 text-center text-sm font-bold text-slate-500">{String.fromCharCode(65 + i)}</span>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {line.numbers.map((n, j) => (
                  <Ball key={n} n={n} animate delay={i * 120 + j * 70} />
                ))}
              </div>
              <button
                onClick={() => saveLine(line.numbers)}
                className="shrink-0 rounded-lg px-2 py-1 text-lg text-amber-300/70 transition hover:text-amber-300"
                aria-label="저장"
              >
                ☆
              </button>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => copy(linesToText(result))}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              📋 전체 복사
            </button>
            <button
              onClick={() => share(linesToText(result))}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              🔗 공유
            </button>
          </div>
        </section>
      )}

      {/* 설정 */}
      <details className="mb-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-200">
          ⚙️ 상세 설정
        </summary>
        <div className="space-y-3 px-4 pb-4">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">게임 수 (1~20)</span>
            <input
              type="number"
              min={1}
              max={20}
              value={linesCount}
              onChange={(e) => setLinesCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/50"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">고정 포함 번호 (예: 7, 14)</span>
            <input
              value={includeStr}
              onChange={(e) => setIncludeStr(e.target.value)}
              placeholder="비워두면 자동"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400/50"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">제외 번호 (예: 4, 13, 44)</span>
            <input
              value={excludeStr}
              onChange={(e) => setExcludeStr(e.target.value)}
              placeholder="비워두면 없음"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400/50"
            />
          </label>
          <div className="space-y-2 pt-1">
            <Toggle label="역대 당첨 구조 제약 (합·홀짝·구간 분산)" checked={enforceStructure} onChange={setEnforceStructure} />
            <Toggle label="인기 조합 회피 (생일·연속·등차)" checked={avoidPopular} onChange={setAvoidPopular} />
          </div>
        </div>
      </details>

      {/* 저장된 번호 */}
      {saved.length > 0 && (
        <details className="mb-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-200">
            ⭐ 저장한 번호 ({saved.length})
          </summary>
          <div className="space-y-2 px-3 pb-3">
            {saved.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-xl bg-white/5 p-2">
                <div className="flex flex-1 flex-wrap gap-1">
                  {s.numbers.map((n) => (
                    <Ball key={n} n={n} size={30} />
                  ))}
                </div>
                <button
                  onClick={() => copy(s.numbers.join(", "))}
                  className="shrink-0 px-1.5 text-slate-400 hover:text-slate-200"
                  aria-label="복사"
                >
                  📋
                </button>
                <button
                  onClick={() => persist(saved.filter((x) => x.id !== s.id))}
                  className="shrink-0 px-1.5 text-slate-500 hover:text-rose-400"
                  aria-label="삭제"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* 통계 */}
      <details className="mb-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-200">
          📊 통계 분석 ({stats.totalDraws}회)
        </summary>
        <div className="space-y-4 px-4 pb-4">
          <StatRow label="🔥 다출현 Hot" nums={stats.hot} />
          <StatRow label="❄️ 소출현 Cold" nums={stats.cold} dim />
          <StatRow label="⏳ 미출현 Overdue" nums={stats.overdue} />
          <div className="grid grid-cols-2 gap-2 text-center">
            <MiniKpi label="합계 범위(p10~p90)" value={`${Math.round(stats.sum.p10)}~${Math.round(stats.sum.p90)}`} />
            <MiniKpi label="흔한 홀짝" value={mostOddEven} />
          </div>
          <div>
            <div className="mb-1.5 text-xs text-slate-400">구간별 출현</div>
            <div className="space-y-1">
              {stats.decadeCounts.map((c, i) => {
                const max = Math.max(...stats.decadeCounts, 1);
                return (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className="w-12 text-slate-500">{DECADE_LABELS[i]}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400" style={{ width: `${(c / max) * 100}%` }} />
                    </div>
                    <span className="w-7 text-right text-slate-400">{c}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </details>

      <p className="px-2 text-center text-[10px] leading-relaxed text-slate-600">
        본 앱은 오락·통계 학습용입니다. 당첨을 보장하지 않으며 과도한 구매는 삼가세요. 19세 미만 구매 불가.
        {source === "sample" && " (현재 오프라인 합성 데이터로 동작 중)"}
      </p>

      {/* 추첨 버튼 (고정) */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md p-4">
        <button
          onClick={draw}
          disabled={drawing}
          className={`pulse-ring w-full rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 py-4 text-lg font-black text-amber-950 shadow-2xl transition active:scale-[0.98] ${
            drawing ? "opacity-70" : "hover:from-amber-300 hover:to-amber-400"
          }`}
        >
          {drawing ? "뽑는 중…" : result ? "🎲 다시 뽑기" : "🎲 행운 번호 뽑기"}
        </button>
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-30 mx-auto w-fit rounded-full bg-slate-900/90 px-4 py-2 text-sm font-semibold text-slate-100 shadow-xl ring-1 ring-white/10">
          {toast}
        </div>
      )}
    </main>
  );
}

/* ── 보조 컴포넌트 ───────────────────────────────── */
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3 text-left">
      <span className="text-xs text-slate-300">{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? "bg-amber-400" : "bg-slate-600"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

function StatRow({ label, nums, dim }: { label: string; nums: number[]; dim?: boolean }) {
  return (
    <div>
      <div className="mb-1.5 text-xs text-slate-400">{label}</div>
      <div className={`flex flex-wrap gap-1.5 ${dim ? "opacity-60" : ""}`}>
        {nums.map((n) => (
          <Ball key={n} n={n} size={30} />
        ))}
      </div>
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className="text-sm font-bold text-slate-100">{value}</div>
    </div>
  );
}
