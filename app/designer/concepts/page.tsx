"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useConceptStore } from "@/lib/store/concept-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { getApplicableQA } from "@/lib/concept/qa-scenarios";
import type { QAAnswer } from "@/lib/concept/types";
import Link from "next/link";

const fmt억 = (won: number) => (won / 1e8).toFixed(1);

export default function ConceptsPage() {
  const router = useRouter();
  const conceptSet = useConceptStore((s) => s.conceptSet);
  const selectedId = useConceptStore((s) => s.selectedConceptId);
  const selectConcept = useConceptStore((s) => s.selectConcept);
  const [qaAnswer, setQaAnswer] = useState<QAAnswer | null>(null);

  // auto-redirect 제거 (client-nav 바운스 방지) — 데이터 없으면 안내만
  if (!conceptSet) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <div className="text-gray-600">아직 생성된 설계안이 없습니다.</div>
        <Link href="/designer/brief" className="inline-block px-6 py-2.5 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700">
          Brief 입력하기 →
        </Link>
      </div>
    );
  }

  const selected = conceptSet.concepts.find((c) => c.id === selectedId) ?? conceptSet.concepts[0];
  const qaList = getApplicableQA(selected, conceptSet.brief);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-900">설계안 비교</h1>
          <p className="text-gray-600 mt-1">{conceptSet.concepts.length}개 안 자동 생성 — 시스템 추천 + 트레이드오프</p>
        </div>
        <Link href="/designer/brief" className="text-brand-700 hover:underline text-sm">← Brief 수정</Link>
      </div>

      {/* 추천 배너 */}
      <div className="p-4 bg-brand-50 border-2 border-brand-300 rounded-lg">
        <div className="font-bold text-brand-900">🏆 1순위 추천</div>
        <p className="text-sm text-brand-800 mt-1">{conceptSet.recommendation_rationale}</p>
      </div>

      {/* 3안 비교 카드 */}
      <div className="grid md:grid-cols-3 gap-4">
        {conceptSet.concepts.map((c) => (
          <button
            key={c.id}
            onClick={() => { selectConcept(c.id); setQaAnswer(null); }}
            className={`text-left p-4 rounded-lg border-2 transition ${
              c.id === selected.id ? "border-brand-500 bg-brand-50" : "border-gray-200 bg-white hover:border-gray-300"
            } ${!c.feasible ? "opacity-60" : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100">안 {c.rank}</span>
              {c.id === conceptSet.recommended_id && (
                <span className="text-xs px-2 py-0.5 rounded bg-brand-600 text-white">★ 추천</span>
              )}
              {!c.feasible && <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">제외</span>}
            </div>
            <div className="font-bold text-brand-900">{c.label}</div>
            <div className="mt-3 space-y-1 text-sm">
              <Row l="PM 효율" v={`${(c.performance.efficiency_PM * 100).toFixed(1)}%`} />
              {(c.performance.removal_HCl ?? 0) > 0 && <Row l="HCl" v={`${(c.performance.removal_HCl! * 100).toFixed(0)}%`} />}
              {(c.performance.removal_dioxin ?? 0) > 0 && <Row l="다이옥신" v={`${(c.performance.removal_dioxin! * 100).toFixed(0)}%`} />}
              <Row l="CAPEX" v={`${fmt억(c.cost.capex_won)}억`} />
              <Row l="5년 TCO" v={`${fmt억(c.cost.tco_5yr_won)}억`} bold />
            </div>
            {!c.feasible && (
              <div className="mt-2 text-xs text-red-600">❌ {c.rejection_reason}</div>
            )}
          </button>
        ))}
      </div>

      {/* 선택 안 상세 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardTitle>{selected.label} — 상세</CardTitle>
          <div className="text-sm space-y-3">
            <div>
              <div className="font-bold mb-1">구성</div>
              <div className="font-mono text-xs bg-gray-50 p-2 rounded">
                {[selected.stages.pretreatment, selected.stages.primary, selected.stages.secondary, selected.stages.condenser, selected.stages.fan_arrangement]
                  .filter(Boolean).join(" → ")}
                {selected.stages.reagent && <div className="mt-1 text-gray-600">약품: {selected.stages.reagent}</div>}
                {selected.stages.collector_media && <div className="text-gray-600">여재: {selected.stages.collector_media}</div>}
              </div>
            </div>
            <div>
              <div className="font-bold text-green-700 mb-1">✓ 장점</div>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {selected.tradeoff.pros.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
            <div>
              <div className="font-bold text-amber-700 mb-1">⚠ 검토할 점</div>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {selected.tradeoff.cons.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
            {selected.tradeoff.fatal && selected.tradeoff.fatal.length > 0 && (
              <div>
                <div className="font-bold text-red-700 mb-1">❌ 치명적 문제</div>
                <ul className="list-disc list-inside text-xs space-y-0.5 text-red-700">
                  {selected.tradeoff.fatal.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
            <div>
              <div className="font-bold text-brand-700 mb-1">📋 법규</div>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {selected.tradeoff.regulatory.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          </div>
        </Card>

        {/* Q&A */}
        <Card>
          <CardTitle>질의응답 ({qaList.length})</CardTitle>
          <p className="text-xs text-gray-500 mb-2">궁금한 점을 클릭하면 계산 근거와 함께 답변합니다</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {qaList.map((qa) => (
              <button key={qa.id}
                onClick={() => setQaAnswer(qa.answer(selected, conceptSet.brief))}
                className="text-xs px-3 py-1.5 rounded-full bg-gray-100 hover:bg-brand-100 border border-gray-200">
                {qa.question}
              </button>
            ))}
          </div>
          {qaAnswer && (
            <div className="p-3 bg-brand-50 border border-brand-200 rounded text-sm">
              <p className="mb-2">{qaAnswer.text}</p>
              {qaAnswer.delta && (
                <table className="w-full text-xs mb-2">
                  <tbody>
                    {qaAnswer.delta.map((d, i) => (
                      <tr key={i} className="border-t border-brand-100">
                        <td className="py-1 text-gray-600">{d.label}</td>
                        <td className="py-1">{d.before}</td>
                        <td className="py-1 font-bold text-brand-700">→ {d.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="flex items-center gap-2 text-xs">
                {qaAnswer.recommendation && (
                  <span className={`px-2 py-0.5 rounded ${
                    qaAnswer.recommendation === "권장" ? "bg-green-100 text-green-700"
                    : qaAnswer.recommendation === "비권장" ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"}`}>
                    {qaAnswer.recommendation}
                  </span>
                )}
                <span className="text-gray-400">정확도 {(qaAnswer.confidence * 100).toFixed(0)}%</span>
              </div>
              {qaAnswer.trace && <div className="mt-2 text-xs text-gray-400">계산근거: {qaAnswer.trace}</div>}
            </div>
          )}
        </Card>
      </div>

      {/* 결정 */}
      <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-600">
          선택: <span className="font-bold text-brand-900">{selected.label}</span>
          {!selected.feasible && <span className="text-red-600 ml-2">⚠ 이 안은 제약 위배 — 다른 안 권장</span>}
        </div>
        <div className="flex gap-2">
          <Link
            href="/designer/concepts/deck"
            className="px-5 py-2.5 bg-white border border-brand-300 text-brand-700 rounded-lg font-bold hover:bg-brand-50"
          >
            📑 슬라이드·보고서
          </Link>
          <Link
            href={`/designer/concepts/decide?id=${selected.id}`}
            className="px-6 py-2.5 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600"
          >
            이 안으로 정밀 설계 →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ l, v, bold }: { l: string; v: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{l}</span>
      <span className={bold ? "font-bold text-brand-700" : ""}>{v}</span>
    </div>
  );
}
