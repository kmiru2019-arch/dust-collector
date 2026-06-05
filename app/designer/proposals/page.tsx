"use client";
import { useRouter } from "next/navigation";
import { useProposalStore } from "@/lib/store/proposal-store";
import { Card, CardTitle } from "@/components/ui/Card";
import type { Proposal, EquipmentNode } from "@/lib/proposal/types";

const fmtEok = (won: number) => (won / 1e8).toFixed(1);

// 구조도: 후드→집진기→송풍기→스택 흐름 박스
function TrainDiagram({ train }: { train: EquipmentNode[] }) {
  return (
    <div className="flex items-stretch gap-1 overflow-x-auto py-2">
      {train.map((n, i) => (
        <div key={n.id + i} className="flex items-center shrink-0">
          <div className="flex flex-col items-center justify-center min-w-[78px] px-2 py-2 bg-brand-50 border border-brand-300 rounded text-center">
            <span className="text-xs font-bold text-brand-900 leading-tight">{n.label}</span>
            {n.sublabel && <span className="text-[10px] text-gray-500 leading-tight mt-0.5">{n.sublabel}</span>}
          </div>
          {i < train.length - 1 && <span className="text-brand-400 mx-0.5 text-sm">→</span>}
        </div>
      ))}
    </div>
  );
}

function ProposalCard({ p, recommended, selected, onSelect }: {
  p: Proposal; recommended: boolean; selected: boolean; onSelect: () => void;
}) {
  return (
    <Card className={[
      "relative transition",
      selected ? "ring-2 ring-brand-500" : "",
      !p.feasible ? "opacity-60" : "",
    ].join(" ")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-gray-100 text-gray-600 rounded px-2 py-0.5">안 {p.rank}</span>
            {recommended && <span className="text-xs font-bold bg-amber-100 text-amber-800 rounded px-2 py-0.5">추천</span>}
            {!p.feasible && <span className="text-xs font-bold bg-red-100 text-red-700 rounded px-2 py-0.5">제외</span>}
          </div>
          <CardTitle className="mt-1 mb-0">{p.title}</CardTitle>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-brand-700">{(p.efficiency_PM * 100).toFixed(1)}%</div>
          <div className="text-[10px] text-gray-500">PM 효율</div>
        </div>
      </div>

      {/* 구조도 */}
      <div className="mt-2 border border-gray-100 rounded bg-gray-50/50 px-2">
        <TrainDiagram train={p.train} />
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div className="bg-gray-50 rounded py-1.5"><div className="text-sm font-bold">{fmtEok(p.capex_won)}억</div><div className="text-[10px] text-gray-500">CAPEX</div></div>
        <div className="bg-gray-50 rounded py-1.5"><div className="text-sm font-bold">{fmtEok(p.opex_won_yr)}억</div><div className="text-[10px] text-gray-500">연 OPEX</div></div>
        <div className="bg-gray-50 rounded py-1.5"><div className="text-sm font-bold">{fmtEok(p.tco5_won)}억</div><div className="text-[10px] text-gray-500">5년 TCO</div></div>
      </div>

      {/* 장단점 */}
      <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
        <div>
          <div className="font-bold text-green-700 mb-1">장점</div>
          <ul className="space-y-0.5 text-gray-700">{p.pros.map((t, i) => <li key={i}>· {t}</li>)}</ul>
        </div>
        <div>
          <div className="font-bold text-amber-700 mb-1">검토할 점</div>
          <ul className="space-y-0.5 text-gray-700">{p.cons.map((t, i) => <li key={i}>· {t}</li>)}</ul>
        </div>
      </div>
      {p.regulatory.length > 0 && (
        <div className="mt-2 text-[11px] text-brand-800 bg-brand-50 rounded px-2 py-1">
          <b>법규</b> {p.regulatory.join(" / ")}
        </div>
      )}
      {!p.feasible && p.reject_reason && (
        <div className="mt-2 text-[11px] text-red-700 bg-red-50 rounded px-2 py-1">제외 사유: {p.reject_reason}</div>
      )}

      <button
        disabled={!p.feasible}
        onClick={onSelect}
        className={[
          "w-full mt-3 py-2 rounded text-sm font-bold transition",
          !p.feasible ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : selected ? "bg-brand-600 text-white" : "bg-white border border-brand-400 text-brand-700 hover:bg-brand-50",
        ].join(" ")}
      >
        {selected ? "✓ 선택됨" : "이 안 선택"}
      </button>
    </Card>
  );
}

export default function ProposalsPage() {
  const router = useRouter();
  const proposalSet = useProposalStore((s) => s.proposalSet);
  const selectedId = useProposalStore((s) => s.selectedId);
  const select = useProposalStore((s) => s.select);

  if (!proposalSet) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <h1 className="text-xl font-bold mb-2">제시안이 없습니다</h1>
        <p className="text-gray-600 mb-4">먼저 Data Sheet를 작성하면 2~3개의 간략 제시안이 생성됩니다.</p>
        <a href="/designer/datasheet" className="inline-block px-4 py-2 bg-brand-600 text-white rounded font-bold">Data Sheet 작성하러 가기</a>
      </div>
    );
  }

  const { proposals, rationale, recommendedId, spec } = proposalSet;

  return (
    <div className="max-w-6xl mx-auto p-6 pb-28">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-brand-900">간략 제시안</h1>
        <p className="text-gray-600 text-sm mt-1">
          처리 풍량 {Number(spec.flow_Nm3h ?? 0).toLocaleString()} Nm³/h · 입구 {spec.T_in_C}°C 기준 {proposals.length}개 안을 제시합니다.
          구조도와 장단점을 비교해 보세요.
        </p>
      </div>

      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <span className="text-xs font-bold text-amber-800">추천 근거</span>
        <p className="text-sm text-amber-900 mt-0.5">{rationale}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {proposals.map((p) => (
          <ProposalCard
            key={p.id}
            p={p}
            recommended={p.id === recommendedId}
            selected={p.id === selectedId}
            onSelect={() => select(p.id)}
          />
        ))}
      </div>

      {/* 하단 액션바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            궁금한 점이 있으면 <b>질의 수렴</b>에서 자유롭게 질문하고 최종 1안을 확정하세요.
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/designer/datasheet")}
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
            >← Data Sheet 수정</button>
            <button
              disabled={!selectedId}
              onClick={() => router.push("/designer/converge")}
              className={[
                "px-5 py-2 rounded text-sm font-bold",
                selectedId ? "bg-brand-600 text-white hover:bg-brand-700" : "bg-gray-200 text-gray-400 cursor-not-allowed",
              ].join(" ")}
            >질의 수렴 →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
