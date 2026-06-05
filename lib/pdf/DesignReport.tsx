// 설계 보고서 PDF — @react-pdf/renderer
// 13 page 구성 + KS A 0904 표제란 + P&ID 블록 + 3D 등각투상

import React from "react";
import { Document, Page, Text, View, StyleSheet, Svg, Rect, Polygon, Line, Path } from "@react-pdf/renderer";
import type { AllStageOutputs } from "@/lib/calc/dust/types";
import { generateBOM } from "@/lib/bom";
import { selectPreset, PID_PRESETS } from "@/lib/drawing/dust/presets";
import { ensureFonts } from "./fonts";

ensureFonts();

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 80, paddingHorizontal: 36, fontFamily: "NanumGothic", fontSize: 9.5, color: "#1f2937" },
  hdrBox: { textAlign: "center", marginBottom: 12, borderBottom: "2pt solid #0e7c8c", paddingBottom: 6 },
  hdrTitle: { fontSize: 16, fontWeight: 700, color: "#08505d" },
  hdrSub: { fontSize: 10, color: "#0a6373", marginTop: 3 },
  section: { marginBottom: 10 },
  h2: { fontSize: 11.5, fontWeight: 700, color: "#08505d", marginBottom: 5, paddingBottom: 2, borderBottom: "1pt solid #d9eff2" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.5 },
  label: { color: "#6b7280" },
  value: { fontWeight: 700 },
  table: { width: "100%", borderTop: "1pt solid #d1d5db", marginTop: 4 },
  trHead: { flexDirection: "row", backgroundColor: "#f3f4f6", paddingVertical: 4, paddingHorizontal: 4, fontWeight: 700, fontSize: 9 },
  tr: { flexDirection: "row", borderBottom: "1pt solid #e5e7eb", paddingVertical: 2.5, paddingHorizontal: 4, fontSize: 9 },
  td: { paddingHorizontal: 2 },
  warn: { backgroundColor: "#fef3c7", padding: 6, borderRadius: 4, marginVertical: 4, fontSize: 9, color: "#78350f" },
  disclaimer: { fontSize: 8, color: "#9ca3af", marginTop: 8, paddingTop: 6, borderTop: "1pt solid #e5e7eb", lineHeight: 1.4 },
  // 표제란 (우측 하단 고정 — KS A 0904)
  titleBlock: { position: "absolute", bottom: 24, left: 36, right: 36, height: 48, border: "1pt solid #1f2937" },
  titleBlockGrid: { flexDirection: "row", height: "100%" },
  tbCell: { borderRight: "1pt solid #1f2937", padding: 3, justifyContent: "center" },
  tbCellLast: { padding: 3, justifyContent: "center" },
  tbLabel: { fontSize: 6.5, color: "#6b7280" },
  tbValue: { fontSize: 8.5, fontWeight: 700 },
  pageNumRight: { position: "absolute", top: 18, right: 36, fontSize: 8, color: "#9ca3af" },
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value ?? "—"}</Text>
    </View>
  );
}

function Hdr({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={s.hdrBox}>
      <Text style={s.hdrTitle}>{title}</Text>
      {sub && <Text style={s.hdrSub}>{sub}</Text>}
    </View>
  );
}

// KS A 0904 표제란 — 모든 페이지 하단 고정
function TitleBlock({ meta, drawingTitle, page, total, scale }: {
  meta: ReportMeta;
  drawingTitle: string;
  page: number;
  total: number;
  scale?: string;
}) {
  return (
    <View style={s.titleBlock}>
      <View style={s.titleBlockGrid}>
        <View style={[s.tbCell, { width: "22%" }]}>
          <Text style={s.tbLabel}>회사</Text>
          <Text style={s.tbValue}>{meta.company ?? "—"}</Text>
        </View>
        <View style={[s.tbCell, { width: "30%" }]}>
          <Text style={s.tbLabel}>도면명</Text>
          <Text style={s.tbValue}>{drawingTitle}</Text>
          <Text style={[s.tbLabel, { marginTop: 2 }]}>{meta.project}</Text>
        </View>
        <View style={[s.tbCell, { width: "18%" }]}>
          <Text style={s.tbLabel}>도면번호</Text>
          <Text style={s.tbValue}>{meta.drawingNo ?? "—"}</Text>
          <Text style={[s.tbLabel, { marginTop: 2 }]}>Rev. {meta.revision ?? "A"} · {scale ?? "NTS"}</Text>
        </View>
        <View style={[s.tbCell, { width: "10%" }]}>
          <Text style={s.tbLabel}>설계</Text>
          <Text style={s.tbValue}>{meta.designer || "—"}</Text>
        </View>
        <View style={[s.tbCell, { width: "10%" }]}>
          <Text style={s.tbLabel}>검토</Text>
          <Text style={s.tbValue}>{meta.reviewer || "—"}</Text>
        </View>
        <View style={[s.tbCellLast, { width: "10%" }]}>
          <Text style={s.tbLabel}>승인</Text>
          <Text style={s.tbValue}>{meta.approver || "—"}</Text>
        </View>
      </View>
      <Text style={{ position: "absolute", top: -10, right: 4, fontSize: 7, color: "#6b7280" }}>
        Page {page} / {total}   {meta.date}
      </Text>
    </View>
  );
}

