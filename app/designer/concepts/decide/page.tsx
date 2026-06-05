"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConceptStore } from "@/lib/store/concept-store";
import { useDustStore } from "@/lib/store/dust-store";
import { conceptToStages } from "@/lib/concept/to-stages";
import { Card, CardTitle } from "@/components/ui/Card";
import { INDUSTRIES } from "@/lib/data/dust/industries";
import { getStandardLayout, compactLayout } from "@/lib/data/dust/standard-layout";
import {
  baghouseDimension, cycloneDimension, epDimension, sdaDimension,
  venturiDimension, fanDimension, stackDimension,
} from "@/lib/data/dust/equipment-sizing";
import Link from "next/link";

function DecideInner() {
  const router = useRouter();
  const params = useSearchParams();
  const conceptSet = useConceptStore((s) => s.conceptSet);
  const [applied, setApplied] = useState(false);
  const [autoInputs, setAutoInputs] = useState<any>(null);

  const id = params.get("id");
  const concept = conceptSet?.concepts.find((c) => c.id === id);

  useEffect(() => {
    if (!conceptSet || !concept) return;
    const inputs = conceptToStages(conceptSet.brief, concept);
    setAutoInputs(inputs);
  }, [conceptSet, concept]);

  if (!conceptSet || !concept) {
    return <div className="p-8 text-center text-gray-500">개념 데이터 없음 — <Link href="/designer/brief" className="text-brand-700 underline">Brief로</Link></div>;
  }

  // 설비 외형·배치 선제시 (Phase D·E)
  const brief = conceptSet.brief;
  const Q_m3min = brief.flowrate_Nm3h / 60;
  const ind = INDUSTRIES[brief.industry];
  const layout = brief.constraints.tight_space
    ? compactLayout(getStandardLayout(ind?.preset ?? "preset_1"))
    : getStandardLayout(ind?.preset ?? "preset_1");

  // 라인업 설비별 외형
  const equipDims: { name: string; dim: any }[] = [];
  if (concept.stages.primary === "cyclone" || concept.stages.secondary === "cyclone")
    equipDims.push({ name: "사이클론", dim: cycloneDimension(Q_m3min) });
  if (concept.stages.primary === "scrubber" && concept.treatment.includes("SDA"))
    equipDims.push({ name: "SDA 흡수탑", dim: sdaDimension(Q_m3min, brief.T_in_C) });
  if (concept.stages.primary === "scrubber" && !concept.treatment.includes("SDA"))
    equipDims.push({ name: "벤추리 스크러버", dim: venturiDimension(Q_m3min) });
  if (concept.stages.primary === "ep")
    equipDims.push({ name: "전기집진기 (EP)", dim: epDimension(Q_m3min) });
  if (concept.stages.primary === "bag_filter" || concept.stages.secondary === "bag_filter")
    equipDims.push({ name: "백필터", dim: baghouseDimension(Q_m3min) });
  equipDims.push({ name: "송풍기", dim: fanDimension(Q_m3min) });
  equipDims.push({ name: "스택", dim: stackDimension(Q_m3min) });

  const applyAndGo = () => {
    if (!autoInputs) return;
    // 8단 store에 자동 입력값 주입
    const dustStore = useDustStore.getState();
    dustStore.reset();
    (["stage1", "stage2", "stage3", "stage4", "stage5", "stage6", "stage7", "stage8"] as const).forEach((k) => {
      const setter = (dustStore as any)[`set${k.charAt(0).toUpperCase() + k.slice(1)}Input`];
      if (setter) setter(autoInputs[k]);
    });
    setApplied(true);
    setTimeout(() => router.push("/designer/result"), 300);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">정밀 설계 — 자동 입력값 확인</h1>
      <div className="p-3 bg-brand-50 border border-brand-200 rounded text-sm">
        선택한 안: <span className="font-bold">{concept.label}</span><br/>
        Brief 입력 + 산업 표준값으로 8단 위저드 입력이 자동 채워졌습니다. 그대로 진행하거나 수정 후 정밀 계산하세요.
      </div>

      {autoInputs && (
        <Card>
          <CardTitle>자동 채워진 주요 값 (수정 가능 — 8단 위저드에서)</CardTitle>
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <Row l="산업" v={autoInputs.stage1.dust.industry} />
            <Row l="처리 풍량 (Brief)" v={`${conceptSet.brief.flowrate_Nm3h.toLocaleString()} Nm³/h`} />
            <Row l="가스 온도" v={`${autoInputs.stage1.gas.T_in_C} °C`} />
            <Row l="분진 d50" v={`${autoInputs.stage1.dust.d50_um} μm`} />
            <Row l="HCl" v={`${autoInputs.stage1.gas.HCl_ppm ?? 0} ppm`} />
            <Row l="1차 집진" v={autoInputs.stage5.primary} />
            <Row l="2차 집진" v={autoInputs.stage5.series?.secondary ?? "—"} />
            <Row l="여재" v={autoInputs.stage5.bag?.manual_media ?? "—"} />
            <Row l="덕트 재질" v={autoInputs.stage3.material} />
            <Row l="덕트 길이 (표준배치)" v={`${autoInputs.stage3.branches[0].length_m} m`} />
            <Row l="목표 배출" v={`${autoInputs.stage4.target_emission_mg_Sm3} mg/Sm³`} />
            <Row l="사업장 종별 추정" v={`연 ${autoInputs.stage8.annual_emission_t} t`} />
          </div>
        </Card>
      )}

      {/* 설비 외형·노즐 선제시 (Phase E) */}
      <Card>
        <CardTitle>📐 설비 외형·노즐 자동 산출 — "이대로 가면 시공 문제 없음"</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2">설비</th>
                <th className="text-left p-2">외형 (W×D×H mm)</th>
                <th className="text-left p-2">Inlet Ø</th>
                <th className="text-left p-2">Outlet Ø</th>
                <th className="text-left p-2">이격</th>
                <th className="text-left p-2">비고</th>
              </tr>
            </thead>
            <tbody>
              {equipDims.map((e, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2 font-medium">{e.name}</td>
                  <td className="p-2 font-mono text-xs">
                    {e.dim.W_mm ? `${e.dim.W_mm}×${e.dim.D_mm ?? "-"}×${e.dim.H_mm}` : `Ø${e.dim.D_mm} × H${e.dim.H_mm}`}
                  </td>
                  <td className="p-2">{e.dim.inlet_dia_mm ? `Ø${e.dim.inlet_dia_mm}` : "—"}</td>
                  <td className="p-2">{e.dim.outlet_dia_mm ? `Ø${e.dim.outlet_dia_mm}` : "—"}</td>
                  <td className="p-2">{e.dim.clearance_mm} mm</td>
                  <td className="p-2 text-xs text-gray-500">{e.dim.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 덕트 표준 배치 선제시 (Phase D) */}
      <Card>
        <CardTitle>📏 덕트 표준 배치 (최단 권장) — 필요 부지 {layout.footprint_W_m}×{layout.footprint_D_m}m, 높이 {layout.max_height_m}m</CardTitle>
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">구간</th>
              <th className="text-left p-2">길이</th>
              <th className="text-left p-2">엘보 90°</th>
              <th className="text-left p-2">기타</th>
            </tr>
          </thead>
          <tbody>
            {layout.segments.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2 font-mono text-xs">{s.from} → {s.to}</td>
                <td className="p-2">{s.length_m} m</td>
                <td className="p-2">{s.elbow_90 ?? 0}개</td>
                <td className="p-2 text-xs text-gray-500">{s.expansion ? "확대 1" : ""}</td>
              </tr>
            ))}
            <tr className="border-t-2 font-bold">
              <td className="p-2">총계</td>
              <td className="p-2">{layout.total_length_m} m</td>
              <td className="p-2" colSpan={2}>
                {brief.constraints.tight_space ? "⚠ 부지 협소 — 압축 배치 (엘보 추가)" : "✓ 표준 배치 (시공 OK)"}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between">
        <Link href="/designer/concepts" className="text-brand-700 hover:underline text-sm">← 안 비교로</Link>
        <button onClick={applyAndGo} disabled={applied}
          className="px-6 py-2.5 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 disabled:opacity-50">
          {applied ? "8단 적용 중..." : "정밀 설계 진행 (8단 자동입력) →"}
        </button>
      </div>
    </div>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-1">
      <span className="text-gray-500">{l}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

export default function DecidePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">로딩...</div>}>
      <DecideInner />
    </Suspense>
  );
}
