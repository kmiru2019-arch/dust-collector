// 설비 외형·노즐·이격 자동 산출
// 풍량(Q) 기반으로 표준 사이즈 계산 — EPC 경험식 기반

import type { EquipmentDimension } from "@/lib/concept/types";
import { roundUpStandardDuct } from "./duct-fittings";

/**
 * 노즐(덕트) 직경 — 반송속도 기준
 * D = sqrt(4Q / πV), V=15~18 m/s
 */
export function nozzleDia_mm(Q_m3min: number, V_ms = 16): number {
  const Q_m3s = Q_m3min / 60;
  const D_m = Math.sqrt((4 * Q_m3s) / (Math.PI * V_ms));
  return roundUpStandardDuct(D_m);
}

/**
 * 백필터 외형 — A/C ratio로 면적 → 백 배열 → 외형
 */
export function baghouseDimension(Q_m3min: number, AC_ratio = 1.2): EquipmentDimension {
  const A_total = Q_m3min / AC_ratio;            // m²
  const A_per_bag = Math.PI * 0.16 * 6;          // Ø160 × 6m = 3.02 m²
  const bag_count = Math.ceil(A_total / A_per_bag);
  // 백 배열: 정사각 근사, 백 간격 200mm
  const bags_per_side = Math.ceil(Math.sqrt(bag_count));
  const W = bags_per_side * 0.2 + 1.0;           // m (점검 통로 포함)
  const D = bags_per_side * 0.2 + 1.0;
  const H = 6 + 2.5;                              // 백 6m + 청정실/펄스 2.5m
  const inlet = nozzleDia_mm(Q_m3min);
  return {
    type: "baghouse",
    W_mm: Math.round(W * 1000),
    D_mm: Math.round(D * 1000),
    H_mm: Math.round(H * 1000),
    inlet_dia_mm: inlet,
    outlet_dia_mm: roundUpStandardDuct((inlet / 1000) * 0.88), // 청정가스 ~12% 축소
    clearance_mm: 1500,                           // 백 교체구
    hopper_H_mm: 2500,
    note: `${bag_count}개 백 (Ø160×6m), A=${A_total.toFixed(0)}m²`,
  };
}

/**
 * 사이클론 외형 — Stairmand HE 표준비율 (H=4D)
 */
export function cycloneDimension(Q_m3min: number, V_i_ms = 18): EquipmentDimension {
  // D = sqrt(Q / (V × a/D × b/D)), Stairmand HE: a/D=0.5, b/D=0.2
  const Q_m3s = Q_m3min / 60;
  const D = Math.sqrt(Q_m3s / (V_i_ms * 0.5 * 0.2));
  const H = 4.0 * D;                              // 전체 높이
  return {
    type: "cyclone",
    D_mm: Math.round(D * 1000),
    H_mm: Math.round(H * 1000),
    inlet_dia_mm: Math.round(D * 0.2 * 1000),     // 입구폭 (사각이지만 등가)
    outlet_dia_mm: Math.round(D * 0.5 * 1000),    // De
    clearance_mm: 800,
    hopper_H_mm: 1500,
    note: `Stairmand HE, 본체 Ø${(D * 1000).toFixed(0)}mm`,
  };
}

/**
 * 전기집진기(EP) 외형 — SCA 기반 집진면적
 */
export function epDimension(Q_m3min: number, SCA = 80): EquipmentDimension {
  const Q_m3s = Q_m3min / 60;
  const A_total = SCA * Q_m3s;                    // 집진판 면적 m²
  // 판 높이 12m, 판 간격 0.4m 가정
  const plate_H = 12;
  const A_per_lane = plate_H * 12 * 2;            // 12m 길이 × 양면
  const lanes = Math.ceil(A_total / A_per_lane);
  const W = lanes * 0.4 + 2;
  const L = 12 + 3;                               // 판 12m + 입출구
  return {
    type: "ep",
    W_mm: Math.round(W * 1000),
    D_mm: Math.round(L * 1000),
    H_mm: Math.round((plate_H + 4) * 1000),       // 판 + 호퍼/래퍼
    inlet_dia_mm: nozzleDia_mm(Q_m3min, 12),      // EP는 저속 (가스 분배)
    outlet_dia_mm: nozzleDia_mm(Q_m3min, 12),
    clearance_mm: 1500,
    hopper_H_mm: 3000,
    note: `SCA ${SCA}, 집진면적 ${A_total.toFixed(0)}m²`,
  };
}

