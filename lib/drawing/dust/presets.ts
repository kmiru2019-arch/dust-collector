// 5종 표준 P&ID 흐름도 프리셋 — System JSON

export interface SystemNode {
  id: string;
  type: string;        // equipment type
  label: string;
  tag: string;
  x?: number;
  y?: number;
}

export interface SystemEdge {
  id: string;
  source: string;
  target: string;
  type?: "process" | "utility" | "signal";
  label?: string;
}

export interface SystemPreset {
  id: string;
  label: string;
  description: string;
  nodes: SystemNode[];
  edges: SystemEdge[];
}

// 프리셋 1 — 건식 백필터 단독
const preset1: SystemPreset = {
  id: "preset_1_dry_bag",
  label: "건식 백필터 단독",
  description: "일반산업·금속가공·시멘트밀 — Hood → Bag → ID Fan → Stack",
  nodes: [
    { id: "HD-01", type: "hood", label: "포위형 후드", tag: "HD-01" },
    { id: "BD-01", type: "blast_gate", label: "블래스트게이트", tag: "BD-01" },
    { id: "BF-01", type: "baghouse", label: "펄스제트 백필터 + ER벤트", tag: "BF-01" },
    { id: "RV-01", type: "rotary_valve", label: "로터리밸브 (분진배출)", tag: "RV-01" },
    { id: "FN-01", type: "fan", label: "ID 송풍기 (Turbo BC)", tag: "FN-01" },
    { id: "ST-01", type: "stack", label: "스택 + CEMS", tag: "ST-01" },
  ],
  edges: [
    { id: "L-001", source: "HD-01", target: "BD-01" },
    { id: "L-002", source: "BD-01", target: "BF-01" },
    { id: "L-003", source: "BF-01", target: "FN-01" },
    { id: "L-004", source: "BF-01", target: "RV-01", label: "↓호퍼" },
    { id: "L-005", source: "FN-01", target: "ST-01" },
  ],
};

// 프리셋 2 — 사이클론 + 백필터
const preset2: SystemPreset = {
  id: "preset_2_cyclone_bag",
  label: "사이클론 + 백필터 (직렬)",
  description: "목재·곡물 폭발성, 시멘트 — Cyclone(조분) → Bag(미분) → Fan",
  nodes: [
    { id: "HD-01", type: "hood", label: "포위형 후드", tag: "HD-01" },
    { id: "CY-01", type: "cyclone", label: "사이클론 (Stairmand HE)", tag: "CY-01" },
    { id: "BF-01", type: "baghouse", label: "백필터 (PE/Nomex) + ER벤트", tag: "BF-01" },
    { id: "RV-CY", type: "rotary_valve", label: "RV (조분)", tag: "RV-CY" },
    { id: "RV-BF", type: "rotary_valve", label: "RV (미분)", tag: "RV-BF" },
    { id: "ISO-01", type: "isolation_valve", label: "격리밸브 (NFPA 69)", tag: "ISO-01" },
    { id: "FN-01", type: "fan", label: "ID 송풍기", tag: "FN-01" },
    { id: "ST-01", type: "stack", label: "스택", tag: "ST-01" },
  ],
  edges: [
    { id: "L-001", source: "HD-01", target: "CY-01" },
    { id: "L-002", source: "CY-01", target: "ISO-01" },
    { id: "L-003", source: "ISO-01", target: "BF-01" },
    { id: "L-004", source: "CY-01", target: "RV-CY", label: "↓조분" },
    { id: "L-005", source: "BF-01", target: "RV-BF", label: "↓미분" },
    { id: "L-006", source: "BF-01", target: "FN-01" },
    { id: "L-007", source: "FN-01", target: "ST-01" },
  ],
};

// 프리셋 3 — 건식 EP
const preset3: SystemPreset = {
  id: "preset_3_ep",
  label: "건식 EP (시멘트·발전)",
  description: "Boiler → GGH/Cooler → ESP → ID Fan → Stack",
  nodes: [
    { id: "BO-01", type: "boiler", label: "Boiler/Kiln", tag: "BO-01" },
    { id: "HX-01", type: "condenser_shell", label: "GGH/Cooler 150°C", tag: "HX-01" },
    { id: "EP-01", type: "ep", label: "ESP 4 field", tag: "EP-01" },
    { id: "RV-01", type: "rotary_valve", label: "회분 배출 RV", tag: "RV-01" },
    { id: "FN-FD", type: "fan", label: "FD Fan (옵션)", tag: "FN-FD" },
    { id: "FN-ID", type: "fan", label: "ID Fan", tag: "FN-ID" },
    { id: "ST-01", type: "stack", label: "스택 + CEMS", tag: "ST-01" },
  ],
  edges: [
    { id: "L-001", source: "FN-FD", target: "BO-01" },
    { id: "L-002", source: "BO-01", target: "HX-01" },
    { id: "L-003", source: "HX-01", target: "EP-01" },
    { id: "L-004", source: "EP-01", target: "RV-01", label: "↓회분" },
    { id: "L-005", source: "EP-01", target: "FN-ID" },
    { id: "L-006", source: "FN-ID", target: "ST-01" },
  ],
};

