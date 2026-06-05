"use client";
import { useDustStore } from "@/lib/store/dust-store";
import { WizardNav } from "@/components/designer/WizardNav";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, NumberInput, Select, Checkbox } from "@/components/ui/Input";
import Link from "next/link";

export default function Stage4Page() {
  const inputs = useDustStore((s) => s.inputs.stage4);
  const outputs = useDustStore((s) => s.outputs.stage4);
  const setInput = useDustStore((s) => s.setStage4Input);

  return (
    <>
      <WizardNav currentStage={4} />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Stage 4 — 처리방식 결정</CardTitle>
          <div className="space-y-4">
            <Field label="목표 효율 (%)">
              <NumberInput
                value={inputs.target_efficiency_pct ?? 99}
                onChange={(e) => setInput({ target_efficiency_pct: +e.target.value })}
                min="50" max="99.99" step="0.5"
              />
            </Field>
            <Field label="목표 배출농도 (mg/Sm³)">
              <NumberInput
                value={inputs.target_emission_mg_Sm3 ?? 30}
                onChange={(e) => setInput({ target_emission_mg_Sm3: +e.target.value })}
              />
            </Field>
            <Field label="예산 등급">
              <Select
                value={inputs.budget_class ?? "medium"}
                onChange={(e) => setInput({ budget_class: e.target.value as any })}
              >
                <option value="low">저예산 (단순 건식)</option>
                <option value="medium">중간 (표준)</option>
                <option value="high">고예산 (WESP·하이브리드)</option>
              </Select>
            </Field>
            <Checkbox
              label="폐열 활용처 있음 (WHB·APH 검토)"
              checked={inputs.has_waste_heat_use ?? false}
              onChange={(e) => setInput({ has_waste_heat_use: e.target.checked })}
            />
            <Checkbox
              label="물 사용 가능 (습식·반건식)"
              checked={inputs.water_available ?? true}
              onChange={(e) => setInput({ water_available: e.target.checked })}
            />
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>처리방식 권장 (스코어 순)</CardTitle>
            <div className="space-y-2">
              {outputs?.treatment_ranked.map((c, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-md border ${
                    i === 0 ? "bg-brand-50 border-brand-300" : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold">{c.type}</div>
                    <div className="text-sm font-mono text-brand-700">{(c.score * 100).toFixed(0)}점</div>
                  </div>
                  <div className="text-xs text-gray-600">{c.reason}</div>
                  {i === 0 && (
                    <div className="mt-2 inline-block px-2 py-0.5 bg-brand-600 text-white text-xs rounded">
                      ★ 1순위 — Stage 5에 자동 반영
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-between">
            <Link href="/designer/stage-3" className="px-4 py-2 text-brand-700 hover:underline">← Stage 3</Link>
            <Link href="/designer/stage-5" className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700">
              Stage 5 →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