interface ReportMeta {
  project: string;
  company?: string;
  drawingNo?: string;
  revision?: string;
  designer?: string;
  reviewer?: string;
  approver?: string;
  date: string;
}

// ───────────────────── P&ID 블록 다이어그램 (SVG + 외부 라벨) ─────────────────────
// @react-pdf SVG 내부에 Text 사용 시 textkit unitsPerEm 에러 발생.
// SVG에는 도형만, 라벨은 SVG 옆 표 형식으로 분리.
function PIDBlockDiagram({ outputs }: { outputs: AllStageOutputs }) {
  const presetId = selectPreset(
    outputs.stage4?.primary_choice.type ?? "dry",
    outputs.stage5?.primary ?? "bag_filter"
  );
  const preset = PID_PRESETS[presetId];

  const FILL: Record<string, string> = {
    hood: "#fef3c7", baghouse: "#bfdbfe", cyclone: "#ddd6fe", ep: "#bbf7d0",
    sda: "#fed7aa", ac_injection: "#fecaca", venturi: "#cffafe", fan: "#fee2e2",
    stack: "#e5e7eb", quencher: "#bae6fd", boiler: "#fef3c7",
    condenser_shell: "#ddd6fe", rotary_valve: "#e2e8f0", isolation_valve: "#fecaca",
    cyclonic_separator: "#cffafe", mist_eliminator: "#a5f3fc",
    blast_gate: "#e2e8f0", tank: "#cbd5e1", pump: "#a78bfa",
  };

  const cols = 4;
  const colW = 130;
  const rowH = 80;
  const boxW = 100;
  const boxH = 50;
  const vbW = cols * colW + 40;
  const vbH = Math.ceil(preset.nodes.length / cols) * rowH + 60;

  return (
    <View>
      <Svg viewBox={`0 0 ${vbW} ${vbH}`} style={{ width: "100%", height: 260 }}>
        {preset.nodes.map((n, i) => {
          const cx = (i % cols) * colW + 20;
          const cy = Math.floor(i / cols) * rowH + 20;
          const fill = FILL[n.type] ?? "#e5e7eb";
          return (
            <Rect key={n.id} x={cx} y={cy} width={boxW} height={boxH} fill={fill} stroke="#1f2937" strokeWidth={1} />
          );
        })}
        {preset.edges.map((e) => {
          const sIdx = preset.nodes.findIndex((n) => n.id === e.source);
          const tIdx = preset.nodes.findIndex((n) => n.id === e.target);
          if (sIdx < 0 || tIdx < 0) return null;
          const sx = (sIdx % cols) * colW + 20 + boxW;
          const sy = Math.floor(sIdx / cols) * rowH + 20 + boxH / 2;
          const tx = (tIdx % cols) * colW + 20;
          const ty = Math.floor(tIdx / cols) * rowH + 20 + boxH / 2;
          return (
            <Line key={e.id} x1={sx} y1={sy} x2={tx} y2={ty} stroke="#374151" strokeWidth={1.2} />
          );
        })}
      </Svg>
      {/* 라벨 — SVG 외부 표 */}
      <View style={{ marginTop: 6 }}>
        <View style={s.trHead}>
          <Text style={[s.td, { width: "12%" }]}>Tag</Text>
          <Text style={[s.td, { width: "48%" }]}>설명</Text>
          <Text style={[s.td, { width: "40%" }]}>형식</Text>
        </View>
        {preset.nodes.map((n) => (
          <View key={n.id} style={s.tr}>
            <Text style={[s.td, { width: "12%" }]}>{n.tag}</Text>
            <Text style={[s.td, { width: "48%" }]}>{n.label}</Text>
            <Text style={[s.td, { width: "40%" }]}>{n.type}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ───────────────────── 3D 등각투상 (SVG, 60° iso) ─────────────────────
function IsoView({ outputs }: { outputs: AllStageOutputs }) {
  const presetId = selectPreset(
    outputs.stage4?.primary_choice.type ?? "dry",
    outputs.stage5?.primary ?? "bag_filter"
  );
  const preset = PID_PRESETS[presetId];

  const FILL: Record<string, string> = {
    hood: "#fef3c7", baghouse: "#bfdbfe", cyclone: "#ddd6fe", ep: "#bbf7d0",
    sda: "#fed7aa", ac_injection: "#fecaca", venturi: "#cffafe", fan: "#fee2e2",
    stack: "#e5e7eb", quencher: "#bae6fd", boiler: "#fef3c7",
    condenser_shell: "#ddd6fe", rotary_valve: "#e2e8f0", isolation_valve: "#fecaca",
    cyclonic_separator: "#cffafe", mist_eliminator: "#a5f3fc",
    blast_gate: "#e2e8f0", tank: "#cbd5e1", pump: "#a78bfa",
  };

  // iso 변환
  const iso = (x: number, y: number, z: number) => ({
    x: (x - z) * Math.cos(Math.PI / 6),
    y: y - (x + z) * Math.sin(Math.PI / 6),
  });

  const cols = 4;
  const w = 90, h = 60, d = 40;

  // 모든 좌표 계산
  const items = preset.nodes.map((n, i) => {
    const x = (i % cols) * 180 + 40;
    const z = Math.floor(i / cols) * 90;
    const y = 0;
    return { n, x, y, z };
  });

  // 등각투상 후 bounding box
  const allPts = items.flatMap(({ x, y, z }) => [
    iso(x, y, z), iso(x + w, y, z), iso(x + w, y, z + d), iso(x, y, z + d),
    iso(x, y - h, z), iso(x + w, y - h, z), iso(x + w, y - h, z + d), iso(x, y - h, z + d),
  ]);
  const minX = Math.min(...allPts.map((p) => p.x)) - 30;
  const maxX = Math.max(...allPts.map((p) => p.x)) + 30;
  const minY = Math.min(...allPts.map((p) => p.y)) - 30;
  const maxY = Math.max(...allPts.map((p) => p.y)) + 30;
  const vbW = maxX - minX;
  const vbH = maxY - minY;

  return (
    <View>
      <Svg viewBox={`${minX} ${minY} ${vbW} ${vbH}`} style={{ width: "100%", height: 320 }}>
        {/* 바닥 격자 */}
        <Polygon
          points={`${minX + 10},${maxY - 10} ${maxX - 10},${maxY - 10} ${maxX - 80},${maxY - 60} ${minX + 80},${maxY - 60}`}
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth={0.5}
        />
        {items.map(({ n, x, y, z }) => {
        const fill = FILL[n.type] ?? "#e5e7eb";
        const p1 = iso(x, y, z);
        const p2 = iso(x + w, y, z);
        const p3 = iso(x + w, y, z + d);
        const p5 = iso(x, y - h, z);
        const p6 = iso(x + w, y - h, z);
        const p7 = iso(x + w, y - h, z + d);
        const p8 = iso(x, y - h, z + d);

        return (
          <React.Fragment key={n.id}>
            <Polygon
              points={`${p5.x},${p5.y} ${p6.x},${p6.y} ${p7.x},${p7.y} ${p8.x},${p8.y}`}
              fill={fill} stroke="#1f2937" strokeWidth={0.7}
            />
            <Polygon
              points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p6.x},${p6.y} ${p5.x},${p5.y}`}
              fill={fill} stroke="#1f2937" strokeWidth={0.7} fillOpacity={0.85}
            />
            <Polygon
              points={`${p2.x},${p2.y} ${p3.x},${p3.y} ${p7.x},${p7.y} ${p6.x},${p6.y}`}
              fill={fill} stroke="#1f2937" strokeWidth={0.7} fillOpacity={0.7}
            />
          </React.Fragment>
        );
      })}
      </Svg>
      {/* 라벨 — SVG 외부 표 */}
      <View style={{ marginTop: 6 }}>
        <View style={s.trHead}>
          <Text style={[s.td, { width: "12%" }]}>Tag</Text>
          <Text style={[s.td, { width: "48%" }]}>장비명</Text>
          <Text style={[s.td, { width: "40%" }]}>형식</Text>
        </View>
        {preset.nodes.map((n) => (
          <View key={n.id} style={s.tr}>
            <Text style={[s.td, { width: "12%" }]}>{n.tag}</Text>
            <Text style={[s.td, { width: "48%" }]}>{n.label}</Text>
            <Text style={[s.td, { width: "40%" }]}>{n.type}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ───────────────────── 메인 보고서 ─────────────────────

interface Props {
  outputs: AllStageOutputs;
  project?: string;
  meta?: {
    company?: string;
    drawingNo?: string;
    revision?: string;
    designer?: string;
    reviewer?: string;
    approver?: string;
  };
}

export function DesignReport({ outputs, project = "집진설비 설계", meta: metaIn = {} }: Props) {
  const o = outputs;
  const today = new Date().toLocaleDateString("ko-KR");
  const bom = generateBOM(o);
  const total = 13;

  const meta: ReportMeta = {
    project,
    company: metaIn.company ?? "주식회사 ___",
    drawingNo: metaIn.drawingNo ?? `DC-${new Date().getFullYear()}-001`,
    revision: metaIn.revision ?? "A",
    designer: metaIn.designer,
    reviewer: metaIn.reviewer,
    approver: metaIn.approver,
    date: today,
  };

  return (
    <Document>
      {/* ─── p1 표지 ─── */}
      <Page size="A4" style={s.page}>
        <Text style={s.pageNumRight}>표지 — Cover</Text>
        <View style={{ marginTop: 90, alignItems: "center" }}>
          <Text style={{ fontSize: 26, fontWeight: 700, color: "#08505d" }}>집진설비 설계 보고서</Text>
          <Text style={{ fontSize: 13, marginTop: 8, color: "#0e7c8c" }}>Dust Collector System Design Report</Text>
          <View style={{ marginTop: 60, padding: 16, border: "1pt solid #d1d5db", width: "75%" }}>
            <Row label="프로젝트" value={meta.project} />
            <Row label="회사" value={meta.company} />
            <Row label="도면번호" value={`${meta.drawingNo}  Rev. ${meta.revision}`} />
            <Row label="작성일" value={meta.date} />
            <View style={[s.row, { marginTop: 6 }]}>
              <Text style={s.label}>설계 · 검토 · 승인</Text>
              <Text style={s.value}>
                {meta.designer || "—"} / {meta.reviewer || "—"} / {meta.approver || "—"}
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 40, padding: 12, backgroundColor: "#f3f4f6", width: "75%" }}>
            <Row label="처리방식" value={o.stage4?.primary_choice.type} />
            <Row label="집진방식" value={o.stage5?.primary} />
            <Row label="총 효율" value={o.stage5 ? `${(o.stage5.efficiency_overall * 100).toFixed(2)}%` : "—"} />
            <Row label="총 동력" value={o.stage7 ? `${o.stage7.total_kW} kW` : "—"} />
            <Row label="사업장 종별" value={o.stage8?.classification} />
          </View>
        </View>
        <TitleBlock meta={meta} drawingTitle="표지" page={1} total={total} />
      </Page>

      {/* ─── p2 목차 ─── */}
      <Page size="A4" style={s.page}>
        <Hdr title="목차" sub="Table of Contents" />
        {[
          "1. 표지", "2. 목차", "3. 분진/가스 성상", "4. 후드 설계", "5. 덕트 사이징",
          "6. 처리방식·집진방식 결정", "7. 집진기 사양", "8. 응축기/HX", "9. 송풍기 사양",
          "10. P&ID 블록 다이어그램", "11. 3D 등각투상", "12. 안전·법규 컴플라이언스", "13. BOM·면책",
        ].map((t, i) => (
          <View key={i} style={[s.row, { paddingVertical: 3, borderBottom: "0.5pt solid #f3f4f6" }]}>
            <Text>{t}</Text>
            <Text style={s.label}>p. {i + 1}</Text>
          </View>
        ))}
        <TitleBlock meta={meta} drawingTitle="목차" page={2} total={total} />
      </Page>

      {/* ─── p3 분진/가스 성상 ─── */}
      <Page size="A4" style={s.page}>
        <Hdr title="3. 분진/가스 성상" sub="Stage 1 — Dust & Gas Properties" />
        <View style={s.section}>
          <Text style={s.h2}>분진</Text>
          <Row label="산업" value={o.stage1?.dust.industry} />
          <Row label="분진명" value={o.stage1?.dust.dust_name} />
          <Row label="d50 (μm)" value={o.stage1?.dust.d50_um} />
          <Row label="입자밀도 (kg/m³)" value={o.stage1?.dust.particle_density_kg_m3} />
          <Row label="점착성" value={o.stage1?.dust.stickiness} />
          <Row label="부식성" value={o.stage1?.dust.corrosive} />
          <Row label="가연성" value={o.stage1?.dust.flammable ? "예" : "아니오"} />
          {o.stage1?.dust.flammable && (
            <>
              <Row label="Kst (bar·m/s)" value={o.stage1.dust.Kst_bar_m_s} />
              <Row label="MIE (mJ)" value={o.stage1.dust.MIE_mJ} />
              <Row label="MIT (°C)" value={o.stage1.dust.MIT_C} />
              <Row label="ST 등급 (KOSHA D-13)" value={o.stage1.derived.ST_class} />
            </>
          )}
        </View>
        <View style={s.section}>
          <Text style={s.h2}>가스</Text>
          <Row label="입구 온도 (°C)" value={o.stage1?.gas.T_in_C} />
          <Row label="압력 (kPa)" value={o.stage1?.gas.P_in_kPa} />
          <Row label="RH (%)" value={o.stage1?.gas.RH_in_pct} />
          <Row label="O₂ (%v)" value={o.stage1?.gas.O2_pct} />
          <Row label="HCl (ppm)" value={o.stage1?.gas.HCl_ppm ?? 0} />
          <Row label="SO₂ (ppm)" value={o.stage1?.gas.SO2_ppm ?? 0} />
          <Row label="SO₃ (ppm)" value={o.stage1?.gas.SO3_ppm ?? 0} />
          <Row label="H₂O (vol %)" value={o.stage1?.gas.H2O_vol_pct ?? 8} />
        </View>
        <View style={s.section}>
          <Text style={s.h2}>자동 도출</Text>
          <Row label="황산 노점 (Verhoff-Banchero)"
            value={o.stage1 && o.stage1.derived.dewpoint_acid_C > 0
              ? `${o.stage1.derived.dewpoint_acid_C.toFixed(0)} °C` : "—"} />
          <Row label="수증기 노점 (Magnus)" value={`${o.stage1?.derived.dewpoint_water_C.toFixed(0)} °C`} />
          <Row label="비저항 (Ω·cm)" value={o.stage1
            ? `${o.stage1.derived.resistivity_estimate.low_Ohm_cm.toExponential(0)} ~ ${o.stage1.derived.resistivity_estimate.high_Ohm_cm.toExponential(0)}`
            : "—"} />
        </View>
        <TitleBlock meta={meta} drawingTitle="분진/가스 성상" page={3} total={total} />
      </Page>

      {/* ─── p4 후드 ─── */}
      <Page size="A4" style={s.page}>
        <Hdr title="4. 후드 설계" sub="Stage 2 — KOSHA W-1 + 별표13" />
        <View style={s.section}>
          <Row label="후드 형식" value={o.stage2?.hood_type} />
          <Row label="제어풍속 V_c" value={o.stage2 ? `${o.stage2.V_c_applied_m_s.toFixed(2)} m/s` : "—"} />
          <Row label="후드 풍량 Q_h" value={o.stage2 ? `${o.stage2.Q_hood_m3min.toFixed(0)} m³/min` : "—"} />
          <Row label="후드 정압손실" value={o.stage2 ? `${(o.stage2.dP_hood_Pa / 9.81).toFixed(0)} mmAq` : "—"} />
        </View>
        <View style={s.warn}>
          <Text>식: Q = 60 × A × V_c × SF (포위형) / 60 × V_c × (10X² + A) × SF (외부식) / 1.4 × P × V_c × H × 60 (캐노피)</Text>
        </View>
        <TitleBlock meta={meta} drawingTitle="후드 설계" page={4} total={total} />
      </Page>

      {/* ─── p5 덕트 ─── */}
      <Page size="A4" style={s.page}>
        <Hdr title="5. 덕트 사이징" sub="Stage 3 — Swamee-Jain + 손실계수" />
        {o.stage3?.branches.map((b, i) => (
          <View key={i} style={s.section}>
            <Text style={s.h2}>가지 {b.id}</Text>
            <Row label="직경 D" value={`${(b.D_m * 1000).toFixed(0)} mm`} />
            <Row label="실제 속도 V" value={`${b.V_actual_m_s.toFixed(1)} m/s`} />
            <Row label="Reynolds" value={b.Re.toExponential(2)} />
            <Row label="마찰계수 f" value={b.f.toFixed(4)} />
            <Row label="직선 손실" value={`${(b.dP_straight_Pa / 9.81).toFixed(0)} mmAq`} />
            <Row label="국부 손실" value={`${(b.dP_local_Pa / 9.81).toFixed(0)} mmAq`} />
            <Row label="총 정압" value={`${(b.dP_total_Pa / 9.81).toFixed(0)} mmAq`} />
          </View>
        ))}
        {o.stage3?.warnings && o.stage3.warnings.length > 0 && (
          <View style={s.warn}>
            {o.stage3.warnings.map((w, i) => <Text key={i}>[주의] {w}</Text>)}
          </View>
        )}
        <TitleBlock meta={meta} drawingTitle="덕트 사이징" page={5} total={total} />
      </Page>

      {/* ─── p6 처리·집진 결정 ─── */}
      <Page size="A4" style={s.page}>
        <Hdr title="6. 처리방식 · 집진방식 결정" sub="Stage 4·5 — 결정트리 근거" />
        <View style={s.section}>
          <Text style={s.h2}>처리방식 후보 (스코어 순)</Text>
          {o.stage4?.treatment_ranked.slice(0, 5).map((c, i) => (
            <View key={i} style={[s.row, { paddingVertical: 3 }]}>
              <Text style={i === 0 ? s.value : s.label}>{i + 1}. {c.type}</Text>
              <Text style={i === 0 ? s.value : s.label}>{(c.score * 100).toFixed(0)}점</Text>
            </View>
          ))}
        </View>
        <View style={s.section}>
          <Text style={s.h2}>선정 근거</Text>
          <Text>{o.stage4?.rationale}</Text>
        </View>
        <TitleBlock meta={meta} drawingTitle="처리·집진방식 결정" page={6} total={total} />
      </Page>

      {/* ─── p7 집진기 사양 ─── */}
      <Page size="A4" style={s.page}>
        <Hdr title="7. 집진기 사양" sub={`Stage 5 — ${o.stage5?.primary ?? ""}`} />
        <View style={s.section}>
          <Row label="총 효율" value={o.stage5 ? `${(o.stage5.efficiency_overall * 100).toFixed(2)}%` : "—"} />
          <Row label="ΔP_collector" value={o.stage5 ? `${(o.stage5.dP_collector_Pa / 9.81).toFixed(0)} mmAq` : "—"} />
        </View>
        {o.stage5?.bag && (
          <View style={s.section}>
            <Text style={s.h2}>백필터</Text>
            <Row label="여재" value={`${o.stage5.bag.media.code} ${o.stage5.bag.media.full_name ? `(${o.stage5.bag.media.full_name})` : ""}`} />
            <Row label="여재 한계온도" value={`${o.stage5.bag.media.T_max_C} °C`} />
            <Row label="A/C ratio" value={`${o.stage5.bag.AC_ratio_m_min.toFixed(2)} m/min`} />
            <Row label="총 면적" value={`${o.stage5.bag.A_total_m2.toFixed(0)} m²`} />
            <Row label="백 사이즈" value={`Ø${o.stage5.bag.bag_dim.D_mm} × L=${o.stage5.bag.bag_dim.L_m}m`} />
            <Row label="백 수" value={`${o.stage5.bag.bag_count}개`} />
            <Row label="청소 인터벌" value={`${o.stage5.bag.cleaning_interval_min.toFixed(0)} 분`} />
            <Row label="ΔP_clean" value={`${(o.stage5.bag.dP_clean_Pa / 9.81).toFixed(0)} mmAq`} />
            <Row label="ΔP_design" value={`${(o.stage5.bag.dP_design_Pa / 9.81).toFixed(0)} mmAq`} />
          </View>
        )}
        {o.stage5?.cyclone && (
          <View style={s.section}>
            <Text style={s.h2}>사이클론</Text>
            <Row label="본체 직경 D" value={`${(o.stage5.cyclone.D_m * 1000).toFixed(0)} mm`} />
            <Row label="입구속도 V_i" value={`${o.stage5.cyclone.V_i_m_s.toFixed(1)} m/s`} />
            <Row label="컷오프 d50" value={`${o.stage5.cyclone.d50_um.toFixed(1)} μm`} />
            <Row label="ΔP" value={`${(o.stage5.cyclone.dP_Pa / 9.81).toFixed(0)} mmAq`} />
            <Row label="대수" value={`${o.stage5.cyclone.count} 대`} />
          </View>
        )}
        {o.stage5?.ep && (
          <View style={s.section}>
            <Text style={s.h2}>전기집진기 (EP)</Text>
            <Row label="SCA" value={o.stage5.ep.SCA_s_per_m.toFixed(1)} />
            <Row label="총 면적" value={`${o.stage5.ep.A_total_m2.toFixed(0)} m²`} />
            <Row label="필드 수" value={o.stage5.ep.field_count} />
            <Row label="드리프트 속도 w" value={`${o.stage5.ep.drift_velocity_m_s.toFixed(3)} m/s`} />
            <Row label="인가전압" value={`${o.stage5.ep.voltage_kV} kV`} />
            <Row label="Modified Deutsch-Matts 효율" value={`${(o.stage5.ep.efficiency_modified * 100).toFixed(2)} %`} />
          </View>
        )}
        {o.stage5?.scrubber && (
          <View style={s.section}>
            <Text style={s.h2}>스크러버 ({o.stage5.scrubber.type})</Text>
            {o.stage5.scrubber.V_throat_m_s != null && <Row label="Throat 속도" value={`${o.stage5.scrubber.V_throat_m_s} m/s`} />}
            <Row label="L/G ratio" value={`${o.stage5.scrubber.L_G_L_per_m3.toFixed(2)} L/m³`} />
            <Row label="물 소비" value={`${o.stage5.scrubber.water_consumption_m3h.toFixed(1)} m³/h`} />
            <Row label="폐수" value={`${o.stage5.scrubber.wastewater_m3h.toFixed(1)} m³/h`} />
            {o.stage5.scrubber.reagent_consumption_kg_h != null && (
              <Row label="반응물 (Ca(OH)₂)" value={`${o.stage5.scrubber.reagent_consumption_kg_h.toFixed(1)} kg/h`} />
            )}
            <Row label="재질" value={o.stage5.scrubber.material_recommendation} />
          </View>
        )}
        <TitleBlock meta={meta} drawingTitle="집진기 사양" page={7} total={total} />
      </Page>

      {/* ─── p8 응축기 ─── */}
      <Page size="A4" style={s.page}>
        <Hdr title="8. 응축기 / 열교환기" sub="Stage 6" />
        <View style={s.section}>
          <Row label="형식" value={o.stage6?.type ?? "불필요"} />
          <Row label="목표 출구온도" value={o.stage6 ? `${o.stage6.T_target_C.toFixed(0)} °C` : "—"} />
          <Row label="황산 노점" value={o.stage6 && o.stage6.T_dewpoint_acid_C > 0 ? `${o.stage6.T_dewpoint_acid_C.toFixed(0)} °C` : "—"} />
          <Row label="수증기 노점" value={o.stage6 ? `${o.stage6.T_dewpoint_water_C.toFixed(0)} °C` : "—"} />
          <Row label="노점 마진" value={o.stage6 ? `${o.stage6.margin_K.toFixed(0)} K` : "—"} />
          <Row label="응축수량" value={o.stage6 ? `${o.stage6.m_condensate_kg_h.toFixed(0)} kg/h` : "—"} />
          <Row label="폐열 회수" value={o.stage6 ? `${o.stage6.waste_heat_kW.toFixed(0)} kW` : "—"} />
          <Row label="ROI" value={o.stage6?.ROI_yr ? `${o.stage6.ROI_yr.toFixed(1)} 년` : "—"} />
          <Row label="재질 권장" value={o.stage6?.material_recommendation} />
          <Row label="보온 두께" value={o.stage6 ? `${o.stage6.insulation_thickness_mm} mm` : "—"} />
          <Row label="시동 가열" value={o.stage6?.startup_heating_required ? "필요" : "불필요"} />
        </View>
        <TitleBlock meta={meta} drawingTitle="응축기/HX" page={8} total={total} />
      </Page>

      {/* ─── p9 송풍기 ─── */}
      <Page size="A4" style={s.page}>
        <Hdr title="9. 송풍기 사양" sub="Stage 7" />
        <View style={s.section}>
          <Row label="배치 (Arrangement)" value={o.stage7?.arrangement} />
          <Row label="총 동력" value={o.stage7 ? `${o.stage7.total_kW} kW` : "—"} />
          <Row label="연간 전력량" value={o.stage7 ? `${(o.stage7.annual_kWh / 1000).toFixed(0)} MWh/yr` : "—"} />
          <Row label="연간 운전비" value={o.stage7 ? `${(o.stage7.annual_cost_won / 1e6).toFixed(0)} 백만원` : "—"} />
          <Row label="재질" value={o.stage7?.fan_material} />
        </View>
        <View style={[s.table, { marginTop: 6 }]}>
          <View style={s.trHead}>
            <Text style={[s.td, { width: "18%" }]}>Tag</Text>
            <Text style={[s.td, { width: "10%" }]}>역할</Text>
            <Text style={[s.td, { width: "18%" }]}>형식</Text>
            <Text style={[s.td, { width: "16%" }]}>Q (m³/min)</Text>
            <Text style={[s.td, { width: "16%" }]}>ΔP (mmAq)</Text>
            <Text style={[s.td, { width: "12%" }]}>Motor (kW)</Text>
            <Text style={[s.td, { width: "10%" }]}>VFD</Text>
          </View>
          {o.stage7?.fans.map((f) => (
            <View key={f.id} style={s.tr}>
              <Text style={[s.td, { width: "18%" }]}>{f.id}</Text>
              <Text style={[s.td, { width: "10%" }]}>{f.role}</Text>
              <Text style={[s.td, { width: "18%" }]}>{f.type}</Text>
              <Text style={[s.td, { width: "16%" }]}>{f.Q_m3min.toFixed(0)}</Text>
              <Text style={[s.td, { width: "16%" }]}>{(f.dP_Pa / 9.81).toFixed(0)}</Text>
              <Text style={[s.td, { width: "12%" }]}>{f.motor_kW}</Text>
              <Text style={[s.td, { width: "10%" }]}>{f.VFD ? "예" : "X"}</Text>
            </View>
          ))}
        </View>
        <TitleBlock meta={meta} drawingTitle="송풍기 사양" page={9} total={total} />
      </Page>

      {/* ─── p10 P&ID 블록 다이어그램 ─── */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <Hdr title="10. P&ID 블록 다이어그램" sub="Process Flow — Auto-generated from System JSON" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8, border: "1pt solid #d1d5db" }}>
          <PIDBlockDiagram outputs={o} />
        </View>
        <View style={[s.warn, { marginTop: 6 }]}>
          <Text>※ 본 블록도는 자동 생성된 개념 P&amp;ID이며, 실제 시공 도면은 별도 상세 작성 필요. ISO 14617 + ISA-5.1 기호 일부 적용.</Text>
        </View>
        <TitleBlock meta={meta} drawingTitle="P&ID 블록 다이어그램" page={10} total={total} scale="NTS" />
      </Page>

      {/* ─── p11 3D 등각투상 ─── */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <Hdr title="11. 3D 등각투상 (Isometric View)" sub="60° Isometric Projection — 장비 배치 검토용" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8, border: "1pt solid #d1d5db" }}>
          <IsoView outputs={o} />
        </View>
        <View style={s.warn}>
          <Text>※ 배치 검토용 등각투상. 실시공 시 점검 통로 ≥800mm, 정비 공간 ≥1500mm, 방폭구역 Zone 20 외측 ≥1m 이격 확보 필요.</Text>
        </View>
        <TitleBlock meta={meta} drawingTitle="3D 등각투상" page={11} total={total} scale="NTS" />
      </Page>

      {/* ─── p12 안전·법규 ─── */}
      <Page size="A4" style={s.page}>
        <Hdr title="12. 안전 · 법규 컴플라이언스" sub="Stage 8 — 12항목 자동판정" />
        <View style={s.section}>
          <Row label="사업장 종별 (시행령 별표1의3)" value={o.stage8?.classification} />
          <Row label="TMS 의무" value={o.stage8?.TMS_required ? "의무" : "면제"} />
          <Row label="비산먼지 신고 (별표14)" value={o.stage8?.fugitive_dust_obligation ? "의무" : "면제"} />
          <Row label="VOC 시설 (별표16)" value={o.stage8?.VOC_obligation ? "의무" : "면제"} />
          <Row label="유해위험방지계획서 (산안법 §48)" value={o.stage8?.prevention_plan.required ? "필요" : "면제"} />
          <Row label="환경영향평가" value={o.stage8?.eia_required ? "필요" : "면제"} />
          <Row label="작업환경측정 주기" value={o.stage8?.measurement.freq === "quarterly" ? "분기 1회" : "반기 1회"} />
          <Row label="측정결과 보존" value={`${o.stage8?.measurement.retention_yr}년`} />
          <Row label="제어풍속 (별표13)" value={`${o.stage8?.control_velocity_m_s.toFixed(2)} m/s`} />
        </View>
        <View style={s.section}>
          <Text style={s.h2}>안전검사 도래일 (산안법 §93)</Text>
          {o.stage8?.inspection_schedule.slice(0, 5).map((d, i) => (
            <Row key={d} label={i === 0 ? "최초" : `정기 ${i}`} value={d} />
          ))}
        </View>
        {o.stage8?.explosion && (
          <View style={s.section}>
            <Text style={s.h2}>분진폭발 평가 (KOSHA D-43 + NFPA 68)</Text>
            <Row label="ST 등급" value={o.stage8.explosion.ST_class} />
            <Row label="폭발벤트 면적" value={`${o.stage8.explosion.vent_area_m2.toFixed(2)} m²`} />
            <Row label="격리밸브 (NFPA 69)" value={o.stage8.explosion.isolation_required ? "필수" : "—"} />
            <Row label="ATEX/IECEx 인증" value={o.stage8.explosion.ATEX_recommended ? "권장" : "—"} />
          </View>
        )}
        <View style={s.section}>
          <Text style={s.h2}>적용 가능 보조금 ({o.stage8?.subsidies.length ?? 0}건)</Text>
          {o.stage8?.subsidies.map((sub) => (
            <Text key={sub.id} style={{ paddingVertical: 1.5 }}>
              • {sub.name} — {sub.type === "loan" ? `이자 ${((sub.interest_rate ?? 0) * 100).toFixed(1)}%` : `${((sub.subsidy_rate ?? 0) * 100).toFixed(0)}% 지원`} ({sub.agency})
            </Text>
          ))}
        </View>
        <TitleBlock meta={meta} drawingTitle="안전·법규" page={12} total={total} />
      </Page>

      {/* ─── p13 BOM + 면책 ─── */}
      <Page size="A4" style={s.page}>
        <Hdr title="13. BOM 자재명세서 · 면책" sub="Bill of Materials & Disclaimer" />
        <View style={s.section}>
          <Text style={s.h2}>BOM ({bom.length}건)</Text>
          <View style={s.table}>
            <View style={s.trHead}>
              <Text style={[s.td, { width: "6%" }]}>No</Text>
              <Text style={[s.td, { width: "12%" }]}>분류</Text>
              <Text style={[s.td, { width: "12%" }]}>Tag</Text>
              <Text style={[s.td, { width: "40%" }]}>품명</Text>
              <Text style={[s.td, { width: "10%" }]}>수량</Text>
              <Text style={[s.td, { width: "20%" }]}>재질</Text>
            </View>
            {bom.map((it) => (
              <View key={it.no} style={s.tr}>
                <Text style={[s.td, { width: "6%" }]}>{it.no}</Text>
                <Text style={[s.td, { width: "12%" }]}>{it.category}</Text>
                <Text style={[s.td, { width: "12%" }]}>{it.tag}</Text>
                <Text style={[s.td, { width: "40%" }]}>{it.description}</Text>
                <Text style={[s.td, { width: "10%" }]}>{it.qty} {it.unit}</Text>
                <Text style={[s.td, { width: "20%" }]}>{it.material ?? ""}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={s.disclaimer}>
          <Text style={{ fontWeight: 700, marginBottom: 3 }}>면책 조항 (Disclaimer)</Text>
          <Text>본 보고서는 입력값 기반 자동생성이며, 법적 효력 또는 인증을 대체하지 않습니다.</Text>
          <Text>• 인허가: 관할 시·군·구 환경부서  • 안전검사: 안전보건공단/지정검사기관</Text>
          <Text>• 유해위험방지계획서: 안전보건공단  • 분진폭발 인증: ATEX/IECEx 공인시험기관</Text>
          <Text>• 환경영향평가: 한국환경공단  • 본 자동평가는 위 절차의 사전준비 자료로만 활용</Text>
        </View>
        <TitleBlock meta={meta} drawingTitle="BOM · 면책" page={13} total={total} />
      </Page>
    </Document>
  );
}