// 프리셋 4 — 반건식 SDA + 백필터
const preset4: SystemPreset = {
  id: "preset_4_sda_bag",
  label: "반건식 SDA + 백필터 (소각)",
  description: "MSW 소각 — SDA(Ca(OH)₂) + AC + Bag(PTFE) → Fan",
  nodes: [
    { id: "FU-01", type: "boiler", label: "소각로 + 폐열보일러", tag: "FU-01" },
    { id: "SDA-01", type: "sda", label: "SDA (Ca(OH)₂ 분무)", tag: "SDA-01" },
    { id: "AC-01", type: "ac_injection", label: "활성탄 주입 (Hg/Dioxin)", tag: "AC-01" },
    { id: "BF-01", type: "baghouse", label: "백필터 PTFE", tag: "BF-01" },
    { id: "RV-01", type: "rotary_valve", label: "잔재 (지정폐기물)", tag: "RV-01" },
    { id: "FN-FD", type: "fan", label: "FD Fan (Radial)", tag: "FN-FD" },
    { id: "FN-ID", type: "fan", label: "ID Fan", tag: "FN-ID" },
    { id: "ST-01", type: "stack", label: "스택 + CEMS (PCDD)", tag: "ST-01" },
  ],
  edges: [
    { id: "L-001", source: "FN-FD", target: "FU-01" },
    { id: "L-002", source: "FU-01", target: "SDA-01" },
    { id: "L-003", source: "SDA-01", target: "AC-01" },
    { id: "L-004", source: "AC-01", target: "BF-01" },
    { id: "L-005", source: "BF-01", target: "RV-01", label: "↓잔재" },
    { id: "L-006", source: "BF-01", target: "FN-ID" },
    { id: "L-007", source: "FN-ID", target: "ST-01" },
  ],
};

// 프리셋 5 — 습식 벤추리
const preset5: SystemPreset = {
  id: "preset_5_venturi",
  label: "습식 벤추리 + 사이클로닉",
  description: "점착성·유증기·산미스트 — Quench → Venturi → Cyclonic → Mist E → Fan",
  nodes: [
    { id: "HD-01", type: "hood", label: "후드", tag: "HD-01" },
    { id: "QU-01", type: "quencher", label: "Quencher (직접냉각)", tag: "QU-01" },
    { id: "VE-01", type: "venturi", label: "벤추리 (가변 throat)", tag: "VE-01" },
    { id: "CS-01", type: "cyclonic_separator", label: "사이클로닉 분리기", tag: "CS-01" },
    { id: "ME-01", type: "mist_eliminator", label: "미스트 엘리미네이터 (셰브론)", tag: "ME-01" },
    { id: "TK-01", type: "tank", label: "슬러리 탱크", tag: "TK-01" },
    { id: "PU-01", type: "pump", label: "순환 펌프", tag: "PU-01" },
    { id: "FN-01", type: "fan", label: "ID Fan (FRP/SS316L)", tag: "FN-01" },
    { id: "ST-01", type: "stack", label: "스택", tag: "ST-01" },
  ],
  edges: [
    { id: "L-001", source: "HD-01", target: "QU-01" },
    { id: "L-002", source: "QU-01", target: "VE-01" },
    { id: "L-003", source: "VE-01", target: "CS-01" },
    { id: "L-004", source: "CS-01", target: "ME-01" },
    { id: "L-005", source: "ME-01", target: "FN-01" },
    { id: "L-006", source: "FN-01", target: "ST-01" },
    { id: "L-007", source: "CS-01", target: "TK-01", type: "process", label: "슬러리" },
    { id: "L-008", source: "TK-01", target: "PU-01", type: "utility" },
    { id: "L-009", source: "PU-01", target: "VE-01", type: "utility", label: "흡수액" },
  ],
};

export const PID_PRESETS: Record<string, SystemPreset> = {
  preset_1: preset1,
  preset_2: preset2,
  preset_3: preset3,
  preset_4: preset4,
  preset_5: preset5,
};

/**
 * 위저드 출력에서 프리셋 선정
 */
export function selectPreset(treatment: string, primary: string): string {
  if (treatment.startsWith("semi-dry")) return "preset_4";
  if (treatment === "wet" || treatment.startsWith("wet+")) return "preset_5";
  if (primary === "ep") return "preset_3";
  if (primary === "cyclone") return "preset_2";
  return "preset_1";
}
