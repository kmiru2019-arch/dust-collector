"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useProposalStore } from "@/lib/store/proposal-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { mapToStageInputs, applyToDustStore } from "@/lib/converge/to-stage-inputs";
import { deriveDesignStages } from "@/lib/converge/design-stages";

const fmtEok = (won: number) => (won / 1e8).toFixed(1);

const RESULT_LINKS = [
  { href: "/designer/result", label: "종합 결과", desc: "8단 사이징 요약·KPI" },
  { href: "/designer/result/pid", label: "P&ID 계통도", desc: "공정 흐름·계장" },
  { href: "/designer/result/bom", label: "BOM 견적", desc: "자재 명세·수량" },
  { href: "/designer/result/tco", label: "TCO 분석", desc: "5년 총소유비용" },
  { href: "/designer/result/compliance", label: "법규 컴플라이언스", desc: "배출기준·의무사항" },
  { href: "/designer/result/pdf", label: "PDF 설계보고서", desc: "제출용 13p 리포트" },
];

export default function DetailPage() {
  const router = useRouter();
  const proposalSet = useProposalStore((s) => s.proposalSet);
  const finalId = useProposalStore((s) => s.finalId);
  const [applied, setApplied] = useState(false);

  const final = useMemo(
    () => proposalSet?.proposals.find((p) => p.id === finalId),
    [proposalSet, finalId]
  );

  useEffect(() => {
    if (proposalSet && final) {
      const inputs = mapToStageInputs(final, proposalSet.spec);
      applyToDustStore(inputs);
      setApplied(true);
    }
  }, [proposalSet, final]);

  if (!proposalSet || !final) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <h1 className="text-xl font-bold mb-2">확정된 최종안이 없습니다</h1>
        <p className="text-gray-600 mb-4">질의 수렴에서 최종 1안을 도출하세요.</p>
        <a href="/designer/converge" className="inline-block px-4 py-2 bg-brand-600 text-white rounded font-bold">질의 수렴으로</a>
      </div>
    );
  }

  const spec = proposalSet.spec;
  const designStages = deriveDesignStages(final);

  return (
    <div className="max-w-4xl mx-auto p-6 pb-12">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-brand-900">상세설계</h1>
        <p className="text-gray-600 text-sm mt-1">
          확정안 <b className="text-brand-700">{final.title}</b> 의 설비 구성에 맞춰
          <b className="text-brand-700"> 총 {designStages.length}단계</b>의 상세설계를 적용했습니다.
          (고정 8단이 아니라 선택 설비에 필요한 단계만 구성)
        </p>
      </div>

      <Card className="mb-4 border-2 border-brand-400">
        <div className="flex items-center justify-between">
          <CardTitle className="mb-0">{final.title}</CardTitle>
          <span className={[
            "text-xs font-bold px-2 py-1 rounded",
            applied ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500",
          ].join(" ")}>{applied ? "엔진 적용 완료 ✓" : "적용 중..."}</span>
        </div>

        {/* 구조도 */}
        <div className="flex items-center gap-1 overflow-x-auto py-3 mt-1">
          {final.train.map((node, i) => (
            <div key={node.id + i} className="flex items-center shrink-0">
              <div className="flex flex-col items-center min-w-[78px] px-2 py-2 bg-brand-50 border border-brand-300 rounded text-center">
                <span className="text-xs font-bold text-brand-900">{node.label}</span>
                {node.sublabel && <span className="text-[10px] text-gray-500">{node.sublabel}</span>}
              </div>
              {i < final.train.length - 1 && <span className="text-brand-400 mx-0.5">→</span>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 mt-2 text-center">
          <div className="bg-gray-50 rounded py-2"><div className="text-lg font-bold text-brand-700">{(final.efficiency_PM * 100).toFixed(1)}%</div><div className="text-[10px] text-gray-500">PM 효율</div></div>
          <div className="bg-gray-50 rounded py-2"><div className="text-lg font-bold">{fmtEok(final.capex_won)}억</div><div className="text-[10px] text-gray-500">CAPEX</div></div>
          <div className="bg-gray-50 rounded py-2"><div className="text-lg font-bold">{fmtEok(final.opex_won_yr)}억</div><div className="text-[10px] text-gray-500">연 OPEX</div></div>
          <div className="bg-gray-50 rounded py-2"><div className="text-lg font-bold">{fmtEok(final.tco5_won)}억</div><div className="text-[10px] text-gray-500">5년 TCO</div></div>
        </div>
      </Card>

      <Card className="mb-4">
        <CardTitle>적용된 핵심 사양</CardTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
          {[
            ["처리 풍량", `${Number(spec.flow_Nm3h ?? 0).toLocaleString()} Nm³/h`],
            ["인입 온도", `${spec.T_in_C} °C`],
            ["토출 온도", `${spec.T_out_C} °C`],
            ["분진", spec.dust_type ?? "-"],
            ["입구 농도", `${spec.inlet_conc_g ?? "-"} g/Nm³`],
            ["목표 배출", `${spec.target_emission ?? "법규"} mg/Sm³`],
            ["본체 재질", spec.body_material ?? "자동"],
            ["여재", spec.filter_media ?? "자동"],
            ["폐수", spec.wastewater === "ok" ? "가능" : "불가"],
          ].map(([l, v], i) => (
            <div key={i} className="flex justify-between border-b border-gray-100 py-1">
              <span className="text-gray-500">{l}</span>
              <span className="font-bold text-gray-800">{v as string}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 설비 구성별 동적 상세설계 단계 */}
      <Card className="mb-4">
        <CardTitle>상세설계 단계 — 총 {designStages.length}단계</CardTitle>
        <p className="text-xs text-gray-500 mb-3">확정안의 설비 구성에서 필요한 단계만 자동 구성했습니다. 각 단계를 눌러 수동 미세조정할 수 있습니다.</p>
        <ol className="space-y-2">
          {designStages.map((st) => (
            <li key={st.key}>
              <button onClick={() => router.push(st.stagePage)}
                className="w-full text-left flex items-center gap-3 p-2.5 rounded border border-gray-100 hover:border-brand-300 hover:bg-brand-50/40 transition">
                <span className="shrink-0 w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">{st.no}</span>
                <span className="flex-1">
                  <span className="font-bold text-gray-800 text-sm">{st.title}</span>
                  <span className="block text-[11px] text-gray-500">{st.desc}</span>
                </span>
                <span className="text-[10px] text-gray-400">{st.group}</span>
                <span className="text-brand-400">→</span>
              </button>
            </li>
          ))}
        </ol>
      </Card>

      <CardTitle>산출물</CardTitle>
      <div className="grid sm:grid-cols-2 gap-3 mt-1">
        {RESULT_LINKS.map((r) => (
          <button key={r.href} onClick={() => router.push(r.href)}
            disabled={!applied}
            className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-brand-400 hover:shadow-sm transition disabled:opacity-50">
            <div className="font-bold text-brand-800">{r.label} →</div>
            <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={() => router.push("/designer/converge")}
          className="px-4 py-2 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">← 질의 수렴으로</button>
        <button onClick={() => router.push("/designer/stage-1")}
          className="px-4 py-2 rounded border border-brand-300 text-brand-700 text-sm hover:bg-brand-50">단계별 수동 미세조정 →</button>
      </div>
    </div>
  );
}
