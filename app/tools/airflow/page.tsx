"use client";
import { useState } from "react";
import { Card, CardTitle, KpiCard } from "@/components/ui/Card";
import { Field, NumberInput, Select } from "@/components/ui/Input";
import { calcHoodFlowrate } from "@/lib/calc/dust/02-hood";
import { CONTROL_VELOCITY } from "@/lib/data/dust/kosha-controls";
import { fmt } from "@/lib/utils";
import Link from "next/link";

export default function AirflowTool() {
  const [hood, setHood] = useState<keyof typeof CONTROL_VELOCITY>("enclosing");
  const [particle, setParticle] = useState(true);
  const [area, setArea] = useState(1.0);
  const [X, setX] = useState(0.3);
  const [P, setP] = useState(2.0);
  const [H, setH] = useState(1.0);
  const [SF, setSF] = useState(1.25);

  const V_c = CONTROL_VELOCITY[hood][particle ? "particle" : "gas"];
  const Q = calcHoodFlowrate(
    {
      hood_type: hood,
      open_area_m2: area,
      face_area_m2: area,
      source_area_m2: area,
      capture_distance_X_m: X,
      source_perimeter_m: P,
      hood_height_H_m: H,
      source_diameter_D_m: Math.sqrt(area / Math.PI) * 2,
      slot_length_m: P,
      safety_factor: SF,
    },
    V_c
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/tools" className="text-sm text-brand-700 hover:underline">← 단일 계산기</Link>
        <h1 className="text-3xl font-bold text-brand-900 mt-2 mb-6">풍량 계산기 (KOSHA W-1)</h1>

        <Card>
          <CardTitle>입력</CardTitle>
          <div className="space-y-4">
            <Field label="후드 형식">
              <Select value={hood} onChange={(e) => setHood(e.target.value as any)}>
                <option value="enclosing">포위형</option>
                <option value="exterior_lateral">외부식 측방</option>
                <option value="exterior_downward">외부식 하방</option>
                <option value="exterior_upward">외부식 상방</option>
                <option value="canopy">캐노피</option>
                <option value="receiving">레시버</option>
                <option value="slot">슬롯</option>
                <option value="booth">부스</option>
              </Select>
            </Field>
            <Field label="발산원 종류">
              <Select value={particle ? "particle" : "gas"} onChange={(e) => setParticle(e.target.value === "particle")}>
                <option value="particle">입자상 (분진·흄·미스트)</option>
                <option value="gas">가스상 (가스·증기)</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="면적/개구 (m²)">
                <NumberInput value={area} onChange={(e) => setArea(+e.target.value)} step="0.1" />
              </Field>
              <Field label="안전계수 SF">
                <NumberInput value={SF} onChange={(e) => setSF(+e.target.value)} step="0.05" />
              </Field>
              {hood.startsWith("exterior") && (
                <Field label="포집거리 X (m)">
                  <NumberInput value={X} onChange={(e) => setX(+e.target.value)} step="0.1" />
                </Field>
              )}
              {hood === "canopy" && (
                <>
                  <Field label="발산원 둘레 P (m)">
                    <NumberInput value={P} onChange={(e) => setP(+e.target.value)} />
                  </Field>
                  <Field label="후드 높이 H (m)">
                    <NumberInput value={H} onChange={(e) => setH(+e.target.value)} step="0.1" />
                  </Field>
                </>
              )}
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-3 mt-6">
          <KpiCard label="제어풍속 V_c" value={fmt(V_c, 2)} unit="m/s" big color="brand"
            hint="별표13 적용" />
          <KpiCard label="후드 풍량 Q_h" value={fmt(Q, 0)} unit="m³/min" big color="safety" />
        </div>

        <div className="mt-8 p-4 bg-brand-50 border border-brand-200 rounded">
          <p className="text-sm text-brand-900">
            <strong>전체 8단 자동설계</strong>를 원하시면 — 풍량을 시작으로 덕트·집진기·송풍기·법규까지 한번에.
          </p>
          <Link href="/designer/stage-1" className="inline-block mt-2 px-4 py-2 bg-brand-600 text-white rounded text-sm">
            전체 위저드 시작 →
          </Link>
        </div>
      </div>
    </main>
  );
}
