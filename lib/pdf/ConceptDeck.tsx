// Concept 비교 슬라이드 데크 (가로 PDF) — 임원·구매·발주자용
// 기존 NanumGothic 폰트 인프라 재사용

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ConceptSet } from "@/lib/concept/types";
import { ensureFonts } from "./fonts";

ensureFonts();

const C = { brand: "#0e7c8c", brandDark: "#08505d", amber: "#f59e0b", gray: "#6b7280", light: "#f0f9fa", green: "#16a34a", red: "#dc2626" };

const s = StyleSheet.create({
  page: { fontFamily: "NanumGothic", padding: 40, fontSize: 11, color: "#1f2937", backgroundColor: "#ffffff" },
  slideTag: { position: "absolute", top: 20, right: 30, fontSize: 9, color: C.gray },
  h1: { fontSize: 26, fontWeight: 700, color: C.brandDark },
  h2: { fontSize: 18, fontWeight: 700, color: C.brandDark, marginBottom: 12, borderBottom: `2pt solid ${C.brand}`, paddingBottom: 5 },
  bigNum: { fontSize: 32, fontWeight: 700, color: C.brand },
  kpiBox: { flex: 1, padding: 12, backgroundColor: C.light, borderRadius: 6, marginRight: 8 },
  kpiLabel: { fontSize: 9, color: C.gray },
  kpiValue: { fontSize: 20, fontWeight: 700, color: C.brandDark, marginTop: 4 },
  th: { flexDirection: "row", backgroundColor: C.brand, paddingVertical: 6, paddingHorizontal: 4 },
  thText: { color: "#fff", fontWeight: 700, fontSize: 10 },
  tr: { flexDirection: "row", borderBottom: "1pt solid #e5e7eb", paddingVertical: 5, paddingHorizontal: 4 },
  td: { fontSize: 10, paddingHorizontal: 2 },
});

const fmtEok = (won: number) => (won / 1e8).toFixed(1);

function SlideTag({ n, total }: { n: number; total: number }) {
  return <Text style={s.slideTag}>{n} / {total}</Text>;
}

