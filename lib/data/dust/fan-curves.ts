// 송풍기 5형식 효율·적용 데이터
// 출처: AirPro, Hartzell, AMCA

import type { FanType } from "@/lib/calc/dust/types";

export interface FanTypeInfo {
  Q_min_m3min: number;
  Q_max_m3min: number;
  dP_min_Pa: number;
  dP_max_Pa: number;
  efficiency: number;        // 0~1
  abrasion_resistance: "low" | "med" | "high";
  cost: 1 | 2 | 3 | 4 | 5;
  best_for: string;
}

export const FAN_TYPES: Record<FanType, FanTypeInfo> = {
  Turbo_BC: {
    Q_min_m3min: 100, Q_max_m3min: 10000,
    dP_min_Pa: 980, dP_max_Pa: 4900,         // 100~500 mmAq
    efficiency: 0.80, abrasion_resistance: "med", cost: 3,
    best_for: "일반 EP/백필터 후단 (청정가스)",
  },
  Sirocco: {
    Q_min_m3min: 10, Q_max_m3min: 500,
    dP_min_Pa: 100, dP_max_Pa: 800,
    efficiency: 0.60, abrasion_resistance: "low", cost: 1,
    best_for: "소형 환기, 저저항 HVAC",
  },
  Radial: {
    Q_min_m3min: 50, Q_max_m3min: 5000,
    dP_min_Pa: 1960, dP_max_Pa: 7840,
    efficiency: 0.65, abrasion_resistance: "high", cost: 3,
    best_for: "고분진·고온, FD팬, 물질이송",
  },
  Airfoil: {
    Q_min_m3min: 1000, Q_max_m3min: 100000,
    dP_min_Pa: 980, dP_max_Pa: 5880,
    efficiency: 0.88, abrasion_resistance: "low", cost: 5,
    best_for: "청정가스·FGD 후단·고효율",
  },
  Axial: {
    Q_min_m3min: 1000, Q_max_m3min: 50000,
    dP_min_Pa: 100, dP_max_Pa: 980,
    efficiency: 0.78, abrasion_resistance: "low", cost: 2,
    best_for: "저정압 대풍량, 환기·셋틀링",
  },
};

/**
 * 표준 모터 사이즈 (KS C IEC 60072)
 */
export const STANDARD_MOTOR_KW = [
  0.75, 1.1, 1.5, 2.2, 3.7, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75,
  90, 110, 132, 160, 200, 250, 315, 400, 500, 630, 800,
];

export function roundUpStandardMotor(kW: number): number {
  return STANDARD_MOTOR_KW.find((s) => s >= kW) ?? 800;
}
