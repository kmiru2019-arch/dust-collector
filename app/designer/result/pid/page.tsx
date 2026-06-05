"use client";
import { useState } from "react";
import { useDustStore } from "@/lib/store/dust-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { Select, Field } from "@/components/ui/Input";
import { PIDViewer } from "@/components/flowchart/PIDViewer";
import { PID_PRESETS, selectPreset } from "@/lib/drawing/dust/presets";
import Link from "next/link";

export default function PIDPage() {
  const o = useDustStore((s) => s.outputs);
  const auto = selectPreset(
    o.stage4?.primary_choice.type ?? "dry",
    o.stage5?.primary ?? "bag_filter"
  );
  const [presetId, setPresetId] = useState(auto);
  const preset = PID_PRESETS[presetId];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">P&amp;ID 자동생성</h1>
        <Link href="/designer/result" className="text-brand-700 hover:underline">← 결과로 돌아가기</Link>
      </div>

      <Card>
        <CardTitle>표준 흐름도 5종</CardTitle>
        <Field label="프리셋 선택" hint={`자동 추천: ${PID_PRESETS[auto].label}`}>
          <Select value={presetId} onChange={(e) => setPresetId(e.target.value)}>
            {Object.entries(PID_PRESETS).map(([id, p]) => (
              <option key={id} value={id}>{p.label}</option>
            ))}
          </Select>
        </Field>
        <p className="text-sm text-gray-600 mt-2">{preset.description}</p>
      </Card>

      <PIDViewer preset={preset} />

      <Card>
        <CardTitle>장비 목록</CardTitle>
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left p-2">Tag</th>
              <th className="text-left p-2">설명</th>
              <th className="text-left p-2">형식</th>
            </tr>
          </thead>
          <tbody>
            {preset.nodes.map((n) => (
              <tr key={n.id} className="border-b">
                <td className="p-2 font-mono">{n.tag}</td>
                <td className="p-2">{n.label}</td>
                <td className="p-2 text-gray-500">{n.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
