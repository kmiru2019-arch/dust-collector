# P&ID 자동생성 — 구현 가이드

## 파이프라인

```
[8단 위저드 출력]
    → [serializer.ts: SystemDefinition JSON]
    → [layout.ts: elkjs/dagre 자동배치]
    → [pid-generator.ts: React Flow nodes/edges]
    → [PIDViewer.tsx 렌더]
    → [User edit (drag/connect)]
    → [save updated layout to JSON]
    → [export: SVG / PNG / PDF / DXF]
```

## 1. 라이브러리 선택 (확정)

| 영역 | 채택 | 사유 |
|---|---|---|
| 다이어그램 코어 | `@xyflow/react` (React Flow) | MIT, React 친화, 1M+ DL |
| 자동 레이아웃 | `elkjs` 또는 `dagre` | dagre는 React Flow 공식, elkjs는 더 정밀 |
| SVG 심볼 | drawio Process Engineering 발췌 + 자체 보강 | Apache 2.0 |
| 편집 UX | xyflow 자체 + 커스텀 사이드패널 | drawio iframe보다 일관성 |
| 내보내기 | xyflow 내장 SVG 추출 + 커스텀 PDF/DXF | - |

## 2. 자동 배치 (Layout)

```typescript
// lib/drawing/dust/layout.ts
import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

export async function autoLayout(system: SystemDefinition): Promise<LayoutedSystem> {
  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",       // 좌→우 흐름
      "elk.layered.spacing.nodeNodeBetweenLayers": "150",
      "elk.spacing.nodeNode": "80",
    },
    children: system.equipment.map(eq => ({
      id: eq.id,
      width: getNodeWidth(eq.type),     // 심볼별 폭
      height: getNodeHeight(eq.type),
    })),
    edges: system.lines.map(ln => ({
      id: ln.id,
      sources: [ln.from.equipment],
      targets: [ln.to.equipment],
    })),
  };
  
  const layouted = await elk.layout(elkGraph);
  
  return {
    ...system,
    equipment: system.equipment.map(eq => {
      const node = layouted.children.find(n => n.id === eq.id);
      return { ...eq, x: node?.x, y: node?.y };
    }),
  };
}
```

## 3. React Flow 변환

```typescript
// lib/drawing/dust/pid-generator.ts
import type { Node, Edge } from '@xyflow/react';

export function toReactFlow(system: LayoutedSystem): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = system.equipment.map(eq => ({
    id: eq.id,
    type: "equipment",          // custom node component
    position: { x: eq.x ?? 0, y: eq.y ?? 0 },
    data: {
      tag: eq.display.tag,
      title: eq.display.title,
      svg_symbol: eq.svg_symbol,
      params: eq.params,
      ports: eq.ports,
    },
  }));
  
  // 계장 풍선 (별도 노드)
  for (const inst of system.instruments) {
    nodes.push({
      id: inst.id,
      type: "instrument",
      position: instrumentPosition(inst, system),
      data: { tag: inst.tag, function: inst.function },
    });
  }
  
  // 안전장치 (별도 노드)
  for (const safe of system.safety) {
    nodes.push({
      id: safe.id,
      type: "safety",
      position: safetyPosition(safe, system),
      data: { type: safe.type, area_m2: safe.area_m2 },
    });
  }
  
  // Edges
  const edges: Edge[] = system.lines.map(ln => ({
    id: ln.id,
    source: ln.from.equipment,
    target: ln.to.equipment,
    sourceHandle: ln.from.port,
    targetHandle: ln.to.port,
    type: "process-line",       // custom edge for process/utility/signal
    data: {
      line_number: ln.line_number,
      size_mm: ln.size_mm,
      material: ln.material,
      service_type: ln.type,
    },
    style: getLineStyle(ln),
  }));
  
  // 안전장치 → 보호대상 연결 (점선)
  for (const safe of system.safety) {
    edges.push({
      id: `safe-${safe.id}`,
      source: safe.id,
      target: safe.protects,
      type: "safety-link",
      animated: false,
      style: { strokeDasharray: "5 5" },
    });
  }
  
  return { nodes, edges };
}
```

## 4. 커스텀 노드 컴포넌트

```tsx
// components/flowchart/EquipmentNode.tsx
import { Handle, Position } from '@xyflow/react';
import { SYMBOLS } from '@/lib/drawing/dust/symbols';

export function EquipmentNode({ data }: { data: EquipmentData }) {
  const Symbol = SYMBOLS[data.svg_symbol];
  
  return (
    <div className="equipment-node">
      <Symbol className="w-24 h-24" />
      <div className="tag">{data.tag}</div>
      <div className="title">{data.title}</div>
      
      {/* In ports */}
      {data.ports.in.map(p => (
        <Handle
          key={p.id}
          type="target"
          position={positionMap[p.position]}
          id={p.id}
        />
      ))}
      
      {/* Out ports */}
      {data.ports.out.map(p => (
        <Handle
          key={p.id}
          type="source"
          position={positionMap[p.position]}
          id={p.id}
        />
      ))}
    </div>
  );
}
```

