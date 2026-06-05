# System Definition JSON 스키마

8단 위저드의 모든 출력을 통합한 단일 JSON. 이 JSON 하나로:
- BFD/PFD/P&ID 3단계 도면 파생 (출력모드만 변경)
- 3D 어셈블리 구성
- DXF 좌표 추출
- PDF 보고서 데이터 소스
- BOM 엑셀 생성

## 최상위 구조

```typescript
interface SystemDefinition {
  meta: {
    id: string;             // Firestore document id
    project: string;
    customer: string;
    designer: string;
    date_created: string;   // ISO8601
    date_revised: string;
    revision: string;       // "Rev. A", "Rev. B" ...
    industry: IndustryCode;
    preset_used?: PresetCode;
  };
  inputs: AllStageInputs;
  outputs: {
    stage1: Stage1Output;
    stage2: Stage2Output;
    // ... stage8
  };
  equipment: Equipment[];
  lines: Line[];
  instruments: Instrument[];
  valves: Valve[];
  safety: SafetyDevice[];
  layout?: {
    plot_plan: { width: number, height: number, equipment_positions: Map<string, [x, y]> };
    elevations: Elevation[];
  };
}
```

## Equipment 배열

```typescript
interface Equipment {
  id: string;             // "HD-01", "BF-01", "ID-01"
  type: EquipmentType;
  label: { ko: string, en: string };
  
  // 위치 (P&ID 자동배치 또는 사용자 지정)
  x?: number; y?: number;  // null이면 elkjs/dagre 자동
  
  // 설계 파라미터
  params: {
    [key: string]: number | string | boolean;
  };
  
  // 연결점 (포트)
  ports: {
    in: { id: string, position: "top"|"bottom"|"left"|"right" }[];
    out: { id: string, position: "top"|"bottom"|"left"|"right" }[];
    util?: { id: string, type: string }[];  // air_pulse, slurry, etc.
  };
  
  // 시각화
  svg_symbol: string;     // 'baghouse'
  dimensions_mm?: { L: number, W: number, H: number };
  
  // 표시정보 (P&ID 라벨)
  display: {
    tag: string;          // "BF-01"
    title: string;        // "Pulse Jet Baghouse"
    subtitle?: string;    // "A=300 m², 200×Ø160×6m bags"
  };
}

type EquipmentType =
  | "hood" | "duct" | "damper" | "blast_gate"
  | "cyclone" | "multi_cyclone" | "settling_chamber" | "inertial"
  | "baghouse_pulse_jet" | "baghouse_reverse_air" | "baghouse_shaker" | "cartridge"
  | "ep_dry" | "ep_wet"
  | "venturi" | "packed_bed" | "spray_tower" | "cyclonic_separator" | "mist_eliminator"
  | "sda" | "ac_injection" | "lime_silo"
  | "condenser_PHE" | "condenser_shell_tube" | "condenser_finned" | "condenser_air_cooled" | "quencher"
  | "fan_radial" | "fan_turbo" | "fan_airfoil" | "fan_sirocco" | "fan_axial"
  | "stack" | "hopper" | "rotary_valve" | "screw_conveyor"
  | "compressor" | "air_receiver" | "pump"
  | "boiler_WHB" | "GGH";
```

## Line 배열

```typescript
interface Line {
  id: string;             // "L-001"
  type: "process" | "compressed_air" | "cooling_water" | "slurry" | "wastewater" | "steam" | "instrument";
  from: { equipment: string, port: string };  // "HD-01", "out-1"
  to: { equipment: string, port: string };
  
  // 사양
  size_mm?: number;       // 덕트 직경
  material?: string;      // "SS400", "SUS316L", "FRP"
  insulation?: { thickness_mm: number, material: string };
  flow_direction: "forward" | "reverse";
  
  // 파이프북 (P&ID line numbering)
  line_number?: string;   // "200-PG-SS-001-N"
                          //  size-service-mat-seq-class
  
  // 시각화
  width: 0.7 | 1.0 | 0.35 | 0.18;
  style: "solid" | "dashed" | "dash-dot" | "dash-dot-dot";
  color?: string;
}
```

