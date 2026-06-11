"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InstallButton, FullscreenButton, IosInstallHint, useOnline } from "./_pwa";
import {
  analyzeDraws,
  generateLines,
  probabilitySummary,
  fetchRecentDraws,
  evaluateTicket,
  payoutSafety,
  fullWheel,
  coveringWheel,
  analyzeSyndicate,
  analyzeRollover,
  SAMPLE_DRAWS,
  type Draw,
  type Strategy,
  type GeneratedLine,
  type WheelResult,
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
  const [optimizePayout, setOptimizePayout] = useState(true);
  const [includeStr, setIncludeStr] = useState("");
  const [excludeStr, setExcludeStr] = useState("");

  // 휠링
  const [wheelPoolStr, setWheelPoolStr] = useState("");
  const [wheelGuarantee, setWheelGuarantee] = useState<"full" | 3 | 4>(3);
  const [wheel, setWheel] = useState<WheelResult | null>(null);

  // 고급 분석 (공동구매·이월)
  const [synMembers, setSynMembers] = useState(5);
  const [synGames, setSynGames] = useState(50);
  const [synJackpotEok, setSynJackpotEok] = useState(20);
  const [rollJackpotEok, setRollJackpotEok] = useState(20);

  const [result, setResult] = useState<GeneratedLine[] | null>(null);
  const [drawId, setDrawId] = useState(0); // 애니메이션 재시작용 키
  const [drawing, setDrawing] = useState(false);
  const [saved, setSaved] = useState<SavedSet[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const online = useOnline();
  const didAutoDraw = useRef(false);

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
  const evalResult = useMemo(
    () => (result && result.length ? evaluateTicket(result.map((l) => l.numbers)) : null),
    [result]
  );
  const syndicate = useMemo(
    () => analyzeSyndicate({ members: synMembers, totalGames: synGames, jackpotKRW: synJackpotEok * 1e8 }),
    [synMembers, synGames, synJackpotEok]
  );
  const rollover = useMemo(() => analyzeRollover(rollJackpotEok * 1e8), [rollJackpotEok]);

  const runWheel = useCallback(() => {
    const pool = wheelPoolStr
      .split(/[^0-9]+/)
      .map((x) => parseInt(x, 10))
      .filter((n) => n >= 1 && n <= 45);
    const uniq = [...new Set(pool)];
    if (uniq.length < 6) {
      setWheel({ lines: [], poolSize: uniq.length, lineCount: 0, costKRW: 0, guarantee: "번호를 6개 이상 골라주세요.", abbreviated: false });
      return;
    }
    setWheel(wheelGuarantee === "full" ? fullWheel(uniq) : coveringWheel(uniq, wheelGuarantee));
  }, [wheelPoolStr, wheelGuarantee]);

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
    try {
      navigator.vibrate?.([12, 40, 12]);
    } catch {}
    const seed = Math.floor(Math.random() * 1e9);
    const { lines } = generateLines(draws, {
      lines: Math.min(20, Math.max(1, linesCount)),
      strategy,
      seed,
      avoidPopular,
      enforceStructure,
      optimizePayout,
      include: parseNums(includeStr),
      exclude: parseNums(excludeStr),
    });
    setResult(lines);
    setDrawId((d) => d + 1);
    // 마지막 볼 등장까지의 대략적 시간 후 버튼 잠금 해제
    const total = (lines[0]?.numbers.length ?? 6) * 80 + 500;
    setTimeout(() => setDrawing(false), Math.min(total, 1200));
  }, [draws, linesCount, strategy, avoidPopular, enforceStructure, optimizePayout, includeStr, excludeStr]);

  /* PWA 단축어(?action=draw)로 진입 시 자동 1회 추첨 */
  useEffect(() => {
    if (didAutoDraw.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "draw") {
      didAutoDraw.current = true;
      draw();
    }
  }, [draw]);

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
  const won = (n: number) => {
    const sign = n < 0 ? "-" : "";
    const a = Math.abs(n);
    if (a >= 1e8) return `${sign}${(a / 1e8).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}억원`;
    if (a >= 1e4) return `${sign}${Math.round(a / 1e4).toLocaleString()}만원`;
    return `${sign}${Math.round(a).toLocaleString()}원`;
  };
  const mostOddEven = Object.entries(stats.oddEven).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  return (
    <main className="relative mx-auto min-h-[100dvh] max-w-md px-4 pb-28 lotto-glow pt-[max(1.25rem,env(safe-area-inset-top))]">
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
          {!online && (
            <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-[10px] font-semibold text-rose-300">
              오프라인
            </span>
          )}
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
          <FullscreenButton />
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
              <SafetyBadge score={payoutSafety(line.numbers)} />
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

          {/* 정직한 손익 분석 */}
          {evalResult && (
            <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-[12px] text-slate-300">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-slate-200">📊 이 {evalResult.lines}게임 정직 분석</span>
                <span className="text-[11px] text-slate-400">실수령 안전도 평균 {evalResult.avgSafety}/100</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Mini label="1등 확률" value={`${(evalResult.pJackpot * 100).toExponential(2)}%`} />
                <Mini label="5등 이상 확률" value={`${(evalResult.pAnyPrize * 100).toFixed(2)}%`} />
                <Mini label="구매 비용" value={`${evalResult.costKRW.toLocaleString()}원`} />
                <Mini
                  label="기대 손익"
                  value={`${evalResult.netExpectedKRW > 0 ? "+" : ""}${Math.round(evalResult.netExpectedKRW).toLocaleString()}원`}
                  warn
                />
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                ※ 1등이 가장 어려운 등수입니다(5등&gt;4등&gt;3등&gt;2등&gt;1등). 기대 손익은 항상 마이너스 —
                번호로 바꿀 수 없는 게임의 구조예요.
              </p>
            </div>
          )}
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
            <Toggle label="분배 위험 최소화 (당첨 시 실수령액↑)" checked={optimizePayout} onChange={setOptimizePayout} />
          </div>
        </div>
      </details>

      {/* 휠링 */}
      <details className="mb-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-200">
          🎟️ 휠링 — 여러 번호로 묶음 조합
        </summary>
        <div className="space-y-3 px-4 pb-4">
          <p className="text-[11px] leading-relaxed text-slate-400">
            좋아하는 번호 <b className="text-slate-200">7~14개</b>를 고르면, 그 안에서 게임을 조합해요. 1등 확률은
            게임 수에 비례해서만 커지지만, <b className="text-slate-200">“고른 번호가 다 맞으면 하위 등수 보장”</b>{" "}
            구조를 적은 게임으로 만들 수 있어요.
          </p>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">번호 풀 (예: 1,7,12,18,23,29,33,40)</span>
            <input
              value={wheelPoolStr}
              onChange={(e) => setWheelPoolStr(e.target.value)}
              placeholder="6개 이상 입력"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400/50"
            />
          </label>
          <div className="flex gap-2">
            {([3, 4, "full"] as const).map((g) => (
              <button
                key={String(g)}
                onClick={() => setWheelGuarantee(g)}
                className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                  wheelGuarantee === g ? "bg-amber-400 text-amber-950" : "border border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                {g === 3 ? "5등 보장" : g === 4 ? "4등 보장" : "전체 휠"}
              </button>
            ))}
          </div>
          <button
            onClick={runWheel}
            className="w-full rounded-xl border border-amber-300/30 bg-amber-400/10 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/20"
          >
            휠 만들기
          </button>
          {wheel && (
            <div className="space-y-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[12px] text-slate-300">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-slate-100">{wheel.lineCount}게임</span>
                  <span className="text-amber-300">{wheel.costKRW.toLocaleString()}원</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">{wheel.guarantee}</p>
              </div>
              {wheel.lineCount > 0 && (
                <>
                  <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                    {wheel.lines.map((l, i) => (
                      <div key={i} className="flex items-center gap-1.5 rounded-lg bg-white/5 p-1.5">
                        <span className="w-6 text-center text-[10px] text-slate-500">{i + 1}</span>
                        {l.map((n) => (
                          <Ball key={n} n={n} size={26} />
                        ))}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => copy(wheel.lines.map((l, i) => `${i + 1}. ${l.join(", ")}`).join("\n"))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    📋 휠 전체 복사
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </details>

      {/* 고급 분석 — 공동구매 · 이월 (수학적으로 검증된 방법만) */}
      <details className="mb-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-200">
          💡 고급 분석 — 공동구매·이월 (진짜 효과)
        </summary>
        <div className="space-y-5 px-4 pb-4">
          {/* 신디케이트 */}
          <div>
            <div className="mb-1 text-sm font-bold text-amber-300">👥 공동구매(신디케이트) 계산기</div>
            <p className="mb-2 text-[11px] leading-relaxed text-slate-400">
              1등 확률을 <b className="text-slate-200">실제로</b> 올리는 유일한 합법적 방법 = 서로 다른 조합을 더
              많이 사기. 여럿이 모으면 1인당 비용은 낮추고 그룹 확률은 게임 수만큼 커져요(당첨금은 분배).
            </p>
            <div className="grid grid-cols-3 gap-2">
              <NumField label="인원" value={synMembers} min={1} max={100} onChange={setSynMembers} />
              <NumField label="총 게임" value={synGames} min={1} max={100000} onChange={setSynGames} />
              <NumField label="예상 1등(억)" value={synJackpotEok} min={1} max={1000} onChange={setSynJackpotEok} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Mini label="1인당 비용" value={won(syndicate.costPerMemberKRW)} />
              <Mini label="그룹 1등 확률" value={`${(syndicate.pJackpot * 100).toExponential(2)}%`} />
              <Mini label="단독 대비" value={`${Math.round(syndicate.improvementVsSolo).toLocaleString()}배`} />
              <Mini label="1등 시 1인 몫" value={won(syndicate.jackpotShareKRW ?? 0)} />
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">
              ※ 확률이 {Math.round(syndicate.improvementVsSolo).toLocaleString()}배라도 여전히{" "}
              {(syndicate.pJackpot * 100).toExponential(1)}%. 기대값은 마이너스예요.
            </p>
          </div>

          <div className="h-px bg-white/10" />

          {/* 이월 EV */}
          <div>
            <div className="mb-1 text-sm font-bold text-amber-300">📈 이월 잭팟 분석 (Mandel 방식)</div>
            <p className="mb-2 text-[11px] leading-relaxed text-slate-400">
              잭팟이 <b className="text-slate-200">전조합 구매비(81.45억)</b>보다 충분히 크면, 모든 조합을 사서 1등을
              확정으로 가져가는 게 이득이 될 수 있어요(실제 14회 성공 사례). 지금 잭팟으로 따져봅니다.
            </p>
            <NumField label="현재 잭팟(억)" value={rollJackpotEok} min={1} max={2000} onChange={setRollJackpotEok} />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Mini label="전조합 구매비" value={won(rollover.costAllKRW)} />
              <Mini label="잭팟/구매비" value={`${rollover.ratio.toFixed(2)}배`} />
              <Mini label="4·5등 확정회수" value={won(rollover.guaranteedLowerKRW)} />
              <Mini
                label="전조합 구매 손익"
                value={won(rollover.netIfBuyAllKRW)}
                warn={rollover.netIfBuyAllKRW < 0}
              />
            </div>
            <div
              className={`mt-2 rounded-lg p-2 text-[11px] font-semibold ${
                rollover.verdict === "positive"
                  ? "bg-emerald-400/15 text-emerald-300"
                  : rollover.verdict === "marginal"
                  ? "bg-amber-400/15 text-amber-300"
                  : "bg-rose-400/15 text-rose-300"
              }`}
            >
              {rollover.verdict === "positive"
                ? "✅ 이론상 +EV — 전조합 구매가 이득 (단 분배·세금·대량구매 제한 고려)"
                : rollover.verdict === "marginal"
                ? "⚠️ 근소한 흑자 — 분배·세금 감안하면 위험"
                : "❌ 손해 — 한국 로또(잭팟 ~20억)에선 Mandel 방식이 성립하지 않아요"}
            </div>
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

      {/* 추첨 버튼 (고정, 노치 대응) */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md bg-gradient-to-t from-[#0b1020] via-[#0b1020]/90 to-transparent px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
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

      <IosInstallHint />

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

function NumField({
  label, value, min, max, onChange,
}: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] text-slate-400">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-amber-400/50"
      />
    </label>
  );
}

function Mini({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg bg-white/5 p-2">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className={`text-[13px] font-bold ${warn ? "text-rose-300" : "text-slate-100"}`}>{value}</div>
    </div>
  );
}

function SafetyBadge({ score }: { score: number }) {
  const tone =
    score >= 70 ? "bg-emerald-400/15 text-emerald-300" : score >= 45 ? "bg-amber-400/15 text-amber-300" : "bg-rose-400/15 text-rose-300";
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}
      title="실수령 안전도 — 높을수록 당첨 시 단독 수령 가능성↑"
    >
      안전 {score}
    </span>
  );
}
