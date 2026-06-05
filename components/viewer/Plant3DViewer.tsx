"use client";
// 단순 3D 뷰어 (R3F 미설치 → SVG isometric 대체)
// 실제 R3F 통합은 v1.5에서 진행, MVP는 SVG 등각투상

import { useDustStore } from "@/lib/store/dust-store";
import { selectPreset, PID_PRESETS } from "@/lib/drawing/dust/presets";

export function Plant3DViewer() {
  const o = useDustStore((s) => s.outputs);
  const presetId = selectPreset(
    o.stage4?.primary_choice.type ?? "dry",
    o.stage5?.primary ?? "bag_filter"
  );
  const preset = PID_PRESETS[presetId];

  // 등각투상 좌표 변환 (60° 각도)
  const iso = (x: number, y: number, z: number) => ({
    x: (x - z) * Math.cos(Math.PI / 6),
    y: y - (x + z) * Math.sin(Math.PI / 6),
  });

  const FILL_BY_TYPE: Record<string, string> = {
    hood: "#fef3c7", baghouse: "#bfdbfe", cyclone: "#ddd6fe",
    ep: "#bbf7d0", sda: "#fed7aa", ac_injection: "#fecaca",
    venturi: "#cffafe", fan: "#fee2e2", stack: "#e5e7eb",
    quencher: "#bae6fd", boiler: "#fef3c7", condenser_shell: "#ddd6fe",
    rotary_valve: "#e2e8f0", isolation_valve: "#fecaca",
    cyclonic_separator: "#cffafe", mist_eliminator: "#a5f3fc",
    blast_gate: "#e2e8f0", tank: "#cbd5e1", pump: "#a78bfa",
  };

  return (
    <div className="bg-gradient-to-b from-sky-50 to-gray-100 border border-gray-300 rounded-lg p-6">
      <svg viewBox="-100 -100 1200 600" className="w-full h-[400px]">
        {/* 바닥 격자 */}
        <defs>
          <pattern id="floor-grid" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
          </pattern>
        </defs>
        <polygon
          points="-50,400 1100,400 1300,250 100,250"
          fill="url(#floor-grid)"
          stroke="#94a3b8"
          strokeWidth="1"
        />

        {/* 장비 배치 */}
        {preset.nodes.map((n, i) => {
          const x = (i % 5) * 220 + 50;
          const z = Math.floor(i / 5) * 100;
          const y = 0;
          const p = iso(x, y, z);
          const w = 90, h = 60, d = 40;
          const top = iso(x, y - h, z);
          const front = iso(x, y, z);
          const right = iso(x + w, y, z);
          const fill = FILL_BY_TYPE[n.type] ?? "#e5e7eb";

          return (
            <g key={n.id}>
              {/* Top face */}
              <polygon
                points={`${p.x},${p.y - h} ${iso(x + w, y - h, z).x},${iso(x + w, y - h, z).y} ${iso(x + w, y - h, z + d).x},${iso(x + w, y - h, z + d).y} ${iso(x, y - h, z + d).x},${iso(x, y - h, z + d).y}`}
                fill={fill}
                stroke="#1f2937"
                strokeWidth="1"
              />
              {/* Front face */}
              <polygon
                points={`${p.x},${p.y} ${iso(x + w, y, z).x},${iso(x + w, y, z).y} ${iso(x + w, y - h, z).x},${iso(x + w, y - h, z).y} ${p.x},${p.y - h}`}
                fill={fill}
                stroke="#1f2937"
                strokeWidth="1"
                opacity="0.85"
              />
              {/* Right face */}
              <polygon
                points={`${iso(x + w, y, z).x},${iso(x + w, y, z).y} ${iso(x + w, y, z + d).x},${iso(x + w, y, z + d).y} ${iso(x + w, y - h, z + d).x},${iso(x + w, y - h, z + d).y} ${iso(x + w, y - h, z).x},${iso(x + w, y - h, z).y}`}
                fill={fill}
                stroke="#1f2937"
                strokeWidth="1"
                opacity="0.7"
              />
              {/* Tag */}
              <text x={p.x + 25} y={p.y - h - 8} fontSize="11" fontWeight="bold" fill="#1f2937">{n.tag}</text>
              <text x={p.x + 25} y={p.y - h + 5} fontSize="9" fill="#374151">{n.label.slice(0, 20)}</text>
            </g>
          );
        })}

        {/* 범례 */}
        <g transform="translate(20, 0)">
          <rect width="180" height="30" fill="white" stroke="#cbd5e1" strokeWidth="1" rx="4" />
          <text x="10" y="20" fontSize="11" fontWeight="bold" fill="#374151">
            등각투상 — {preset.label}
          </text>
        </g>
      </svg>

      <div className="mt-4 p-3 bg-white border border-gray-200 rounded text-sm">
        <div className="font-bold mb-1">📱 모바일 AR 배치 (model-viewer)</div>
        <p className="text-gray-600 text-xs">
          v1.5에서 활성화: glTF 모델 + iOS Quick Look + Android Scene Viewer 자동분기.
          현재 등각투상 미리보기로 대체 표시.
        </p>
      </div>
    </div>
  );
}
