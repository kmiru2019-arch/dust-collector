"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useProposalStore } from "@/lib/store/proposal-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { answerQuestion, suggestedQuestions } from "@/lib/converge/qa-engine";
import { systemFollowups, pickFinal, type Prefs, type FinalResult } from "@/lib/converge/followups";

export default function ConvergePage() {
  const router = useRouter();
  const proposalSet = useProposalStore((s) => s.proposalSet);
  const selectedId = useProposalStore((s) => s.selectedId);
  const qaLog = useProposalStore((s) => s.qaLog);
  const addQA = useProposalStore((s) => s.addQA);
  const setFinal = useProposalStore((s) => s.setFinal);

  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"ask" | "system">("ask");
  const [prefs, setPrefs] = useState<Prefs>({});
  const [final, setFinalResult] = useState<FinalResult | null>(null);

  const activeProposal = useMemo(
    () => proposalSet?.proposals.find((p) => p.id === selectedId) ?? proposalSet?.proposals[0],
    [proposalSet, selectedId]
  );

  if (!proposalSet || !activeProposal) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <h1 className="text-xl font-bold mb-2">먼저 제시안을 선택하세요</h1>
        <a href="/designer/proposals" className="inline-block px-4 py-2 bg-brand-600 text-white rounded font-bold">제시안 보기</a>
      </div>
    );
  }

  const followups = systemFollowups(proposalSet);
  const chips = suggestedQuestions(activeProposal);

  function ask(q: string) {
    const question = q.trim();
    if (!question) return;
    const r = answerQuestion(question, proposalSet!.spec, activeProposal!);
    addQA({ q: question, a: r.answer + (r.detail ? "\n— " + r.detail.join("\n— ") : "") });
    setInput("");
  }

  function chooseFollowup(id: string, value: string) {
    setPrefs((prev) => ({ ...prev, [id]: value }));
  }

  function converge() {
    const result = pickFinal(proposalSet!, prefs);
    setFinalResult(result);
  }

  function confirmFinal() {
    if (!final) return;
    setFinal(final.finalId);
    router.push("/designer/detail");
  }

  const allFollowupsAnswered = followups.every((f) => prefs[f.id]);

  return (
    <div className="max-w-4xl mx-auto p-6 pb-12">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-brand-900">질의 수렴</h1>
        <p className="text-gray-600 text-sm mt-1">
          현재 검토안: <b className="text-brand-700">{activeProposal.title}</b> — 궁금한 점을 먼저 자유롭게 질문하세요.
          질문이 끝나면 시스템이 몇 가지를 확인해 <b>최종 1안</b>을 도출합니다.
        </p>
      </div>

      {/* ── 1단계: 사용자 자유 질의 ── */}
      <Card className="mb-4">
        <CardTitle>1. 사용자 질의 (자유 질문)</CardTitle>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {chips.map((c) => (
            <button key={c} onClick={() => ask(c)}
              className="text-xs px-2.5 py-1 bg-brand-50 border border-brand-200 text-brand-700 rounded-full hover:bg-brand-100">
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") ask(input); }}
            placeholder="예: 백필터 여과면적과 송풍기 동력은?"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <button onClick={() => ask(input)} className="px-4 py-2 bg-brand-600 text-white rounded text-sm font-bold">질문</button>
        </div>

        {qaLog.length > 0 && (
          <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
            {qaLog.map((e, i) => (
              <div key={i} className="border-l-2 border-brand-200 pl-3">
                <div className="text-sm font-bold text-gray-800">Q. {e.q}</div>
                <div className="text-sm text-gray-700 whitespace-pre-line mt-0.5">{e.a}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── 2단계: 시스템 추가질문 ── */}
      {phase === "ask" ? (
        <div className="text-center">
          <button onClick={() => setPhase("system")}
            className="px-5 py-2.5 bg-brand-600 text-white rounded font-bold hover:bg-brand-700">
            질문 끝 — 시스템 확인 진행 →
          </button>
          <p className="text-xs text-gray-500 mt-2">충분히 질문하셨으면 다음 단계에서 최종안을 좁혀갑니다.</p>
        </div>
      ) : (
        <Card className="mb-4">
          <CardTitle>2. 시스템 확인 (최종 1안 수렴)</CardTitle>
          <p className="text-xs text-gray-500 mb-3">아래 항목을 선택하면 답변을 반영해 최종안을 재산정합니다.</p>
          <div className="space-y-4">
            {followups.map((f) => (
              <div key={f.id}>
                <div className="text-sm font-bold text-gray-800 mb-1.5">{f.q}</div>
                <div className="flex flex-wrap gap-2">
                  {f.options.map((o) => (
                    <button key={o.value} onClick={() => chooseFollowup(f.id, o.value)}
                      className={[
                        "text-sm px-3 py-1.5 rounded border transition",
                        prefs[f.id] === o.value
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
                      ].join(" ")}
                      title={o.hint}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            disabled={!allFollowupsAnswered}
            onClick={converge}
            className={[
              "w-full mt-5 py-2.5 rounded font-bold",
              allFollowupsAnswered ? "bg-brand-600 text-white hover:bg-brand-700" : "bg-gray-200 text-gray-400 cursor-not-allowed",
            ].join(" ")}>
            최종 1안 도출
          </button>
        </Card>
      )}

      {/* ── 3단계: 최종안 ── */}
      {final && (
        <Card className="border-2 border-brand-400">
          <CardTitle>최종 도출안</CardTitle>
          <p className="text-sm text-gray-800 mb-3">{final.rationale}</p>
          <div className="space-y-1.5 mb-4">
            {final.ranked.map((r, i) => (
              <div key={r.id} className={[
                "flex items-center justify-between text-sm px-3 py-2 rounded",
                r.id === final.finalId ? "bg-brand-50 border border-brand-300" : "bg-gray-50",
              ].join(" ")}>
                <span className="font-bold">{i + 1}. {r.title} {r.id === final.finalId && <span className="text-brand-600">← 최종</span>}</span>
                <span className="text-xs text-gray-500">{r.adjScore < 0 ? "제외" : `점수 ${r.adjScore}`} · {r.note}</span>
              </div>
            ))}
          </div>
          <button onClick={confirmFinal}
            disabled={final.ranked[0].adjScore < 0}
            className="w-full py-2.5 bg-brand-700 text-white rounded font-bold hover:bg-brand-800 disabled:bg-gray-200 disabled:text-gray-400">
            이 안으로 상세설계 진행 →
          </button>
        </Card>
      )}
    </div>
  );
}
