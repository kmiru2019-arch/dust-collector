"use client";
import { useDustStore } from "@/lib/store/dust-store";
import { WizardNav } from "@/components/designer/WizardNav";
import { Card, CardTitle, KpiCard } from "@/components/ui/Card";
import { Field, NumberInput, Select } from "@/components/ui/Input";
import { fmt, fmtPa_to_mmAq } from "@/lib/utils";
import Link from "next/link";

export default function Stage2Page() {
  const inputs = useDustStore((s) => s.inputs.stage2);
  const outputs = useDustStore((s) => s.outputs.stage2);
  const setInput = useDustStore((s) => s.setStage2Input);

  return (
    <>
      <WizardNav currentStage={2} />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Stage 2 — 후드 설계</CardTitle>
          <div className="space-y-4">
            <Field label="후드 형식 (KOSHA W-1)">
              <Select
                value={inputs.hood_type}
                onChange={(e) => setInput({ hood_type: e.target.value as any })}
              >
                <option value="enclosing">포위형 (Enclosing)</option>
                <option value="exterior_lateral">외부식 측방</option>
                <option value="exterior_downward">외부식 하방</option>
                <option value="exterior_upward">외부식 상방</option>
                <option value="canopy">캐노피</option>
                <option value="receiving">레시버</option>
                <option value="slot">슬롯</option>
                <option value="booth">부스</option>
              </Select>
            </Field>

            {(inputs.hood_type === "enclosing" || inputs.hood_type === "booth") && (
              <Field label="개구·작업면 면적 (m²)">
                <NumberInput
                  value={inputs.open_area_m2 ?? inputs.face_area_m2 ?? 1}
                  onChange={(e) => setInput({ open_area_m2: +e.target.value, face_area_m2: +e.target.value })}
                  step="0.1"
                />
              </Field>
            )}

            {inputs.hood_type.startsWith("exterior") && (
              <>
                <Field label="발산원 면적 A (m²)">
                  <NumberInput
                    value={inputs.source_area_m2 ?? 0.5}
                    onChange={(e) => setInput({ source_area_m2: +e.target.value })}
                    step="0.1"
                  />
                </Field>
                <Field label="포집 거리 X (m)">
                  <NumberInput
                    value={inputs.capture_distance_X_m ?? 0.3}
                    onChange={(e) => setInput({ capture_distance_X_m: +e.target.value })}
                    step="0.1"
                  />
                </Field>
              </>
            )}

            {inputs.hood_type === "canopy" && (
              <>
                <Field label="발산원 둘레 P (m)">
                  <NumberInput
                    value={inputs.source_perimeter_m ?? 2}
                    onChange={(e) => setInput({ source_perimeter_m: +e.target.value })}
                  />
                </Field>
                <Field label="후드 높이 H (m)">
                  <NumberInput
                    value={inputs.hood_height_H_m ?? 1}
                    onChange={(e) => setInput({ hood_height_H_m: +e.target.value })}
                    step="0.1"
                  />
                </Field>
              </>
            )}

            <Field label="안전계수 SF (1.0~2.0)">
              <NumberInput
                value={inputs.safety_factor ?? 1.25}
                onChange={(e) => setInput({ safety_factor: +e.target.value })}
                step="0.05"
                min="1.0" max="2.0"
              />
            </Field>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>풍량·정압 결과</CardTitle>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="제어풍속 V_c" value={fmt(outputs?.V_c_applied_m_s, 2)} unit="m/s" big color="brand"
                hint="별표13 적용" />
              <KpiCard label="후드 풍량 Q_h" value={fmt(outputs?.Q_hood_m3min, 0)} unit="m³/min" big color="brand"
                hint="60·V·A·SF" />
              <KpiCard label="후드 정압손실" value={fmtPa_to_mmAq(outputs?.dP_hood_Pa ?? 0)}
                hint="(1+K)·ρ·V²/2" />
            </div>
          </Card>

          <div className="flex justify-between">
            <Link href="/designer/stage-1" className="px-4 py-2 text-brand-700 hover:underline">← Stage 1</Link>
            <Link href="/designer/stage-3" className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700">
              Stage 3 →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