## Instrument 배열

```typescript
interface Instrument {
  id: string;             // "PDT-101"
  tag: string;            // "PDT-101"
  function: ISAFunction;  // "PDT", "TT", "AIT" ...
  
  // 측정 대상
  measures: { equipment?: string, line?: string, location: string };
  
  // 제어 루프 (있을 시)
  loop_id?: string;       // "BF-01-DP-CTRL"
  control_target?: string;
  
  // 표시
  display_position: "field" | "control_room" | "DCS";
  
  x?: number; y?: number;
}

type ISAFunction = 
  | "TT"|"TIT"|"TE"|"TC"
  | "PT"|"PIT"|"PDT"|"PSV"|"PSL"|"PSH"
  | "FT"|"FIC"|"FE"
  | "LT"|"LIC"|"LSL"|"LSH"
  | "AIT"|"AT"  // analyzers
  | "VT"|"ZIT"|"VSH"
  | "QIT";  // quantity (counter)
```

## Valve 배열

```typescript
interface Valve {
  id: string;             // "BD-01"
  type: "globe"|"gate"|"butterfly"|"check"|"rotary"|"slide"|"blast_gate"|"solenoid"|"diaphragm"|"damper";
  
  // 위치
  on_line: string;        // "L-001"
  position_on_line: number;  // 0~1
  
  // 사양
  size_mm: number;
  actuator: "manual"|"motor"|"pneumatic"|"hydraulic";
  fail_position?: "open"|"close"|"as-is";
  
  // 제어
  controlled_by?: string; // "FIC-101"
  
  display: { tag: string, ... };
}
```

## SafetyDevice 배열

```typescript
interface SafetyDevice {
  id: string;             // "ER-01"
  type: "PSV"|"rupture_disc"|"explosion_relief_vent"|"flame_arrester"|"isolation_valve";
  
  // 보호 대상
  protects: string;       // equipment id
  
  // 사양
  setpoint?: { value: number, unit: string };
  area_m2?: number;       // ER vent
  rated_for?: string;     // "Kst 200, ST1"
  
  // 인증
  certification?: string[]; // "ATEX", "IECEx", "FM", "UL"
}
```

## 예시: 프리셋 1 (건식 백필터 단독)

