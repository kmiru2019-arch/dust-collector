"use client";
import { useDustStore } from "@/lib/store/dust-store";
import { WizardNav } from "@/components/designer/WizardNav";
import { Card, CardTitle, KpiCard } from "@/components/ui/Card";
import { Field, NumberInput, Select, Checkbox } from "@/components/ui/Input";
import { ValidationBanner } from "@/components/designer/ValidationBanner";
import { INDUSTRIES } from "@/lib/data/dust/industries";
import { DUST_TYPES } from "@/lib/data/dust/dust-types";
import { fmt } from "@/lib/utils";
import Link from "next/link";

export default function Stage1Page() {
  const inputs = useDustStore((s) => s.inputs.stage1);
  const outputs = useDustStore((s) => s.outputs.stage1);
  const setStage1Input = useDustStore((s) => s.setStage1Input);

  const onIndustry = (code: string) => {
    const profile = INDUSTRIES[code as keyof typeof INDUSTRIES];
    if (!profile) return;
    const dustEntry = DUST_TYPES[profile.code] ?? Object.values(DUST_TYPES).find((d) => d.code.includes(code));
    setStage1Input({
      dust: {
        ...inputs.dust,
        industry: code as any,
        dust_name: profile.typical_dust.name,
        d50_um: profile.typical_dust.d50_um,
        particle_density_kg_m3: profile.typical_dust.particle_density_kg_m3,
        flammable: profile.typical_dust.flammable ?? false,
        Kst_bar_m_s: profile.typical_dust.Kst_bar_m_s,
        ...(dustEntry ? {
          stickiness: dustEntry.stickiness,
          corrosive: dustEntry.corrosive,
        } : {}),
      },
      gas: { ...inputs.gas, T_in_C: profile.typical_gas.T_in_C, ...profile.typical_gas },
    } as any);
  };

  return (
    <>
      <WizardNav currentStage={1} />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Stage 1 — 분진/가스 성상</CardTitle>
          <div className="space-y-4">
            <Field label="산업 (선택 시 디폴트 자동입력)">
              <Select value={inputs.dust.industry} onChange={(e) => onIndustry(e.target.value)}>
                {Object.values(INDUSTRIES).map((p) => (
                  <option key={p.code} value={p.code}>{p.label_ko}</option>
                ))}
              </Select>
            </Field>

            <h4 className="font-bold text-sm pt-2 border-t">분진</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="d50 (μm)">
                <NumberInput
                  value={inputs.dust.d50_um}
                  onChange={(e) => setStage1Input({ dust: { ...inputs.dust, d50_um: +e.target.value } })}
                />
              </Field>
              <Field label="입자밀도 (kg/m³)">
                <NumberInput
                  value={inputs.dust.particle_density_kg_m3}
                  onChange={(e) => setStage1Input({ dust: { ...inputs.dust, particle_density_kg_m3: +e.target.value } })}
                />
              </Field>
              <Field label="점착성">
                <Select
                  value={inputs.dust.stickiness}
                  onChange={(e) => setStage1Input({ dust: { ...inputs.dust, stickiness: e.target.value as any } })}
                >
                  <option value="low">낮음</option>
                  <option value="medium">중간</option>
                  <option value="high">높음</option>
                </Select>
              </Field>
              <Field label="부식성">
                <Select
                  value={inputs.dust.corrosive}
                  onChange={(e) => setStage1Input({ dust: { ...inputs.dust, corrosive: e.target.value as any } })}
                >
                  <option value="none">없음</option>
                  <option value="mild">약함</option>
                  <option value="severe">강함</option>
                </Select>
              </Field>
            </div>

            <Checkbox
              label="가연성 분진 (폭발성)"
              checked={inputs.dust.flammable}
              onChange={(e) => setStage1Input({ dust: { ...inputs.dust, flammable: e.target.checked } })}
            />
            {inputs.dust.flammable && (
              <div className="grid grid-cols-3 gap-3 pl-4 border-l-2 border-amber-300">
                <Field label="Kst (bar·m/s)">
                  <NumberInput
                    value={inputs.dust.Kst_bar_m_s ?? ""}
                    onChange={(e) => setStage1Input({ dust: { ...inputs.dust, Kst_bar_m_s: +e.target.value || undefined } })}
                  />
                </Field>
                <Field label="MIE (mJ)">
                  <NumberInput
                    value={inputs.dust.MIE_mJ ?? ""}
                    onChange={(e) => setStage1Input({ dust: { ...inputs.dust, MIE_mJ: +e.target.value || undefined } })}
                  />
                </Field>
                <Field label="MIT (°C)">
                  <NumberInput
                    value={inputs.dust.MIT_C ?? ""}
                    onChange={(e) => setStage1Input({ dust: { ...inputs.dust, MIT_C: +e.target.value || undefined } })}
                  />
                </Field>
              </div>
            )}

            <h4 className="font-bold text-sm pt-2 border-t">가스</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="입구 온도 (°C)">
                <NumberInput
                  value={inputs.gas.T_in_C}
                  onChange={(e) => setStage1Input({ gas: { ...inputs.gas, T_in_C: +e.target.value } })}
                />
              </Field>
              <Field label="상대습도 (%)">
                <NumberInput
                  value={inputs.gas.RH_in_pct}
                  onChange={(e) => setStage1Input({ gas: { ...inputs.gas, RH_in_pct: +e.target.value } })}
                />
              </Field>
              <Field label="HCl (ppm)">
                <NumberInput
                  value={inputs.gas.HCl_ppm ?? 0}
                  onChange={(e) => setStage1Input({ gas: { ...inputs.gas, HCl_ppm: +e.target.value } })}
                />
              </Field>
              <Field label="SO2 (ppm)">
                <NumberInput
                  value={inputs.gas.SO2_ppm ?? 0}
                  onChange={(e) => setStage1Input({ gas: { ...inputs.gas, SO2_ppm: +e.target.value } })}
                />
              </Field>
              <Field label="SO3 (ppm) — 황산노점 계산용">
                <NumberInput
                  value={inputs.gas.SO3_ppm ?? 0}
                  onChange={(e) => setStage1Input({ gas: { ...inputs.gas, SO3_ppm: +e.target.value } })}
                />
              </Field>
              <Field label="H₂O (vol %)">
                <NumberInput
                  value={inputs.gas.H2O_vol_pct ?? 8}
                  onChange={(e) => setStage1Input({ gas: { ...inputs.gas, H2O_vol_pct: +e.target.value } })}
                />
              </Field>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>자동 도출 결과</CardTitle>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="ST 등급" value={outputs?.derived.ST_class ?? "—"} hint="KOSHA D-13" />
              <KpiCard
                label="황산 노점"
                value={outputs && outputs.derived.dewpoint_acid_C > 0
                  ? fmt(outputs.derived.dewpoint_acid_C, 0) : "—"}
                unit="°C"
                hint="Verhoff-Banchero"
              />
              <KpiCard
                label="수증기 노점"
                value={fmt(outputs?.derived.dewpoint_water_C, 0)}
                unit="°C"
                hint="Magnus"
              />
              <KpiCard
                label="비저항 (low~high)"
                value={outputs ? `${outputs.derived.resistivity_estimate.low_Ohm_cm.toExponential(0)}` : "—"}
                hint="Ω·cm (Bickelhaupt)"
              />
            </div>
          </Card>

          <Card>
            <CardTitle>처리방식 후보</CardTitle>
            <div className="space-y-1">
              {outputs?.derived.treatment_candidates.map((c, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-2 rounded-md text-sm ${
                    i === 0 ? "bg-brand-100 border border-brand-300" : "bg-gray-50"
                  }`}
                >
                  <div>
                    <div className="font-bold">{c.type}</div>
                    <div className="text-xs text-gray-600">{c.reason}</div>
                  </div>
                  <div className="text-sm font-mono">{(c.score * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end">
            <Link
              href="/designer/stage-2"
              className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
            >
              Stage 2 →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
