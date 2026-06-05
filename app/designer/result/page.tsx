"use client";
import { useDustStore } from "@/lib/store/dust-store";
import { WizardNav } from "@/components/designer/WizardNav";
import { Card, CardTitle, KpiCard } from "@/components/ui/Card";
import { ValidationBanner } from "@/components/designer/ValidationBanner";
import { fmt, fmtKWh, fmtPa_to_mmAq } from "@/lib/utils";
import Link from "next/link";

export default function ResultPage() {
  const o = useDustStore((s) => s.outputs);

  // 전 단계 경고 통합
  const allWarnings: string[] = [
    ...(o.stage3?.warnings.map(w => `[덕트] ${w}`) ?? []),
    ...(o.stage5?.warnings.map(w => `[집진기] ${w}`) ?? []),
    ...(o.stage6?.warnings.map(w => `[응축기] ${w}`) ?? []),
    ...(o.stage7?.warnings.map(w => `[송풍기] ${w}`) ?? []),
  ];

  return (
    <>
      <WizardNav currentStage={9} />
      <div className="space-y-6">
        {allWarnings.length > 0 && (
          <ValidationBanner warnings={allWarnings} title="전 단계 검증 결과" />
        )}
        <Card>
          <CardTitle>최종 설계 산출물 — 집진설비 사양</CardTitle>
          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <KpiCard
              label="처리방식"
              value={o.stage4?.primary_choice.type ?? "—"}
              big color="brand"
            />
            <KpiCard
              label="집진방식"
              value={o.stage5?.primary ?? "—"}
              big color="brand"
            />
            <KpiCard
              label="총 효율"
              value={o.stage5 ? `${(o.stage5.efficiency_overall * 100).toFixed(2)}%` : "—"}
              big color="brand"
            />
            <KpiCard
              label="총 동력"
              value={fmt(o.stage7?.total_kW, 0)}
              unit="kW"
              big color="safety"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <KpiCard label="후드 풍량 Q_h" value={fmt(o.stage2?.Q_hood_m3min, 0)} unit="m³/min" />
            <KpiCard label="덕트 직경 D" value={fmt((o.stage3?.branches[0]?.D_m ?? 0) * 1000, 0)} unit="mm" />
            <KpiCard label="총 정압 ΔP" value={fmtPa_to_mmAq(
              (o.stage3?.total.dP_duct_Pa ?? 0) +
              (o.stage5?.dP_collector_Pa ?? 0)
            )} />
            <KpiCard label="송풍기 배치" value={o.stage7?.arrangement ?? "—"} />
            <KpiCard label="응축기" value={o.stage6?.type ?? "—"} />
            <KpiCard label="연간 전력량" value={o.stage7 ? fmtKWh(o.stage7.annual_kWh) : "—"} />
            <KpiCard label="사업장 종별" value={o.stage8?.classification ?? "—"} />
            <KpiCard
              label="ST 등급"
              value={o.stage1?.derived.ST_class ?? "—"}
              color={o.stage1?.derived.ST_class ? "safety" : "gray"}
            />
          </div>
        </Card>

        <Card>
          <CardTitle>산출물 다운로드</CardTitle>
          <div className="grid md:grid-cols-3 gap-3">
            <Link
              href="/designer/result/pid"
              className="p-4 border-2 border-brand-300 rounded-lg hover:bg-brand-50 transition text-center"
            >
              <div className="text-3xl mb-1">📊</div>
              <div className="font-bold">P&ID 자동생성</div>
              <div className="text-xs text-gray-600">5종 표준 흐름도</div>
            </Link>
            <Link
              href="/designer/result/3d"
              className="p-4 border-2 border-brand-300 rounded-lg hover:bg-brand-50 transition text-center"
            >
              <div className="text-3xl mb-1">🏭</div>
              <div className="font-bold">3D 미리보기 + AR</div>
              <div className="text-xs text-gray-600">현장 배치 시뮬레이션</div>
            </Link>
            <Link
              href="/designer/result/tco"
              className="p-4 border-2 border-brand-300 rounded-lg hover:bg-brand-50 transition text-center"
            >
              <div className="text-3xl mb-1">📈</div>
              <div className="font-bold">5년 TCO</div>
              <div className="text-xs text-gray-600">CAPEX + OPEX 분석</div>
            </Link>
            <Link
              href="/designer/result/compliance"
              className="p-4 border-2 border-amber-300 rounded-lg hover:bg-amber-50 transition text-center"
            >
              <div className="text-3xl mb-1">⚖️</div>
              <div className="font-bold">법규 컴플라이언스 리포트</div>
              <div className="text-xs text-gray-600">12항목 자동판정</div>
            </Link>
            <Link
              href="/designer/result/pdf"
              className="p-4 border-2 border-brand-300 rounded-lg hover:bg-brand-50 transition text-center"
            >
              <div className="text-3xl mb-1">📄</div>
              <div className="font-bold">PDF 보고서 12p</div>
              <div className="text-xs text-gray-600">Pretendard 한글 임베드</div>
            </Link>
            <Link
              href="/designer/result/bom"
              className="p-4 border-2 border-brand-300 rounded-lg hover:bg-brand-50 transition text-center"
            >
              <div className="text-3xl mb-1">📋</div>
              <div className="font-bold">BOM 자재명세서</div>
              <div className="text-xs text-gray-600">CSV 다운로드</div>
            </Link>
          </div>
        </Card>

        {o.stage8?.disclaimer && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
            <div className="font-bold mb-1">⚠ 면책 조항</div>
            <p>{o.stage8.disclaimer}</p>
          </div>
        )}
      </div>
    </>
  );
}
