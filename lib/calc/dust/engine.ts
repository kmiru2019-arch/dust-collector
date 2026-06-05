// 8단 통합 엔진

import type { AllStageInputs, AllStageOutputs } from "./types";
import { runStage1 } from "./01-properties";
import { runStage2 } from "./02-hood";
import { runStage3 } from "./03-duct";
import { runStage4 } from "./04-treatment";
import { runStage5 } from "./05-collector";
import { runStage6 } from "./06-condenser";
import { runStage7 } from "./07-fan";
import { runStage8 } from "./08-compliance";

export function runFromStage(
  fromStage: number,
  inputs: AllStageInputs,
  prev: Partial<AllStageOutputs> = {}
): AllStageOutputs {
  const outputs: AllStageOutputs = { ...prev };

  if (fromStage <= 1) {
    outputs.stage1 = runStage1(inputs.stage1, {
      water_available: inputs.stage4?.water_available,
      has_waste_heat_use: inputs.stage4?.has_waste_heat_use,
    });
  }
  if (fromStage <= 2 && outputs.stage1) {
    outputs.stage2 = runStage2(inputs.stage2, outputs.stage1);
  }
  if (fromStage <= 3 && outputs.stage1 && outputs.stage2) {
    // Stage 2 후드 풍량 → Stage 3 덕트 첫 가지 Q 자동 연결
    // 사용자가 stage3.branches[0].Q_m3min을 명시적으로 다르게 입력하지 않은 한
    // (디폴트 100 m³/min) 후드 풍량을 우선 사용
    const linkedInputs = { ...inputs.stage3 };
    if (linkedInputs.branches.length > 0) {
      const firstBranch = linkedInputs.branches[0];
      const isDefaultQ = Math.abs(firstBranch.Q_m3min - 100) < 0.1;
      const hoodQ = outputs.stage2.Q_hood_m3min;
      if (isDefaultQ && hoodQ > 0 && Math.abs(hoodQ - 100) > 0.5) {
        linkedInputs.branches = [
          { ...firstBranch, Q_m3min: hoodQ },
          ...linkedInputs.branches.slice(1),
        ];
      }
    }
    outputs.stage3 = runStage3(linkedInputs, outputs.stage1, outputs.stage2);
  }
  if (fromStage <= 4 && outputs.stage1) {
    outputs.stage4 = runStage4(inputs.stage4, outputs.stage1);
  }
  if (fromStage <= 5 && outputs.stage1 && outputs.stage3 && outputs.stage4 && inputs.stage5) {
    outputs.stage5 = runStage5(inputs.stage5, outputs.stage1, outputs.stage3, outputs.stage4);
  }
  if (fromStage <= 6 && outputs.stage1 && outputs.stage3 && inputs.stage6) {
    outputs.stage6 = runStage6(inputs.stage6, outputs.stage1, outputs.stage3, outputs.stage5);
  }
  if (fromStage <= 7 && outputs.stage1 && outputs.stage2 && outputs.stage3 && outputs.stage4 && outputs.stage5 && outputs.stage6 && inputs.stage7) {
    outputs.stage7 = runStage7(
      inputs.stage7, outputs.stage1, outputs.stage2, outputs.stage3,
      outputs.stage5, outputs.stage6,
      outputs.stage4.primary_choice.type
    );
  }
  if (fromStage <= 8 && outputs.stage1 && outputs.stage2 && inputs.stage8) {
    outputs.stage8 = runStage8(inputs.stage8, outputs.stage1, outputs.stage2, outputs.stage5, outputs.stage7);
  }

  return outputs;
}

export function runAll(inputs: AllStageInputs): AllStageOutputs {
  return runFromStage(1, inputs);
}
