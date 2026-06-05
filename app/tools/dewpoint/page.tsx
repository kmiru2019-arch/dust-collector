"use client";
import { useState } from "react";
import { Card, CardTitle, KpiCard } from "@/components/ui/Card";
import { Field, NumberInput } from "@/components/ui/Input";
import { verhoffBanchero, waterDewpoint } from "@/lib/calc/dust/01-properties";
import { fmt } from "@/lib/utils";
import Link from "next/link";

export default function DewpointTool() {
  const [H2O_pct, setH2O] = useState(8);
  const [SO3_ppm, setSO3] = useState(10);
  const [T_C, setT] = useState(150);
  const [RH, setRH] = useState(20);

  const T_acid = verhoffBanchero(H2O_pct / 100, SO3_ppm * 1e-6);
  const T_water = waterDewpoint(T_C, RH);
  const margin_acid = T_acid > 0 ? T_C - T_acid : null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/tools" className="text-sm text-brand-700 hover:underline">← 단일 계산기</Link>
        <h1 className="text-3xl font-bold text-brand-900 mt-2 mb-6">노점 계산기 (Verhoff-Banchero)</h1>

        <Card>
          <CardTitle>가스 조성</CardTitle>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="H₂O (vol %)" hint="습도 함량">
              <NumberInput value={H2O_pct} onChange={(e) => setH2O(+e.target.value)} step="0.5" />
            </Field>
            <Field label="SO₃ (ppm)" hint="0이면 황산 노점 N/A">
              <NumberInput value={SO3_ppm} onChange={(e) => setSO3(+e.target.value)} step="0.5" />
            </Field>
            <Field label="현재 온도 (°C)">
              <NumberInput value={T_C} onChange={(e) => setT(+e.target.value)} />
            </Field>
            <Field label="상대습도 RH (%)">
              <NumberInput value={RH} onChange={(e) => setRH(+e.target.value)} />
            </Field>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-3 mt-6">
          <KpiCard
            label="황산 노점"
            value={T_acid > 0 ? fmt(T_acid, 0) : "—"}
            unit="°C"
            big color="safety"
            hint="Verhoff-Banchero (1977)"
          />
          <KpiCard
            label="수증기 노점"
            value={fmt(T_water, 0)}
            unit="°C"
            big color="brand"
            hint="Magnus-Tetens"
          />
          {margin_acid !== null && (
            <KpiCard
              label="산응축 마진"
              value={fmt(margin_acid, 0)}
              unit="K"
              color={margin_acid < 20 ? "safety" : "brand"}
              hint={margin_acid < 20 ? "⚠ 마진 부족 (≥20K 권장)" : "✓ 안전"}
            />
          )}
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
          <div className="font-bold mb-1">설계 룰</div>
          <ul className="space-y-1">
            <li>• 운전온도 ≥ 황산노점 + 20°C (마진)</li>
            <li>• 케이싱·덕트 보온 두께 50~100 mm</li>
            <li>• 시동 시 보조히터·N₂ 퍼지로 콜드스팟 응축 방지</li>
            <li>• 마진 부족 시 재질: SUS316L → Hastelloy C-276</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
