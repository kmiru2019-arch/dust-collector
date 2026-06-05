"use client";
import { useDustStore } from "@/lib/store/dust-store";
import { WizardNav } from "@/components/designer/WizardNav";
import { Card, CardTitle, KpiCard } from "@/components/ui/Card";
import { Field, NumberInput, Select } from "@/components/ui/Input";
import { ValidationBanner } from "@/components/designer/ValidationBanner";
import { fmt, fmtPa_to_mmAq } from "@/lib/utils";
import Link from "next/link";

export default function Stage3Page() {
  const inputs = useDustStore((s) => s.inputs.stage3);
  const outputs = useDustStore((s) => s.outputs.stage3);
  const setInput = useDustStore((s) => s.setStage3Input);
  const branch = inputs.branches[0];

  const updateBranch = (patch: any) => {
    setInput({ branches: [{ ...branch, ...patch }] });
  };

  return (
    <>
      <WizardNav currentStage={3} />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Stage 3 — 덕트 사이징</CardTitle>
          <div className="space-y-4">
            <Field label="처리 풍량 (m³/min)" hint="Stage 2 후드 풍량 자동 반영 가능">
              <NumberInput
                value={branch.Q_m3min}
                onChange={(e) => updateBranch({ Q_m3min: +e.target.value })}
              />
            </Field>
            <Field label="덕트 길이 (m)">
              <NumberInput
                value={branch.length_m}
                onChange={(e) => updateBranch({ length_m: +e.target.value })}
              />
            </Field>
            <Field label="덕트 재질">
              <Select
                value={inputs.material}
                onChange={(e) => setInput({ material: e.target.value as any })}
              >
                <option value="SS400">SS400 (탄소강)</option>
                <option value="SUS304">SUS304</option>
                <option value="SUS316L">SUS316L</option>
                <option value="FRP">FRP</option>
                <option value="Galvanized">갈바나이즈드</option>
              </Select>
            </Field>
            <Field
              label="반송속도 V_t (m/s)"
              hint="비워두면 분진별 권장값 자동 (분진 18~23, 흄 8~10)"
            >
              <NumberInput
                value={inputs.transport_velocity_m_s ?? ""}
                onChange={(e) => setInput({ transport_velocity_m_s: +e.target.value || undefined })}
                step="0.5"
              />
            </Field>
            <Field label="엘보 90° (R/D=1.5) 개수">
              <NumberInput
                value={branch.fittings.find((f) => f.type === "elbow_90_R1.5")?.count ?? 0}
                onChange={(e) => {
                  const count = +e.target.value;
                  updateBranch({
                    fittings: count > 0
                      ? [{ type: "elbow_90_R1.5", count }]
                      : [],
                  });
                }}
              />
            </Field>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>덕트 사이징 결과</CardTitle>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard
                label="덕트 직경 D"
                value={fmt(outputs?.branches[0]?.D_m * 1000, 0)}
                unit="mm"
                big color="brand"
                hint="표준 사이즈"
              />
              <KpiCard
                label="실제 속도"
                value={fmt(outputs?.branches[0]?.V_actual_m_s, 1)}
                unit="m/s"
                big color="brand"
              />
              <KpiCard
                label="Reynolds"
                value={outputs?.branches[0] ? `${outputs.branches[0].Re.toExponential(1)}` : "—"}
              />
              <KpiCard
                label="마찰계수 f"
                value={fmt(outputs?.branches[0]?.f, 4)}
                hint="Swamee-Jain"
              />
              <KpiCard
                label="직선 손실"
                value={fmtPa_to_mmAq(outputs?.branches[0]?.dP_straight_Pa ?? 0)}
              />
              <KpiCard
                label="국부 손실"
                value={fmtPa_to_mmAq(outputs?.branches[0]?.dP_local_Pa ?? 0)}
              />
              <KpiCard
                label="총 정압"
                value={fmtPa_to_mmAq(outputs?.total.dP_duct_Pa ?? 0)}
                color="safety"
              />
            </div>
          </Card>

          <ValidationBanner warnings={outputs?.warnings ?? []} title="Stage 3 검증" />

          <div className="flex justify-between">
            <Link href="/designer/stage-2" className="px-4 py-2 text-brand-700 hover:underline">← Stage 2</Link>
            <Link href="/designer/stage-4" className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700">
              Stage 4 →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