## 5. PIDViewer 컴포넌트

```tsx
// components/flowchart/PIDViewer.tsx
'use client';

import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '@/lib/store/dust-store';
import { useState, useEffect } from 'react';

const nodeTypes = {
  equipment: EquipmentNode,
  instrument: InstrumentNode,
  safety: SafetyNode,
};

const edgeTypes = {
  "process-line": ProcessLineEdge,
  "safety-link": SafetyLinkEdge,
};

export function PIDViewer({ mode = "P&ID" }: { mode?: "BFD"|"PFD"|"P&ID" }) {
  const system = useStore(s => s.systemDefinition);
  const [graph, setGraph] = useState<{nodes: Node[], edges: Edge[]} | null>(null);
  
  useEffect(() => {
    if (!system) return;
    autoLayout(system).then(layouted => {
      const filtered = filterByMode(layouted, mode);
      setGraph(toReactFlow(filtered));
    });
  }, [system, mode]);
  
  if (!graph) return <Skeleton />;
  
  return (
    <ReactFlow
      nodes={graph.nodes}
      edges={graph.edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
      <ExportButton />  {/* SVG / PNG / PDF / DXF */}
    </ReactFlow>
  );
}
```

## 6. 출력 모드 필터 (BFD/PFD/P&ID)

```typescript
function filterByMode(system: LayoutedSystem, mode: "BFD"|"PFD"|"P&ID"): LayoutedSystem {
  if (mode === "BFD") {
    // 블록만 — 계장·밸브·안전장치 제거, 라인은 단순 화살표
    return {
      ...system,
      instruments: [],
      valves: [],
      safety: [],
      lines: system.lines.map(ln => ({ ...ln, line_number: undefined })),
    };
  }
  if (mode === "PFD") {
    // 주요 장비 + 핵심 계장(T/P/F만) + 흐름표
    return {
      ...system,
      instruments: system.instruments.filter(i => 
        ["TT","PT","FT"].includes(i.function)
      ),
      valves: system.valves.filter(v => 
        ["globe","butterfly","damper"].includes(v.type)
      ),
    };
  }
  // P&ID: 전체
  return system;
}
```

## 7. 내보내기

### SVG/PNG (xyflow 내장)
```typescript
import { toSvg, toPng } from 'html-to-image';

async function exportPID(format: "svg"|"png") {
  const el = document.querySelector('.react-flow') as HTMLElement;
  const dataUrl = format === "svg" ? await toSvg(el) : await toPng(el);
  download(dataUrl, `pid-${meta.id}.${format}`);
}
```

### PDF (react-pdf 내부에 SVG 임베드)
```typescript
// PDF 보고서 내 P&ID 페이지
<Page size="A3" orientation="landscape">
  <Image src={pidSvgDataUrl} />
</Page>
```

### DXF (좌표 추출 → @dxfjs/writer)
```typescript
// lib/drawing/dust/dxf-export.ts
import DxfWriter from '@dxfjs/writer';

export function exportDXF(system: LayoutedSystem): Buffer {
  const dxf = new DxfWriter();
  dxf.setUnits(4); // mm
  
  // 헤더
  dxf.addLayer("EQUIPMENT", 7, "Continuous");
  dxf.addLayer("LINES", 1, "Continuous");
  dxf.addLayer("INSTRUMENTS", 5, "DASHED");
  
  // 장비
  for (const eq of system.equipment) {
    if (eq.dimensions_mm) {
      dxf.addRectangle({ x: eq.x, y: eq.y, width: eq.dimensions_mm.L, height: eq.dimensions_mm.W }, "EQUIPMENT");
    }
    dxf.addText({ x: eq.x, y: eq.y - 10, text: eq.display.tag }, "EQUIPMENT");
  }
  
  // 라인
  for (const ln of system.lines) {
    const from = system.equipment.find(e => e.id === ln.from.equipment);
    const to = system.equipment.find(e => e.id === ln.to.equipment);
    if (from && to) {
      dxf.addLine({ x: from.x, y: from.y }, { x: to.x, y: to.y }, "LINES");
    }
  }
  
  // 한국어 텍스트는 MTEXT로
  dxf.addMText({ x: 100, y: 100, text: "표제란 — 한글" });
  
  return dxf.toDxfString();
}
```

## 8. 한국 도면표준 (KS A 0106) 적용

P&ID 출력 시 다음 자동삽입:
- 도면 윤곽선 + 중심마크
- 우측 하단 표제란 (회사 CI / 도면명 / 도번 / 척도 / 일자 / 설계·검토·승인란)
- 좌측 상단 개정이력란
- A1·A3·A4 규격 자동 선택 (장비 수에 따라)

```typescript
// lib/drawing/dust/title-block.ts
export function generateTitleBlock(meta: Meta, options: TitleBlockOptions): SVGElement {
  // KS A 0106 규격에 따른 표제란 SVG 생성
}
```

## 9. 사용자 편집 → 저장

xyflow에서 사용자가 노드 드래그·연결 변경 → onNodesChange / onEdgesChange → store.updatePosition → 자동 저장 (Firestore)
