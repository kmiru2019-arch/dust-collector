// BOM (Bill of Materials) 생성 — 설계 결과로부터 장비·자재 수량집계

import type { AllStageOutputs } from "@/lib/calc/dust/types";

export interface BOMItem {
  no: number;
  category: "equipment" | "duct" | "instrument" | "valve" | "safety" | "fan" | "auxiliary";
  tag: string;
  description: string;
  qty: number;
  unit: string;
  spec?: string;
  material?: string;
  remarks?: string;
}

export function generateBOM(o: AllStageOutputs): BOMItem[] {
  const items: BOMItem[] = [];
  let no = 1;

  // 후드
  items.push({
    no: no++, category: "equipment", tag: "HD-01",
    description: "후드 (Stage 2)",
    qty: 1, unit: "EA",
    spec: `${o.stage2?.hood_type} / V_c=${o.stage2?.V_c_applied_m_s.toFixed(2)} m/s / Q=${o.stage2?.Q_hood_m3min.toFixed(0)} m³/min`,
    material: "SS400",
  });

  // 덕트
  if (o.stage3?.branches[0]) {
    const b = o.stage3.branches[0];
    items.push({
      no: no++, category: "duct", tag: "DT-01",
      description: "메인 덕트 (Stage 3)",
      qty: 1, unit: "Lot",
      spec: `Ø${(b.D_m * 1000).toFixed(0)}mm × L=${o.stage3.branches[0] ? "각 가지별" : "—"}`,
      material: "SS400",
      remarks: `Re=${b.Re.toExponential(1)}, V=${b.V_actual_m_s.toFixed(1)}m/s`,
    });
  }

  // 집진기
  if (o.stage5?.bag) {
    items.push({
      no: no++, category: "equipment", tag: "BF-01",
      description: "백필터 (Stage 5)",
      qty: 1, unit: "EA",
      spec: `${o.stage5.bag.A_total_m2.toFixed(0)}m² / ${o.stage5.bag.bag_count}개 백 / 여재 ${o.stage5.bag.media.code}`,
      material: o.stage5.bag.media.full_name ?? o.stage5.bag.media.code,
      remarks: `A/C=${o.stage5.bag.AC_ratio_m_min.toFixed(2)} m/min`,
    });
    items.push({
      no: no++, category: "auxiliary", tag: "PJ-01",
      description: "펄스제트 시스템 (Air receiver + SV array + Sequencer)",
      qty: 1, unit: "Set",
      spec: `Pulse air ~${o.stage5.bag.pulse_air_consumption_Nm3min?.toFixed(2)} Nm³/min`,
    });
    items.push({
      no: no++, category: "valve", tag: "RV-01",
      description: "회전밸브 (분진 배출)",
      qty: 1, unit: "EA",
      spec: "DN200, 모터구동",
    });
  }
  if (o.stage5?.cyclone) {
    items.push({
      no: no++, category: "equipment", tag: "CY-01",
      description: "사이클론 (Stage 5)",
      qty: o.stage5.cyclone.count, unit: "EA",
      spec: `D=${(o.stage5.cyclone.D_m * 1000).toFixed(0)}mm / d50=${o.stage5.cyclone.d50_um.toFixed(1)}μm`,
      material: "SS400",
    });
  }
  if (o.stage5?.ep) {
    items.push({
      no: no++, category: "equipment", tag: "EP-01",
      description: "전기집진기",
      qty: 1, unit: "EA",
      spec: `SCA=${o.stage5.ep.SCA_s_per_m.toFixed(0)} / A=${o.stage5.ep.A_total_m2.toFixed(0)}m² / ${o.stage5.ep.field_count} field / ${o.stage5.ep.voltage_kV}kV`,
      material: "SS400",
    });
  }
  if (o.stage5?.scrubber) {
    items.push({
      no: no++, category: "equipment", tag: "SC-01",
      description: `스크러버 (${o.stage5.scrubber.type})`,
      qty: 1, unit: "EA",
      spec: `L/G=${o.stage5.scrubber.L_G_L_per_m3.toFixed(2)} / dP=${(o.stage5.scrubber.dP_Pa / 9.81).toFixed(0)}mmAq`,
      material: o.stage5.scrubber.material_recommendation,
      remarks: `Water ${o.stage5.scrubber.water_consumption_m3h.toFixed(1)} m³/h`,
    });
  }

  // 응축기
  if (o.stage6?.type) {
    items.push({
      no: no++, category: "equipment", tag: "HX-01",
      description: `응축기/HX (${o.stage6.type})`,
      qty: 1, unit: "EA",
      spec: `T_out=${o.stage6.T_target_C.toFixed(0)}°C / ${o.stage6.waste_heat_kW.toFixed(0)}kW 회수`,
      material: o.stage6.material_recommendation,
      remarks: `보온 ${o.stage6.insulation_thickness_mm}mm`,
    });
  }

  // 송풍기
  o.stage7?.fans.forEach((f) => {
    items.push({
      no: no++, category: "fan", tag: f.id,
      description: `${f.role === "FD" ? "FD" : "ID"} 송풍기 (${f.type})`,
      qty: 1, unit: "EA",
      spec: `${f.Q_m3min.toFixed(0)} m³/min × ${(f.dP_Pa / 9.81).toFixed(0)} mmAq / Motor ${f.motor_kW}kW${f.VFD ? " + VFD" : ""}`,
      material: o.stage7?.fan_material,
    });
  });

  // 스택
  items.push({
    no: no++, category: "equipment", tag: "ST-01",
    description: "스택 + CEMS",
    qty: 1, unit: "EA",
    spec: "고도 15~30m / 자동측정장치 (TMS)",
    material: "SS400",
    remarks: o.stage8?.TMS_required ? "TMS 의무" : "TMS 면제",
  });

  // 안전장치
  if (o.stage8?.explosion) {
    items.push({
      no: no++, category: "safety", tag: "ER-01",
      description: "폭발 릴리프 벤트 (NFPA 68)",
      qty: 1, unit: "EA",
      spec: `면적 ${o.stage8.explosion.vent_area_m2.toFixed(2)} m²`,
      remarks: `ATEX/IECEx 인증 권장 (${o.stage8.explosion.ST_class})`,
    });
    items.push({
      no: no++, category: "safety", tag: "ISO-01",
      description: "격리밸브 (NFPA 69)",
      qty: 1, unit: "EA",
      spec: "고속 차단",
    });
  }

  // 계장 (PDT, TT, AT)
  items.push({
    no: no++, category: "instrument", tag: "PDT-101",
    description: "차압 전송기 (필수 — 백필터 청소 트리거)",
    qty: 1, unit: "EA",
    spec: "0~250 mmAq",
  });
  items.push({
    no: no++, category: "instrument", tag: "TT-101",
    description: "온도 전송기 (입구)",
    qty: 1, unit: "EA",
    spec: "K-type / 0~600°C",
  });
  if (o.stage8?.TMS_required) {
    items.push({
      no: no++, category: "instrument", tag: "AIT-101",
      description: "굴뚝자동측정 (TMS) — 먼지·SO₂·NOx",
      qty: 1, unit: "Set",
      remarks: "대기환경보전법 의무",
    });
  }

  return items;
}

export function bomToCSV(items: BOMItem[]): string {
  const headers = ["No", "Category", "Tag", "Description", "Qty", "Unit", "Spec", "Material", "Remarks"];
  const rows = [headers.join(",")];
  for (const i of items) {
    rows.push([
      i.no, i.category, i.tag,
      `"${i.description.replace(/"/g, '""')}"`,
      i.qty, i.unit,
      `"${(i.spec ?? "").replace(/"/g, '""')}"`,
      `"${(i.material ?? "").replace(/"/g, '""')}"`,
      `"${(i.remarks ?? "").replace(/"/g, '""')}"`,
    ].join(","));
  }
  return rows.join("\n");
}
