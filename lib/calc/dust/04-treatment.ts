// Stage 4 — 처리방식 결정 (건식/습식/반건식)

import type { Stage4Input, Stage4Output, Stage1Output } from "./types";
import { rankTreatments } from "./01-properties";

export function runStage4(input: Stage4Input, s1: Stage1Output): Stage4Output {
  const ctx = {
    water_available: input.water_available ?? true,
    has_waste_heat_use: input.has_waste_heat_use ?? false,
  };

  // Stage 1에서 이미 후보를 도출했으나, Stage 4에서 사용자 컨텍스트를 반영해 재산정
  const candidates = rankTreatments(s1.dust, s1.gas, ctx);

  // 사용자 입력 보정
  if (input.budget_class === "low") {
    // 저예산 → 단순 건식 우선
    const dry = candidates.find((c) => c.type === "dry" || c.type === "dry+explosion_protection");
    if (dry) dry.score += 0.05;
  } else if (input.budget_class === "high") {
    // 고예산 → 고급 (WESP, EP+Bag 하이브리드)
    candidates.forEach((c) => {
      if (c.type.startsWith("semi-dry") || c.type === "wet+FGD") c.score += 0.05;
    });
  }

  // 재정렬
  const ranked = [...candidates].sort((a, b) => b.score - a.score);

  return {
    treatment_ranked: ranked,
    primary_choice: ranked[0],
    rationale: ranked[0].reason,
  };
}
