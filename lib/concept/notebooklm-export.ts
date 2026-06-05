// NotebookLM 업로드용 Markdown export
// 사용자가 다운받아 NotebookLM에 올리면 Audio Overview·요약·FAQ 자동 생성 가능

import type { ConceptSet } from "./types";

const fmtEok = (won: number) => (won / 1e8).toFixed(1);

export function conceptSetToMarkdown(cs: ConceptSet, project = "집진설비 설계"): string {
  const { brief, concepts } = cs;
  const rec = concepts.find((c) => c.id === cs.recommended_id) ?? concepts[0];
  const L: string[] = [];

  L.push(`# ${project} — 집진설비 설계안 비교 검토`);
  L.push(``);
  L.push(`작성일: ${new Date().toLocaleDateString("ko-KR")}`);
  L.push(``);
  L.push(`## 1. 설계 조건 (Brief)`);
  L.push(``);
  L.push(`| 항목 | 값 |`);
  L.push(`|---|---|`);
  L.push(`| 산업/공정 | ${brief.industry} |`);
  L.push(`| 처리 풍량 | ${brief.flowrate_Nm3h.toLocaleString()} Nm³/h |`);
  L.push(`| 가스 입구 온도 | ${brief.T_in_C} °C |`);
  L.push(`| 분진 농도 | ${brief.inlet_conc_g_Nm3 ?? "산업 평균"} g/Nm³ |`);
  L.push(`| 목표 배출농도 | ${brief.target_emission_mg_Sm3 ?? "법규 기준"} mg/Sm³ |`);
  L.push(`| 운전 시간 | ${brief.op_hours_yr.toLocaleString()} h/yr |`);
  L.push(`| 소재지 | ${brief.region} |`);
  L.push(`| 폐수 처리 | ${brief.constraints.no_wastewater ? "불가" : "가능"} |`);
  L.push(`| ATEX 인증 | ${brief.constraints.atex_required ? "필요" : "—"} |`);
  L.push(``);

  L.push(`## 2. 설계안 비교 (${concepts.length}안)`);
  L.push(``);
  L.push(`| 항목 | ${concepts.map((c) => `안${c.rank}${c.id === rec.id ? " ★추천" : ""}`).join(" | ")} |`);
  L.push(`|---|${concepts.map(() => "---").join("|")}|`);
  L.push(`| 처리방식 | ${concepts.map((c) => c.label).join(" | ")} |`);
  L.push(`| PM 효율 | ${concepts.map((c) => `${(c.performance.efficiency_PM * 100).toFixed(1)}%`).join(" | ")} |`);
  L.push(`| HCl 제거 | ${concepts.map((c) => `${((c.performance.removal_HCl ?? 0) * 100).toFixed(0)}%`).join(" | ")} |`);
  L.push(`| 다이옥신 | ${concepts.map((c) => `${((c.performance.removal_dioxin ?? 0) * 100).toFixed(0)}%`).join(" | ")} |`);
  L.push(`| CAPEX | ${concepts.map((c) => `${fmtEok(c.cost.capex_won)}억`).join(" | ")} |`);
  L.push(`| 5년 TCO | ${concepts.map((c) => `${fmtEok(c.cost.tco_5yr_won)}억`).join(" | ")} |`);
  L.push(`| 가능 여부 | ${concepts.map((c) => (c.feasible ? "적합" : "제외")).join(" | ")} |`);
  L.push(``);

  L.push(`## 3. 안별 상세`);
  L.push(``);
  for (const c of concepts) {
    L.push(`### 안 ${c.rank}: ${c.label} ${c.id === rec.id ? "(★ 1순위 추천)" : ""}`);
    L.push(``);
    L.push(`- **구성**: ${[c.stages.pretreatment, c.stages.primary, c.stages.secondary, c.stages.condenser, c.stages.fan_arrangement].filter(Boolean).join(" → ")}`);
    if (c.stages.reagent) L.push(`- **약품**: ${c.stages.reagent}`);
    if (c.stages.collector_media) L.push(`- **여재**: ${c.stages.collector_media}`);
    L.push(`- **CAPEX**: ${fmtEok(c.cost.capex_won)}억 / **연 OPEX**: ${fmtEok(c.cost.opex_won_yr)}억 / **5년 TCO**: ${fmtEok(c.cost.tco_5yr_won)}억`);
    L.push(``);
    L.push(`**장점**`);
    c.tradeoff.pros.forEach((p) => L.push(`- ${p}`));
    L.push(``);
    L.push(`**검토할 점**`);
    c.tradeoff.cons.forEach((p) => L.push(`- ${p}`));
    if (c.tradeoff.fatal && c.tradeoff.fatal.length) {
      L.push(``);
      L.push(`**제외 사유 (치명적)**`);
      c.tradeoff.fatal.forEach((p) => L.push(`- ${p}`));
    }
    L.push(``);
    L.push(`**법규**`);
    c.tradeoff.regulatory.forEach((p) => L.push(`- ${p}`));
    L.push(``);
  }

  L.push(`## 4. 1순위 추천 근거`);
  L.push(``);
  L.push(cs.recommendation_rationale);
  L.push(``);

  L.push(`## 5. 다음 단계`);
  L.push(``);
  L.push(`1. 추천안으로 정밀 FEED 설계 (8단 사이징 → P&ID·BOM)`);
  L.push(`2. 현장 실측 (분진 성상·비저항·입도분포)`);
  L.push(`3. 제조사 견적 요청 (RFQ)`);
  L.push(`4. 인허가 사전협의 (환경부서·안전보건공단)`);
  L.push(`5. 시운전·TAB·안전검사 일정`);
  L.push(``);

  L.push(`---`);
  L.push(`> 본 문서는 입력값 기반 자동 생성이며 법적 효력·인증을 대체하지 않습니다. CAPEX/OPEX는 시장가 ±30% 변동 가능.`);

  return L.join("\n");
}
