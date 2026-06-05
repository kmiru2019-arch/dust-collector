"use client";
import { useDustStore } from "@/lib/store/dust-store";
import { WizardNav } from "@/components/designer/WizardNav";
import { Card, CardTitle, KpiCard } from "@/components/ui/Card";
import { Field, NumberInput, Checkbox } from "@/components/ui/Input";
import { ValidationBanner } from "@/components/designer/ValidationBanner";
import { fmt, fmtKWh, fmtPa_to_mmAq } from "@/lib/utils";
import Link from "next/link";

export default function Stage7Page() {
  const inputs = useDustStore((s) => s.inputs.stage7);
  const outputs = useDustStore((s) => s.outputs.stage7);
  const setInput = useDustStore((s) => s.setStage7Input);

  return (
    <>
      <WizardNav currentStage={7} />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Stage 7 — 송풍기 배치</CardTitle>
          <div className="space-y-4">
            <Field label="흡인 지점 수">
              <NumberInput
                value={inputs?.hood_branches ?? 1}
                onChange={(e) => setInput({ hood_branches: +e.target.value })}
                min="1"
              />
            </Field>
            <Field label="덕트 길이 합계 (m)">
              <NumberInput
                value={inputs?.duct_length_m ?? 50}
                onChange={(e) => setInput({ duct_length_m: +e.target.value })}
              />
            </Field>
            <Field label="연간 운전시간 (h/yr)">
              <NumberInput
                value={inputs?.op_hours_yr ?? 6000}
                onChange={(e) => setInput({ op_hours_yr: +e.target.value })}
              />
            </Field>
            <Field label="부하 변동 (%)">
              <NumberInput
                value={inputs?.load_variation_pct ?? 15}
                onChange={(e) => setInput({ load_variation_pct: +e.target.value })}
                min="0" max="100"
              />
            </Field>
            <Field label="전력단가 (원/kWh)">
              <NumberInput
                value={inputs?.R_kWh_won ?? 100}
                onChange={(e) => setInput({ R_kWh_won: +e.target.value })}
              />
            </Field>
            <Checkbox
              label="이중화 (N+1 redundancy) 요구"
              checked={inputs?.redundancy_required ?? false}
              onChange={(e) => setInput({ redundancy_required: e.target.checked })}
            />
            <Checkbox
              label="마모성 분진 (Radial 강제)"
              checked={inputs?.abrasive_dust ?? false}
              onChange={(e) => setInput({ abrasive_dust: e.target.checked })}
            />
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>송풍기 사양</CardTitle>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <KpiCard
                label="배치"
                value={outputs?.arrangement ?? "—"}
                big color="brand"
                hint={`팬 ${outputs?.fan_count ?? 0}대`}
              />
              <KpiCard
                label="총 동력"
                value={fmt(outputs?.total_kW, 0)}
                unit="kW"
                big color="brand"
              />
              <KpiCard
                label="연간 전력량"
                value={outputs ? fmtKWh(outputs.annual_kWh) : "—"}
              />
              <KpiCard
                label="연간 운전비"
                value={outputs ? `${(outputs.annual_cost_won / 1e6).toFixed(0)}` : "—"}
                unit="백만원"
              />
              {outputs?.VFD_payback_yr && (
                <KpiCard
                  label="VFD ROI"
                  value={fmt(outputs.VFD_payback_yr, 1)}
                  unit="년"
                  color="brand"
                />
              )}
              <KpiCard label="재질 권장" value={outputs?.fan_material ?? "—"} />
            </div>

            <div className="space-y-2">
              {outputs?.fans.map((f, i) => (
                <div key={f.id} className="p-2 bg-gray-50 rounded text-xs flex flex-wrap gap-2">
                  <span className="font-bold">{f.id}</span>
                  <span>{f.role}</span>
                  <span className="font-mono">{f.type}</span>
                  <span>{fmt(f.Q_m3min, 0)} m³/min</span>
                  <span>{fmtPa_to_mmAq(f.dP_Pa)}</span>
                  <span className="font-bold">{f.motor_kW} kW</span>
                  {f.VFD && <span className="px-2 bg-brand-600 text-white rounded">VFD</span>}
                </div>
              ))}
            </div>
          </Card>

          <ValidationBanner warnings={outputs?.warnings ?? []} title="송풍기 검증" />

          <div className="flex justify-between">
            <Link href="/designer/stage-6" className="px-4 py-2 text-brand-700 hover:underline">← Stage 6</Link>
            <Link href="/designer/stage-8" className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700">
              Stage 8 →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
