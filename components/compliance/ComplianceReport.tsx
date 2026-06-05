"use client";
import { useDustStore } from "@/lib/store/dust-store";
import { Card, CardTitle, KpiCard } from "@/components/ui/Card";
import { fmt } from "@/lib/utils";

export function ComplianceReport() {
  const s8 = useDustStore((s) => s.outputs.stage8);

  if (!s8) return <div className="p-4 text-gray-500">Stage 8 데이터가 없습니다.</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>1. 사업장 종별 (대기환경보전법 시행령 별표1의3)</CardTitle>
        <div className="text-2xl font-bold text-brand-700">{s8.classification}</div>
      </Card>

      <Card>
        <CardTitle>2. 배출허용기준 (시행규칙 별표8)</CardTitle>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">항목</th>
              <th className="text-right p-2">기준값</th>
              <th className="text-left p-2">단위</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(s8.emission_standards).map(([key, v]) => (
              <tr key={key} className="border-b">
                <td className="p-2 font-medium">{key}</td>
                <td className="p-2 text-right font-mono">{v.value}</td>
                <td className="p-2 text-gray-600">{v.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardTitle>3~6. 의무 사항</CardTitle>
        <div className="grid md:grid-cols-2 gap-3">
          <KpiCard label="3. TMS 부착" value={s8.TMS_required ? "의무" : "면제"}
            color={s8.TMS_required ? "safety" : "brand"} />
          <KpiCard label="4. 비산먼지 신고" value={s8.fugitive_dust_obligation ? "의무" : "면제"} />
          <KpiCard label="5. VOC 시설" value={s8.VOC_obligation ? "의무" : "면제"} />
          <KpiCard label="6. 분진작업 26종" value={`${s8.dust26_obligations.length}건`} />
        </div>
        {s8.dust26_obligations.length > 0 && (
          <ul className="mt-3 text-sm space-y-1">
            {s8.dust26_obligations.map((o, i) => <li key={i}>• {o.item}</li>)}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>7. 제어풍속 (별표13)</CardTitle>
        <div className="text-2xl font-bold">{fmt(s8.control_velocity_m_s, 2)} m/s</div>
        <div className="text-xs text-gray-500 mt-1">KOSHA W-1-2019 기반</div>
      </Card>

      <Card>
        <CardTitle>8. 안전검사 도래일 (산안법 제93조)</CardTitle>
        <div className="text-sm text-gray-700">최초: 설치+3년 / 정기: 이후 2년마다</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 font-mono text-sm">
          {s8.inspection_schedule.slice(0, 6).map((d, i) => (
            <div key={d} className={i === 0 ? "p-2 bg-amber-100 rounded font-bold" : "p-2 bg-gray-50 rounded"}>
              {i === 0 ? "최초" : `정기 ${i}`}: {d}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>9. 유해위험방지계획서 (산안법 제48조)</CardTitle>
        <div className="text-lg font-bold">
          {s8.prevention_plan.required ? "✅ 제출 필요" : "면제"}
        </div>
        {s8.prevention_plan.required && s8.prevention_plan.deadline && (
          <div className="text-sm mt-1">제출 마감: {s8.prevention_plan.deadline}</div>
        )}
      </Card>

      <Card>
        <CardTitle>10. 작업환경측정 (산안법 제125조)</CardTitle>
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="측정 주기" value={s8.measurement.freq === "quarterly" ? "분기 1회 (발암성)" : "반기 1회"} />
          <KpiCard label="결과 보존" value={`${s8.measurement.retention_yr}년`} />
        </div>
      </Card>

      {s8.explosion && (
        <Card>
          <CardTitle>11. 분진폭발 평가 (KOSHA D-43-2012 + NFPA 68)</CardTitle>
          <div className="grid md:grid-cols-3 gap-3 mb-3">
            <KpiCard label="ST 등급" value={s8.explosion.ST_class ?? "—"} color="safety" />
            <KpiCard label="폭발벤트 면적" value={fmt(s8.explosion.vent_area_m2, 2)} unit="m²" />
            <KpiCard label="ATEX/IECEx" value={s8.explosion.ATEX_recommended ? "권장" : "—"} />
          </div>
          <div className="text-sm space-y-1">
            <div><strong>Zone 20</strong> (장기간): {s8.explosion.zone20_areas.join(", ")}</div>
            <div><strong>Zone 21</strong> (가끔): {s8.explosion.zone21_areas.join(", ")}</div>
            <div><strong>Zone 22</strong> (비정상): {s8.explosion.zone22_areas.join(", ")}</div>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>12. 보조금·융자 매칭 ({s8.subsidies.length}건)</CardTitle>
        <div className="space-y-2">
          {s8.subsidies.map((sub) => (
            <div key={sub.id} className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between">
                <div className="font-bold">{sub.name}</div>
                <div className="text-sm font-mono text-brand-700">
                  {sub.type === "loan"
                    ? `이자 ${((sub.interest_rate ?? 0) * 100).toFixed(1)}%`
                    : `${((sub.subsidy_rate ?? 0) * 100).toFixed(0)}% 지원`}
                </div>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {sub.max_amount_won && `한도 ${(sub.max_amount_won / 1e8).toFixed(1)}억원 · `}
                {sub.agency}
              </div>
              {sub.link && (
                <a href={sub.link} target="_blank" className="text-xs text-brand-600 hover:underline">
                  공고 페이지 →
                </a>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
        <div className="font-bold mb-1">⚠ 면책</div>
        <p>{s8.disclaimer}</p>
      </div>
    </div>
  );
}