```json
{
  "meta": {
    "id": "design_xyz",
    "project": "ACME 목공장 집진 개선",
    "industry": "woodworking",
    "preset_used": "preset_1_dry_bag"
  },
  "equipment": [
    { "id": "HD-01", "type": "hood", "ports": {"in":[],"out":[{"id":"out-1","position":"right"}]}, "params": {"V_c": 0.7, "Q": 200}, "svg_symbol": "hood", "display": {"tag":"HD-01","title":"포위식 후드"}},
    { "id": "BF-01", "type": "baghouse_pulse_jet", "ports": {"in":[{"id":"in-1","position":"left"}],"out":[{"id":"out-1","position":"right"}],"util":[{"id":"pulse-air","type":"compressed_air"}]}, "params": {"AC": 1.2, "A_total": 200, "media": "PE"}, "svg_symbol": "baghouse", "display": {"tag":"BF-01","title":"펄스제트 백필터"}},
    { "id": "FN-01", "type": "fan_turbo", "ports": {"in":[{"id":"in-1","position":"left"}],"out":[{"id":"out-1","position":"right"}]}, "params": {"BHP": 30, "VFD": true}, "svg_symbol": "fan", "display": {"tag":"FN-01","title":"ID 송풍기"}},
    { "id": "ST-01", "type": "stack", "ports": {"in":[{"id":"in-1","position":"bottom"}],"out":[]}, "params": {"H": 15}, "svg_symbol": "stack", "display": {"tag":"ST-01"}}
  ],
  "lines": [
    { "id": "L-001", "type": "process", "from": {"equipment":"HD-01","port":"out-1"}, "to": {"equipment":"BF-01","port":"in-1"}, "size_mm": 400, "material": "SS400" },
    { "id": "L-002", "type": "process", "from": {"equipment":"BF-01","port":"out-1"}, "to": {"equipment":"FN-01","port":"in-1"}, "size_mm": 400 },
    { "id": "L-003", "type": "process", "from": {"equipment":"FN-01","port":"out-1"}, "to": {"equipment":"ST-01","port":"in-1"}, "size_mm": 400 }
  ],
  "instruments": [
    { "id": "PDT-101", "tag": "PDT-101", "function": "PDT", "measures": {"equipment":"BF-01","location":"in-out"}, "loop_id": "BF-01-CLEAN" },
    { "id": "TT-101", "tag": "TT-101", "function": "TT", "measures": {"equipment":"BF-01","location":"inlet"} }
  ],
  "valves": [
    { "id": "BD-01", "type": "blast_gate", "on_line": "L-001", "position_on_line": 0.2, "size_mm": 400, "actuator": "manual", "display": {"tag":"BD-01"}}
  ],
  "safety": [
    { "id": "ER-01", "type": "explosion_relief_vent", "protects": "BF-01", "area_m2": 1.5, "rated_for": "Kst 150 ST1", "certification": ["NFPA 68"]}
  ]
}
```

## Zod 스키마 (검증)

```typescript
// lib/drawing/dust/system-schema.ts
import { z } from "zod";

export const equipmentSchema = z.object({
  id: z.string(),
  type: equipmentTypeSchema,
  label: z.object({ ko: z.string(), en: z.string() }).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  params: z.record(z.union([z.number(), z.string(), z.boolean()])),
  ports: z.object({
    in: z.array(z.object({ id: z.string(), position: portPositionSchema })),
    out: z.array(z.object({ id: z.string(), position: portPositionSchema })),
    util: z.array(z.object({ id: z.string(), type: z.string() })).optional(),
  }),
  svg_symbol: z.string(),
  display: z.object({ tag: z.string(), title: z.string() }),
});

export const systemDefinitionSchema = z.object({
  meta: metaSchema,
  inputs: allStageInputsSchema,
  outputs: allStageOutputsSchema,
  equipment: z.array(equipmentSchema),
  lines: z.array(lineSchema),
  instruments: z.array(instrumentSchema),
  valves: z.array(valveSchema),
  safety: z.array(safetyDeviceSchema),
});
```

## 시리얼라이저 (lib/drawing/dust/serializer.ts)

```typescript
export function serializeFromOutputs(outputs: AllStageOutputs, meta: Meta): SystemDefinition {
  const equipment: Equipment[] = [];
  const lines: Line[] = [];
  const instruments: Instrument[] = [];
  // ...
  
  // Stage 2 → 후드
  equipment.push({
    id: "HD-01",
    type: "hood",
    params: { V_c: outputs.stage2.V_c_applied, Q: outputs.stage2.Q_hood },
    // ...
  });
  
  // Stage 5 → 1차/2차/3차 집진기
  if (outputs.stage5.collector.primary === "cyclone") {
    equipment.push({
      id: "CY-01",
      type: "cyclone",
      params: { ... outputs.stage5.cyclone_params },
    });
  }
  if (outputs.stage5.collector.secondary === "bag_filter_pulse_jet") {
    equipment.push({ id: "BF-01", type: "baghouse_pulse_jet", ... });
  }
  
  // ... Stage 6, 7 추가
  
  // Lines 자동 연결 (순서대로)
  lines.push(...autoConnectInOrder([HD, CY, BF, FN, ST]));
  
  return { meta, inputs, outputs, equipment, lines, instruments, valves, safety };
}
```
