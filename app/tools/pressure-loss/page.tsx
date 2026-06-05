"use client";
import { useState } from "react";
import { Card, CardTitle, KpiCard } from "@/components/ui/Card";
import { Field, NumberInput, Select } from "@/components/ui/Input";
import { swameeJain, airViscosity } from "@/lib/calc/dust/03-duct";
import { airDensity } from "@/lib/calc/dust/02-hood";
import { DUCT_ROUGHNESS_MM, FITTING_K } from "@/lib/data/dust/duct-fittings";
import { fmt, fmtPa_to_mmAq } from "@/lib/utils";
import Link from "next/link";
import type { DuctMaterial } from "@/lib/calc/dust/types";

export default function PressureLossTool() {
  const [Q, setQ] = useState(100);
  const [D_mm, setD] = useState(350);
  const [L, setL] = useState(30);
  const [material, setMaterial] = useState<DuctMaterial>("SS400");
  const [T, setT] = useState(25);
  const [elbows, setElbows] = useState(2);

  const D = D_mm / 1000;
  const A = (Math.PI / 4) * D * D;
  const V = Q / 60 / A;
  const ρ = airDensity(T);
  const μ = airViscosity(T);
  const Re = (ρ * V * D) / μ;
  const ε_D = DUCT_ROUGHNESS_MM[material] / 1000 / D;
  const f = swameeJain(Re, ε_D);
  const dP_straight = (f * (L / D) * ρ * V * V) / 2;
  const K_elbow = FITTING_K["elbow_90_R1.5"];
  const dP_local = K_elbow * elbows * ρ * V * V / 2;
  const dP_total = dP_straight + dP_local;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/tools" className="text-sm text-brand-700 hover:underline">← 단일 계산기</Link>
        <h1 className="text-3xl font-bold text-brand-900 mt-2 mb-6">덕트 정압손실 (Swamee-Jain + 손실계수)</h1>

        <Card>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="풍량 Q (m³/min)">
              <NumberInput value={Q} onChange={(e) => setQ(+e.target.value)} />
            </Field>
            <Field label="덕트 직경 D (mm)">
              <NumberInput value={D_mm} onChange={(e) => setD(+e.target.value)} step="50" />
            </Field>
            <Field label="덕트 길이 L (m)">
              <NumberInput value={L} onChange={(e) => setL(+e.target.value)} />
            </Field>
            <Field label="재질">
              <Select value={material} onChange={(e) => setMaterial(e.target.value as DuctMaterial)}>
                <option value="SS400">SS400 (탄소강, ε=0.046mm)</option>
                <option value="SUS304">SUS304 (ε=0.015mm)</option>
                <option value="SUS316L">SUS316L (ε=0.015mm)</option>
                <option value="FRP">FRP (ε=0.005mm)</option>
                <option value="Galvanized">갈바나이즈드 (ε=0.15mm)</option>
              </Select>
            </Field>
            <Field label="가스 온도 (°C)">
              <NumberInput value={T} onChange={(e) => setT(+e.target.value)} />
            </Field>
            <Field label="90° 엘보 (R/D=1.5) 개수">
              <NumberInput value={elbows} onChange={(e) => setElbows(+e.target.value)} />
            </Field>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-3 mt-6">
          <KpiCard label="실제 속도 V" value={fmt(V, 1)} unit="m/s" />
          <KpiCard label="Reynolds" value={Re.toExponential(2)} hint="Re = ρVD/μ" />
          <KpiCard label="마찰계수 f" value={fmt(f, 4)} hint="Swamee-Jain" />
          <KpiCard label="직선 손실" value={fmtPa_to_mmAq(dP_straight)} hint="f·(L/D)·ρV²/2" />
          <KpiCard label="국부 손실 (엘보)" value={fmtPa_to_mmAq(dP_local)} hint="K·ρV²/2" />
          <KpiCard label="총 정압" value={fmtPa_to_mmAq(dP_total)} big color="safety" />
        </div>
      </div>
    </main>
  );
}
