"use client";
import { useMemo } from "react";
import { ReactFlow, Background, Controls, type Node, type Edge, type NodeProps, Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SystemPreset, SystemNode } from "@/lib/drawing/dust/presets";

const COLORS_BY_TYPE: Record<string, string> = {
  hood: "#fbbf24",
  baghouse: "#0ea5e9",
  cyclone: "#8b5cf6",
  ep: "#10b981",
  sda: "#f97316",
  ac_injection: "#dc2626",
  venturi: "#0891b2",
  cyclonic_separator: "#0e7490",
  mist_eliminator: "#06b6d4",
  quencher: "#0284c7",
  fan: "#ef4444",
  stack: "#374151",
  rotary_valve: "#94a3b8",
  blast_gate: "#9ca3af",
  isolation_valve: "#dc2626",
  condenser_shell: "#a78bfa",
  boiler: "#f59e0b",
  tank: "#64748b",
  pump: "#7c3aed",
};

const SHAPES_BY_TYPE: Record<string, string> = {
  hood: "▽",
  cyclone: "◉",
  baghouse: "▭",
  ep: "▥",
  sda: "△",
  ac_injection: "◆",
  venturi: "⌐",
  cyclonic_separator: "◯",
  mist_eliminator: "≣",
  quencher: "◑",
  fan: "✦",
  stack: "⊥",
  rotary_valve: "◎",
  blast_gate: "▸",
  isolation_valve: "⊠",
  condenser_shell: "▦",
  boiler: "⬢",
  tank: "▣",
  pump: "◐",
};

function EquipmentNode({ data }: NodeProps) {
  const d = data as { tag: string; label: string; type: string };
  const color = COLORS_BY_TYPE[d.type] ?? "#6b7280";
  const shape = SHAPES_BY_TYPE[d.type] ?? "■";

  return (
    <div
      className="rounded-lg border-2 bg-white shadow-sm px-3 py-2 min-w-[140px] text-center"
      style={{ borderColor: color }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="text-2xl" style={{ color }}>{shape}</div>
      <div className="text-xs font-bold" style={{ color }}>{d.tag}</div>
      <div className="text-xs text-gray-700">{d.label}</div>
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </div>
  );
}

const nodeTypes = { equipment: EquipmentNode };

function autoLayout(nodes: SystemNode[]): SystemNode[] {
  // 간단 자동 배치 — 좌→우 수평 흐름
  const cols = Math.ceil(Math.sqrt(nodes.length));
  return nodes.map((n, i) => ({
    ...n,
    x: n.x ?? (i % Math.max(cols, 4)) * 220 + 50,
    y: n.y ?? Math.floor(i / Math.max(cols, 4)) * 130 + 50,
  }));
}

export function PIDViewer({ preset }: { preset: SystemPreset }) {
  const { nodes, edges } = useMemo(() => {
    const layouted = autoLayout(preset.nodes);
    const flowNodes: Node[] = layouted.map((n) => ({
      id: n.id,
      type: "equipment",
      position: { x: n.x!, y: n.y! },
      data: { tag: n.tag, label: n.label, type: n.type },
    }));
    const flowEdges: Edge[] = preset.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.type !== "utility",
      style: {
        stroke: e.type === "utility" ? "#3b82f6" : e.type === "signal" ? "#9333ea" : "#374151",
        strokeWidth: e.type === "utility" ? 1.5 : 2.5,
        strokeDasharray: e.type === "signal" ? "5 5" : undefined,
      },
    }));
    return { nodes: flowNodes, edges: flowEdges };
  }, [preset]);

  return (
    <div className="h-[600px] border border-gray-300 rounded-lg bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
