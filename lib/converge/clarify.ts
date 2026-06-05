// 제안 전 시스템 확인질의.
// Data Sheet 작성 후, 제안 선정에 영향을 주는 핵심값 중
// (1) 사용자가 직접 입력하지 않아 자동으로 채워진 값, (2) 여전히 비어 있는 값을
// 사용자에게 확인받아 "확정 사양"을 굳힌 뒤 제안을 생성한다.

import { allFields, type DataSheetField } from "@/lib/datasheet/schema";
import { resolveSpec } from "@/lib/datasheet/autofill";

// 제안(candidates/feasibility)에 직접 영향을 주는 결정값
const DECISION_KEYS = [
  "flammable",   // 방폭안 분기
  "wastewater",  // 습식안 가능 여부
  "hcl_ppm",     // 산성가스 → SDA/습식
  "so2_ppm",
  "hg_ug",       // 중금속 → 활성탄
  "dioxin",      // 다이옥신 → 활성탄
  "stickiness",  // 점착 → 습식
  "d50_um",      // 입경 → 사이클론/EP
  "corrosive",   // 재질
];

export interface Clarification {
  key: string;
  label: string;
  unit?: string;
  question: string;
  effectiveValue: string;     // 현재 적용될 값(자동/기본 포함)
  source: "auto" | "missing"; // 자동채움 / 미입력
  reason?: string;            // 자동채움 근거
  field: DataSheetField;      // 입력 위젯 렌더용
  impact: string;             // 이 값이 무엇을 좌우하는지
}

const IMPACT: Record<string, string> = {
  flammable: "방폭(사이클론 격리+벤트) 채택 여부",
  wastewater: "습식안 채택 가능 여부",
  hcl_ppm: "산성가스 처리(SDA/습식) 필요 여부",
  so2_ppm: "산성가스 처리 규모",
  hg_ug: "활성탄 주입(수은 제거) 필요 여부",
  dioxin: "활성탄 주입(다이옥신 제거) 필요 여부",
  stickiness: "습식 전환 여부 (점착성)",
  d50_um: "전단 사이클론·EP 적합성",
  corrosive: "본체·덕트 재질 등급",
};

export function buildClarifications(values: Record<string, any>): {
  clarifications: Clarification[];
  resolvedValues: Record<string, any>;
} {
  const resolved = resolveSpec(values);
  const autoMap = new Map(resolved.autoFilled.map((a) => [a.key, a]));
  const fields = new Map(allFields().map((f) => [f.key, f]));

  const clarifications: Clarification[] = [];

  for (const key of DECISION_KEYS) {
    const field = fields.get(key);
    if (!field) continue;

    const userEntered = values[key] !== undefined && values[key] !== null && values[key] !== "";
    if (userEntered) continue; // 직접 입력 → 확인 불필요

    const eff = resolved.values[key];
    const auto = autoMap.get(key);

    // 자동으로 채워졌거나(=auto), 결국 비어있는(=missing) 경우만 확인 대상
    const hasEffective = eff !== undefined && eff !== null && eff !== "";
    const source: "auto" | "missing" = auto ? "auto" : hasEffective ? "auto" : "missing";

    clarifications.push({
      key,
      label: field.label,
      unit: field.unit,
      question: source === "auto"
        ? `${field.label} 값을 자동으로 적용했습니다. 맞습니까?`
        : `${field.label} 값이 비어 있습니다. 확인해 주세요.`,
      effectiveValue: hasEffective ? String(eff) : "(없음)",
      source,
      reason: auto?.reason,
      field,
      impact: IMPACT[key] ?? "",
    });
  }

  return { clarifications, resolvedValues: resolved.values };
}
