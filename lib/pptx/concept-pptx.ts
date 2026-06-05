// ConceptSet → 편집 가능한 PowerPoint (.pptx)
// pptxgenjs — 브라우저에서 생성·다운로드

import PptxGenJS from "pptxgenjs";
import type { ConceptSet } from "@/lib/concept/types";

const C = {
  brand: "0E7C8C", brandDark: "08505D", amber: "F59E0B",
  gray: "6B7280", light: "F0F9FA", green: "16A34A", dark: "1F2937", white: "FFFFFF",
};

const fmtEok = (won: number) => (won / 1e8).toFixed(1);

export async function buildConceptPptx(cs: ConceptSet, opts: { company?: string; project?: string } = {}): Promise<Blob> {
  const { brief, concepts } = cs;
  const rec = concepts.find((c) => c.id === cs.recommended_id) ?? concepts[0];
  const company = opts.company ?? "주식회사 ___";
  const project = opts.project ?? "집진설비 설계";
  const date = new Date().toLocaleDateString("ko-KR");

  const p = new PptxGenJS();
  p.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });
  p.layout = "WIDE";
  p.theme = { headFontFace: "맑은 고딕", bodyFontFace: "맑은 고딕" };

  // ── 1. 표지 ──
  const s1 = p.addSlide();
  s1.background = { color: C.light };
  s1.addText("집진설비 설계안 비교 검토", { x: 0.8, y: 2.6, w: 11.7, h: 1, fontSize: 36, bold: true, color: C.brandDark });
  s1.addText(project, { x: 0.8, y: 3.7, w: 11.7, h: 0.6, fontSize: 20, color: C.brand });
  s1.addText(`${company}   ·   ${date}`, { x: 0.8, y: 5.0, w: 11.7, h: 0.5, fontSize: 14, color: C.gray });

  // ── 2. Executive Summary ──
  const s2 = p.addSlide();
  addTitle(s2, "Executive Summary");
  s2.addText(`처리 풍량 ${brief.flowrate_Nm3h.toLocaleString()} Nm³/h, 입구 ${brief.T_in_C}°C 조건에서 ${rec.label} 안을 추천합니다.`,
    { x: 0.8, y: 1.5, w: 11.7, h: 0.9, fontSize: 16, color: C.dark, fill: { color: C.light }, valign: "middle", margin: 10 });
  const kpis = [
    ["PM 효율", `${(rec.performance.efficiency_PM * 100).toFixed(1)}%`],
    ["초기 CAPEX", `${fmtEok(rec.cost.capex_won)}억`],
    ["연 OPEX", `${fmtEok(rec.cost.opex_won_yr)}억`],
    ["5년 TCO", `${fmtEok(rec.cost.tco_5yr_won)}억`],
  ];
  kpis.forEach(([l, v], i) => {
    const x = 0.8 + i * 3.0;
    s2.addText([
      { text: l + "\n", options: { fontSize: 11, color: C.gray } },
      { text: v, options: { fontSize: 24, bold: true, color: C.brandDark } },
    ], { x, y: 2.7, w: 2.8, h: 1.2, fill: { color: C.light }, valign: "middle", align: "center" });
  });
  s2.addText("추천 근거", { x: 0.8, y: 4.3, w: 11.7, h: 0.4, fontSize: 14, bold: true, color: C.brandDark });
  s2.addText(cs.recommendation_rationale, { x: 0.8, y: 4.8, w: 11.7, h: 1.5, fontSize: 12, color: C.dark });

  // ── 3. 조건 요약 ──
  const s3 = p.addSlide();
  addTitle(s3, "설계 조건 (Brief)");
  const condRows = [
    ["산업/공정", brief.industry],
    ["처리 풍량", `${brief.flowrate_Nm3h.toLocaleString()} Nm³/h`],
    ["가스 온도", `${brief.T_in_C} °C`],
    ["분진 농도", `${brief.inlet_conc_g_Nm3 ?? "산업평균"} g/Nm³`],
    ["목표 배출", `${brief.target_emission_mg_Sm3 ?? "법규"} mg/Sm³`],
    ["운전 시간", `${brief.op_hours_yr.toLocaleString()} h/yr`],
    ["소재지", brief.region],
    ["폐수 처리", brief.constraints.no_wastewater ? "불가" : "가능"],
  ];
  s3.addTable(
    condRows.map(([l, v]) => [
      { text: l, options: { bold: true, color: C.gray, fontSize: 13, fill: { color: "F9FAFB" } } },
      { text: String(v), options: { color: C.dark, fontSize: 13 } },
    ]),
    { x: 0.8, y: 1.5, w: 8, colW: [2.5, 5.5], rowH: 0.5, border: { type: "solid", color: "E5E7EB", pt: 1 } }
  );

  // ── 4. 3안 비교표 ──
  const s4 = p.addSlide();
  addTitle(s4, "설계안 비교");
  const headerRow = [
    { text: "항목", options: { bold: true, color: C.white, fill: { color: C.brand }, fontSize: 12 } },
    ...concepts.map((c) => ({ text: `안${c.rank}${c.id === rec.id ? " (추천)" : ""}`, options: { bold: true, color: C.white, fill: { color: C.brand }, fontSize: 12 } })),
  ];
  const metricRows: [string, (c: typeof concepts[0]) => string][] = [
    ["처리방식", (c) => c.label],
    ["PM 효율", (c) => `${(c.performance.efficiency_PM * 100).toFixed(1)}%`],
    ["HCl 제거", (c) => `${((c.performance.removal_HCl ?? 0) * 100).toFixed(0)}%`],
    ["다이옥신", (c) => `${((c.performance.removal_dioxin ?? 0) * 100).toFixed(0)}%`],
    ["CAPEX", (c) => `${fmtEok(c.cost.capex_won)}억`],
    ["5년 TCO", (c) => `${fmtEok(c.cost.tco_5yr_won)}억`],
    ["가능 여부", (c) => (c.feasible ? "적합" : "제외")],
  ];
  const bodyRows = metricRows.map(([label, fn]) => [
    { text: label, options: { bold: true, color: C.gray, fontSize: 11, fill: { color: "F9FAFB" } } },
    ...concepts.map((c) => ({ text: fn(c), options: { fontSize: 11, color: c.id === rec.id ? C.brandDark : C.dark, bold: c.id === rec.id } })),
  ]);
  s4.addTable([headerRow, ...bodyRows], {
    x: 0.8, y: 1.5, w: 11.7, rowH: 0.55,
    colW: [2.5, ...concepts.map(() => 9.2 / concepts.length)],
    border: { type: "solid", color: "E5E7EB", pt: 1 },
  });

  // ── 5. 1순위 추천 상세 ──
  const s5 = p.addSlide();
  addTitle(s5, `[1순위 추천] ${rec.label}`);
  s5.addText("장점", { x: 0.8, y: 1.5, w: 5.8, h: 0.4, fontSize: 14, bold: true, color: C.green });
  s5.addText(rec.tradeoff.pros.map((t) => ({ text: t, options: { bullet: true, fontSize: 11 } })),
    { x: 0.8, y: 2.0, w: 5.8, h: 1.8, color: C.dark });
  s5.addText("검토할 점", { x: 0.8, y: 3.9, w: 5.8, h: 0.4, fontSize: 14, bold: true, color: C.amber });
  s5.addText(rec.tradeoff.cons.map((t) => ({ text: t, options: { bullet: true, fontSize: 11 } })),
    { x: 0.8, y: 4.4, w: 5.8, h: 1.8, color: C.dark });
  s5.addText("법규", { x: 6.9, y: 1.5, w: 5.6, h: 0.4, fontSize: 14, bold: true, color: C.brand });
  s5.addText(rec.tradeoff.regulatory.map((t) => ({ text: t, options: { bullet: true, fontSize: 11 } })),
    { x: 6.9, y: 2.0, w: 5.6, h: 2.5, color: C.dark });
  const cfg = [rec.stages.pretreatment, rec.stages.primary, rec.stages.secondary, rec.stages.condenser, rec.stages.fan_arrangement].filter(Boolean).join(" → ");
  s5.addText("구성: " + cfg, { x: 6.9, y: 4.7, w: 5.6, h: 0.8, fontSize: 11, color: C.gray, fill: { color: "F9FAFB" }, valign: "middle", margin: 6 });

  // ── 6. 다음 단계 ──
  const s6 = p.addSlide();
  addTitle(s6, "다음 단계 (Action Plan)");
  const steps = [
    "1. 추천안으로 정밀 FEED 설계 진행 (8단 사이징 → P&ID·BOM)",
    "2. 현장 실측 (분진 성상·비저항·입도분포) 확정",
    "3. 제조사 견적 요청 (RFQ) — 본 사양 기준",
    "4. 인허가 사전협의 (관할 환경부서·안전보건공단)",
    "5. 시운전·TAB·안전검사 일정 수립",
  ];
  s6.addText(steps.map((t) => ({ text: t, options: { fontSize: 14, paraSpaceAfter: 12 } })),
    { x: 0.8, y: 1.5, w: 11.7, h: 3.5, color: C.dark });
  s6.addText("※ 본 비교 검토는 입력값 기반 자동 추정이며 법적 효력·인증을 대체하지 않습니다. CAPEX/OPEX는 시장가 ±30% 변동 가능. 실제 설계·인허가·인증은 전문가·관할기관을 통해 진행하십시오.",
    { x: 0.8, y: 5.5, w: 11.7, h: 1, fontSize: 10, color: "78350F", fill: { color: "FEF3C7" }, valign: "middle", margin: 8 });

  const out = await p.write({ outputType: "blob" });
  return out as Blob;
}

function addTitle(slide: PptxGenJS.Slide, title: string) {
  slide.addText(title, { x: 0.8, y: 0.5, w: 11.7, h: 0.7, fontSize: 24, bold: true, color: "08505D" });
  slide.addShape("line" as any, { x: 0.8, y: 1.25, w: 11.7, h: 0, line: { color: "0E7C8C", width: 2 } });
}