/**
 * SDA (반건식 흡수탑) — 체류시간 10s 기준 체적
 */
export function sdaDimension(Q_m3min: number, T_C = 200): EquipmentDimension {
  const Q_actual_m3s = (Q_m3min / 60) * ((T_C + 273) / 273); // 실제 체적유량
  const retention_s = 10;
  const V_vessel = Q_actual_m3s * retention_s;    // m³
  // 원통 H/D = 4 가정
  const D = Math.cbrt((4 * V_vessel) / (Math.PI * 4));
  const H = 4 * D;
  return {
    type: "sda",
    D_mm: Math.round(D * 1000),
    H_mm: Math.round(H * 1000),
    inlet_dia_mm: nozzleDia_mm(Q_m3min),
    outlet_dia_mm: nozzleDia_mm(Q_m3min),
    clearance_mm: 1500,
    note: `체류 10s, Ø${(D * 1000).toFixed(0)}×H${(H * 1000).toFixed(0)}mm`,
  };
}

/**
 * 벤추리 스크러버
 */
export function venturiDimension(Q_m3min: number): EquipmentDimension {
  const inlet = nozzleDia_mm(Q_m3min);
  const throat = roundUpStandardDuct((inlet / 1000) * 0.4); // throat 40%
  return {
    type: "venturi",
    D_mm: inlet,
    H_mm: 6000,
    inlet_dia_mm: inlet,
    outlet_dia_mm: throat,
    clearance_mm: 1200,
    note: `가변 throat Ø${throat}mm`,
  };
}

/**
 * 송풍기 외형 — 동력 기반
 */
export function fanDimension(Q_m3min: number, motor_kW = 30): EquipmentDimension {
  // 임펠러 직경 ~ Q^0.4
  const impeller_m = 0.3 * Math.pow(Q_m3min / 100, 0.4);
  const W = impeller_m * 1.5 + 1;
  const H = impeller_m * 1.3 + 1;
  const L = impeller_m * 1.5 + 2 + (motor_kW > 100 ? 2 : 1.2); // 모터 길이
  return {
    type: "fan",
    W_mm: Math.round(W * 1000),
    D_mm: Math.round(L * 1000),
    H_mm: Math.round(H * 1000),
    inlet_dia_mm: nozzleDia_mm(Q_m3min),
    outlet_dia_mm: roundUpStandardDuct((nozzleDia_mm(Q_m3min) / 1000) * 0.8),
    clearance_mm: 2000,
    note: `Motor ${motor_kW}kW, 임펠러 Ø${(impeller_m * 1000).toFixed(0)}mm`,
  };
}

/**
 * 스택(굴뚝) — 출구속도 15~20 m/s
 */
export function stackDimension(Q_m3min: number, height_m = 30): EquipmentDimension {
  const D = nozzleDia_mm(Q_m3min, 18);
  return {
    type: "stack",
    D_mm: D,
    H_mm: height_m * 1000,
    inlet_dia_mm: D,
    clearance_mm: 0,
    note: `높이 ${height_m}m, CEMS 샘플링점`,
  };
}

/**
 * 응축기 (Shell&Tube)
 */
export function condenserDimension(Q_m3min: number): EquipmentDimension {
  const inlet = nozzleDia_mm(Q_m3min);
  return {
    type: "condenser_shell",
    D_mm: Math.round(inlet * 1.5),
    H_mm: 4000,
    inlet_dia_mm: inlet,
    outlet_dia_mm: inlet,
    clearance_mm: 1200,
    note: "Shell&Tube, 튜브번들 분해세정",
  };
}
