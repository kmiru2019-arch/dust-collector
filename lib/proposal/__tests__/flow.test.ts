// Data Sheet → 제시안 → 질의 → 수렴 → 8단 매핑 전체 흐름 테스트

import { describe, it, expect } from "vitest";
import { resolveSpec } from "@/lib/datasheet/autofill";
import { generateProposals } from "@/lib/proposal/generator";
import { answerQuestion, suggestedQuestions } from "@/lib/converge/qa-engine";
import { systemFollowups, pickFinal } from "@/lib/converge/followups";
import { mapToStageInputs } from "@/lib/converge/to-stage-inputs";
import { buildClarifications } from "@/lib/converge/clarify";
import { deriveDesignStages } from "@/lib/converge/design-stages";

// 소각로 (산성가스 + 다이옥신 + Hg) 시나리오
const incinInput = {
  project_name: "테스트 소각",
  process_source: "MSW 소각로",
  region: "gyeonggi",
  install_date: "2025-01-01",
  flow_Nm3h: 50000,
  T_in_C: 850,
  T_out_C: 160,
  dust_type: "비산재",
  inlet_conc_g: 5,
  target_emission: 10,
  flammable: "no",
  op_hours_yr: 8000,
  wastewater: "ok",
  hcl_ppm: 800,
  so2_ppm: 200,
  hg_ug: 50,
  dioxin: 1.5,
};

describe("제시안 생성기", () => {
  it("소각 조건 → 2~3안, SDA+AC 추천", () => {
    const spec = resolveSpec(incinInput).values;
    const ps = generateProposals(spec);
    expect(ps.proposals.length).toBeGreaterThanOrEqual(2);
    expect(ps.proposals.length).toBeLessThanOrEqual(3);
    const rec = ps.proposals.find((p) => p.id === ps.recommendedId)!;
    expect(rec).toBeTruthy();
    expect(rec.feasible).toBe(true);
    // 다이옥신 1.5 → AC 포함안이 최상위 추천이어야
    expect(rec.treatment).toContain("AC");
  });

  it("각 제시안은 후드→…→스택 구조도를 가진다", () => {
    const spec = resolveSpec(incinInput).values;
    const ps = generateProposals(spec);
    for (const p of ps.proposals) {
      expect(p.train[0].id).toBe("HOOD");
      expect(p.train[p.train.length - 1].id).toBe("STACK");
      expect(p.train.some((n) => n.id === "FAN")).toBe(true);
      expect(p.capex_won).toBeGreaterThan(0);
      expect(p.tco5_won).toBeGreaterThan(p.capex_won);
    }
  });

  it("폐수 불가 + 습식 → 제외(feasible=false)", () => {
    const spec = resolveSpec({ ...incinInput, wastewater: "no" }).values;
    const ps = generateProposals(spec);
    const wet = ps.proposals.find((p) => p.treatment.includes("wet"));
    if (wet) expect(wet.feasible).toBe(false);
    // 추천안은 습식이 아니어야
    const rec = ps.proposals.find((p) => p.id === ps.recommendedId)!;
    expect(rec.treatment.includes("wet")).toBe(false);
  });
});

describe("질의 응답 엔진 (Claude API 미사용)", () => {
  const spec = resolveSpec(incinInput).values;
  const ps = generateProposals(spec);
  const p = ps.proposals.find((x) => x.id === ps.recommendedId)!;

  it("여과면적 질문 → 정량 답변", () => {
    const r = answerQuestion("백필터 여과면적과 본수는?", spec, p);
    expect(r.matched).toContain("여과면적");
    expect(r.answer).toMatch(/m²/);
    expect(r.detail && r.detail.length).toBeGreaterThan(0);
  });

  it("송풍기 동력 질문 → kW 답변", () => {
    const r = answerQuestion("송풍기 동력은 몇 kW?", spec, p);
    expect(r.answer).toMatch(/kW/);
  });

  it("배출농도 질문 → 목표 달성 여부 판정", () => {
    const r = answerQuestion("목표 배출농도를 달성하나요?", spec, p);
    expect(r.answer).toMatch(/mg\/Nm³/);
  });

  it("매칭 실패 시 안내 폴백", () => {
    const r = answerQuestion("점심 뭐 먹지", spec, p);
    expect(r.matched).toBe("일반 안내");
  });

  it("추천 질문 칩 생성", () => {
    const chips = suggestedQuestions(p);
    expect(chips.length).toBeGreaterThan(3);
  });
});