export function ConceptDeck({ conceptSet, company = "주식회사 ___", project = "집진설비 설계" }: {
  conceptSet: ConceptSet; company?: string; project?: string;
}) {
  const { brief, concepts } = conceptSet;
  const rec = concepts.find((c) => c.id === conceptSet.recommended_id) ?? concepts[0];
  const total = 6;
  const date = new Date().toLocaleDateString("ko-KR");

  return (
    <Document>
      {/* 1. 표지 */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={{ marginTop: 120, alignItems: "center" }}>
          <Text style={s.h1}>집진설비 설계안 비교 검토</Text>
          <Text style={{ fontSize: 14, color: C.brand, marginTop: 10 }}>{project}</Text>
          <View style={{ marginTop: 50, flexDirection: "row" }}>
            <Text style={{ fontSize: 11, color: C.gray }}>{company}</Text>
            <Text style={{ fontSize: 11, color: C.gray }}>·</Text>
            <Text style={{ fontSize: 11, color: C.gray }}>{date}</Text>
          </View>
        </View>
        <SlideTag n={1} total={total} />
      </Page>

      {/* 2. Executive Summary */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.h2}>Executive Summary</Text>
        <View style={{ padding: 16, backgroundColor: C.light, borderRadius: 8 }}>
          <Text style={{ fontSize: 13, lineHeight: 1.6 }}>
            처리 풍량 {brief.flowrate_Nm3h.toLocaleString()} Nm³/h, 입구 {brief.T_in_C}°C 조건에서 {rec.label} 안을 추천합니다.
          </Text>
        </View>
        <View style={{ flexDirection: "row", marginTop: 20 }}>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>PM 효율</Text><Text style={s.kpiValue}>{(rec.performance.efficiency_PM * 100).toFixed(1)}%</Text></View>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>초기 CAPEX</Text><Text style={s.kpiValue}>{fmtEok(rec.cost.capex_won)}억</Text></View>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>연 OPEX</Text><Text style={s.kpiValue}>{fmtEok(rec.cost.opex_won_yr)}억</Text></View>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>5년 TCO</Text><Text style={s.kpiValue}>{fmtEok(rec.cost.tco_5yr_won)}억</Text></View>
        </View>
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 700, marginBottom: 6 }}>추천 근거</Text>
          <Text style={{ fontSize: 11, lineHeight: 1.5, color: "#374151" }}>{conceptSet.recommendation_rationale}</Text>
        </View>
        <SlideTag n={2} total={total} />
      </Page>

      {/* 3. 조건 요약 */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.h2}>설계 조건 (Brief)</Text>
        {[
          ["산업/공정", brief.industry],
          ["처리 풍량", `${brief.flowrate_Nm3h.toLocaleString()} Nm³/h`],
          ["가스 온도", `${brief.T_in_C} °C`],
          ["분진 농도", `${brief.inlet_conc_g_Nm3 ?? "산업평균"} g/Nm³`],
          ["목표 배출", `${brief.target_emission_mg_Sm3 ?? "법규"} mg/Sm³`],
          ["운전 시간", `${brief.op_hours_yr.toLocaleString()} h/yr`],
          ["소재지", brief.region],
          ["폐수", brief.constraints.no_wastewater ? "불가" : "가능"],
        ].map(([l, v], i) => (
          <View key={i} style={{ flexDirection: "row", paddingVertical: 5, borderBottom: "1pt solid #e5e7eb" }}>
            <Text style={{ width: "30%", fontSize: 11, color: C.gray }}>{l}</Text>
            <Text style={{ width: "70%", fontSize: 12, fontWeight: 700 }}>{v}</Text>
          </View>
        ))}
        <SlideTag n={3} total={total} />
      </Page>

      {/* 4. 3안 비교표 */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.h2}>설계안 비교</Text>
        <View style={s.th}>
          <Text style={[s.thText, { width: "22%" }]}>항목</Text>
          {concepts.map((c) => (
            <Text key={c.id} style={[s.thText, { width: `${78 / concepts.length}%` }]}>
              안{c.rank}{c.id === rec.id ? " (추천)" : ""}
            </Text>
          ))}
        </View>
        {[
          ["처리방식", concepts.map((c) => c.label)],
          ["PM 효율", concepts.map((c) => `${(c.performance.efficiency_PM * 100).toFixed(1)}%`)],
          ["HCl 제거", concepts.map((c) => `${((c.performance.removal_HCl ?? 0) * 100).toFixed(0)}%`)],
          ["다이옥신", concepts.map((c) => `${((c.performance.removal_dioxin ?? 0) * 100).toFixed(0)}%`)],
          ["CAPEX", concepts.map((c) => `${fmtEok(c.cost.capex_won)}억`)],
          ["5년 TCO", concepts.map((c) => `${fmtEok(c.cost.tco_5yr_won)}억`)],
          ["가능 여부", concepts.map((c) => (c.feasible ? "적합" : "제외"))],
        ].map(([label, vals], ri) => (
          <View key={ri} style={s.tr}>
            <Text style={[s.td, { width: "22%", fontWeight: 700, color: C.gray }]}>{label as string}</Text>
            {(vals as string[]).map((v, ci) => (
              <Text key={ci} style={[s.td, { width: `${78 / concepts.length}%`, fontWeight: concepts[ci].id === rec.id ? 700 : 400, color: concepts[ci].id === rec.id ? C.brandDark : "#374151" }]}>
                {v}
              </Text>
            ))}
          </View>
        ))}
        <SlideTag n={4} total={total} />
      </Page>

      {/* 5. 1순위 추천 상세 */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.h2}>[1순위 추천] {rec.label}</Text>
        <View style={{ flexDirection: "row" }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ fontWeight: 700, color: C.green, marginBottom: 5 }}>[장점]</Text>
            {rec.tradeoff.pros.map((p, i) => <Text key={i} style={{ fontSize: 10, marginBottom: 3 }}>- {p}</Text>)}
            <Text style={{ fontWeight: 700, color: C.amber, marginTop: 10, marginBottom: 5 }}>[검토할 점]</Text>
            {rec.tradeoff.cons.map((p, i) => <Text key={i} style={{ fontSize: 10, marginBottom: 3 }}>- {p}</Text>)}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: 700, color: C.brand, marginBottom: 5 }}>[법규]</Text>
            {rec.tradeoff.regulatory.map((p, i) => <Text key={i} style={{ fontSize: 10, marginBottom: 3 }}>- {p}</Text>)}
            <Text style={{ fontWeight: 700, marginTop: 10, marginBottom: 5 }}>구성</Text>
            <View style={{ padding: 8, backgroundColor: "#f9fafb", borderRadius: 4 }}>
              <Text style={{ fontSize: 9 }}>
                {[rec.stages.pretreatment, rec.stages.primary, rec.stages.secondary, rec.stages.condenser, rec.stages.fan_arrangement].filter(Boolean).join(" → ")}
              </Text>
              {rec.stages.reagent && <Text style={{ fontSize: 9, color: C.gray, marginTop: 3 }}>약품: {rec.stages.reagent}</Text>}
            </View>
          </View>
        </View>
        <SlideTag n={5} total={total} />
      </Page>

      {/* 6. 다음 단계 + 면책 */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.h2}>다음 단계 (Action Plan)</Text>
        {[
          "1. 본 추천안으로 정밀 FEED 설계 진행 (8단 사이징 → P&ID·BOM)",
          "2. 현장 실측 (분진 성상·비저항·입도분포) 확정",
          "3. 제조사 견적 요청 (RFQ) — 본 사양 기준",
          "4. 인허가 사전협의 (관할 환경부서·안전보건공단)",
          "5. 시운전·TAB·안전검사 일정 수립",
        ].map((t, i) => <Text key={i} style={{ fontSize: 12, marginBottom: 8 }}>{t}</Text>)}
        <View style={{ marginTop: 30, padding: 10, backgroundColor: "#fef3c7", borderRadius: 6 }}>
          <Text style={{ fontSize: 9, color: "#78350f", lineHeight: 1.4 }}>
            ※ 본 비교 검토는 입력값 기반 자동 추정이며 법적 효력·인증을 대체하지 않습니다. CAPEX/OPEX는 시장가 ±30% 변동 가능. 실제 설계·인허가·인증은 전문가·관할기관을 통해 진행하십시오.
          </Text>
        </View>
        <SlideTag n={6} total={total} />
      </Page>
    </Document>
  );
}
