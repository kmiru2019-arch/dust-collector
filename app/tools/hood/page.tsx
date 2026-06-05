"use client";
import { useState } from "react";
import { Card, CardTitle, KpiCard } from "@/components/ui/Card";
import { Field, NumberInput, Select } from "@/components/ui/Input";
import { airDensity, calcHoodPressureDrop } from "@/lib/calc/dust/02-hood";
import { HOOD_LOSS_COEFFICIENT } from "@/lib/data/dust/kosha-controls";
import { fmt, fmtPa_to_mmAq } from "@/lib/utils";
import Link from "next/link";
import type { HoodType } from "@/lib/calc/dust/types";

export default function HoodTool() {
  const [hood, setHood] = useState<HoodType>("enclosing");
  const [V, setV] = useState(18);
  const [T, setT] = useState(25);
  const ρ = airDensity(T);
  const dP = calcHoodPressureDrop(hood, V, ρ);
  const K = HOOD_LOSS_COEFFICIENT[hood];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/tools" className="text-sm text-brand-700 hover:underline">← 단일 계산기</Link>
        <h1 className="text-3xl font-bold text-brand-900 mt-2 mb-6">후드 정압손실</h1>

        <Card>
          <div className="space-y-4">
            <Field label="후드 형식">
              <Select value={hood} onChange={(e) => setHood(e.target.value as HoodType)}>
                <option value="enclosing">포위형 (K=0.49)</option>
                <option value="exterior_lateral">외부식 측방 (K=0.50)</option>
                <option value="exterior_downward">외부식 하방 (K=0.50)</option>
                <option value="exterior_upward">외부식 상방 (K=0.49)</option>
                <option value="canopy">캐노피 (K=0.25)</option>
                <option value="receiving">레시버 (K=0.40)</option>
                <option value="slot">슬롯 (K=1.78)</option>
                <option value="booth">부스 (K=0.50)</option>
              </Select>
            </Field>
            <Field label="덕트 속도 V (m/s)">
              <NumberInput value={V} onChange={(e) => setV(+e.target.value)} step="0.5" />
            </Field>
            <Field label="가스 온도 (°C)">
              <NumberInput value={T} onChange={(e) => setT(+e.target.value)} />
            </Field>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-3 mt-6">
          <KpiCard label="K_hood" value={fmt(K, 2)} hint="후드 손실계수" />
          <KpiCard label="공기밀도 ρ" value={fmt(ρ, 3)} unit="kg/m³" hint="이상기체" />
          <KpiCard
            label="ΔP_hood"
            value={fmtPa_to_mmAq(dP)}
            big color="safety"
            hint="(1+K)·ρ·V²/2"
          />
        </div>
      </div>
    </main>
  );
}