describe("시스템 추가질문 → 최종 수렴", () => {
  const spec = resolveSpec(incinInput).values;
  const ps = generateProposals(spec);

  it("후속 질문은 항상 우선순위 포함", () => {
    const fs = systemFollowups(ps);
    expect(fs.some((f) => f.id === "priority")).toBe(true);
  });

  it("비용 우선 → TCO 낮은 안으로 수렴 경향", () => {
    const res = pickFinal(ps, { priority: "cost", space: "ok" });
    expect(res.finalId).toBeTruthy();
    expect(res.ranked[0].adjScore).toBeGreaterThanOrEqual(res.ranked[1]?.adjScore ?? -1);
  });

  it("성능 우선 → 최종안 도출", () => {
    const res = pickFinal(ps, { priority: "performance", emission: "strict", space: "ok" });
    const final = ps.proposals.find((p) => p.id === res.finalId)!;
    expect(final.feasible).toBe(true);
  });
});

describe("제안 전 시스템 확인질의", () => {
  it("직접 입력 안 한 결정값만 확인 대상으로 노출", () => {
    // hcl_ppm, dioxin 등은 입력했고 d50_um/stickiness/corrosive는 비움
    const partial = { ...incinInput };
    delete (partial as any).hcl_ppm; // 산성가스를 비워보면 확인 대상에 떠야
    const { clarifications } = buildClarifications(partial);
    const keys = clarifications.map((c) => c.key);
    expect(keys).toContain("hcl_ppm");
    // 직접 입력한 dioxin은 확인 대상이 아님
    expect(keys).not.toContain("dioxin");
  });

  it("모든 결정값을 직접 입력하면 확인 항목이 적거나 없다", () => {
    const full = {
      ...incinInput, stickiness: "low", d50_um: 20, corrosive: "severe",
    };
    const { clarifications } = buildClarifications(full);
    // 자동채움 대상이 거의 없어야
    expect(clarifications.length).toBeLessThanOrEqual(2);
  });
});

describe("설비 구성별 동적 상세설계 단계", () => {
  const spec = resolveSpec(incinInput).values;
  const ps = generateProposals(spec);

  it("SDA+AC 안(백필터)은 항상단계+집진단계 포함, 3단 이상", () => {
    const sdaAc = ps.proposals.find((p) => p.treatment.includes("AC"))!;
    const stages = deriveDesignStages(sdaAc);
    expect(stages.length).toBeGreaterThanOrEqual(3);
    expect(stages[0].title).toContain("성상");
    expect(stages[stages.length - 1].title).toContain("법규");
    expect(stages.some((s) => s.title.includes("백필터"))).toBe(true);
  });

  it("간단한 건식 백필터 안은 SDA+AC 안보다 단계가 적다", () => {
    const dry = ps.proposals.find((p) => p.treatment === "dry");
    const sdaAc = ps.proposals.find((p) => p.treatment.includes("AC"))!;
    if (dry) {
      expect(deriveDesignStages(dry).length).toBeLessThanOrEqual(deriveDesignStages(sdaAc).length);
    }
  });

  it("단계 번호는 1..N 연속", () => {
    const stages = deriveDesignStages(ps.proposals[0]);
    stages.forEach((s, i) => expect(s.no).toBe(i + 1));
  });
});

describe("최종안 → 8단 입력 매핑", () => {
  const spec = resolveSpec(incinInput).values;
  const ps = generateProposals(spec);
  const final = ps.proposals.find((p) => p.id === ps.recommendedId)!;
  const inputs = mapToStageInputs(final, spec);

  it("핵심 사양이 정확히 전달된다", () => {
    expect(inputs.stage1.gas.T_in_C).toBe(850);
    expect(inputs.stage3.branches[0].Q_m3min).toBeCloseTo(50000 / 60, 1);
    expect(inputs.stage4.target_emission_mg_Sm3).toBe(10);
    expect(inputs.stage8.region).toBe("gyeonggi");
  });

  it("처리방식에 맞는 1차 집진방식 선택", () => {
    expect(["bag_filter", "scrubber", "ep"]).toContain(inputs.stage5!.primary);
    // SDA+AC → 백필터
    expect(inputs.stage5!.primary).toBe("bag_filter");
    expect(inputs.stage5!.bag).toBeTruthy();
  });

  it("산성가스 화학조성이 가스 입력으로 전달", () => {
    expect(inputs.stage1.gas.HCl_ppm).toBe(800);
    expect(inputs.stage1.gas.PCDD_ng_TEQ_Nm3).toBe(1.5);
  });
});
