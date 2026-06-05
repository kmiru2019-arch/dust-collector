// Stage 7 — 송풍기 배치 (1팬/2팬/N+1) + 형식 + VFD ROI

import type {
  Stage7Input, Stage7Output, Stage1Output, Stage2Output, Stage3Output,
  Stage5Output, Stage6Output, FanType, FanArrangement, FanSpec, TreatmentType,
} from "./types";
// Note: Stage2Output imported for type — runStage7 받는 s2 인자
import { FAN_TYPES, roundUpStandardMotor } from "@/lib/data/dust/fan-curves";

/**
 * 1팬 vs 2팬 vs N+1 결정
 */
export function decideArrangement(p: {
  Q_m3min: number;
  dP_Pa: number;
  hood_branches: number;
  treatment: TreatmentType;
  redundancy_required?: boolean;
}): FanArrangement {
  if (p.redundancy_required && p.Q_m3min > 30000) return "Nplus1_parallel";
  if (p.Q_m3min < 5000 && p.dP_Pa < 2940 && p.hood_branches <= 5) return "1_ID";
  if (p.Q_m3min < 50000 && p.dP_Pa < 5880) return "FD+ID_balanced";
  if (p.treatment.startsWith("semi-dry") || p.treatment === "wet+FGD") {
    return "FD+ID_balanced";
  }
  if (p.Q_m3min > 50000) return "Nplus1_parallel";
  return "1_ID";
}

/**
 * 송풍기 형식 선정
 */
export function selectFanType(p: {
  role: "FD" | "ID";
  conc_in_fan_g_m3: number;
  abrasive_dust: boolean;
  T_in_C: number;
  dP_Pa: number;
  Q_m3min: number;
}): FanType {
  if (p.role === "FD" || p.conc_in_fan_g_m3 > 10 || p.abrasive_dust) return "Radial";
  if (p.T_in_C > 300) return "Radial";
  if (p.dP_Pa > 3920 && p.Q_m3min > 10000) return "Airfoil";
  if (p.dP_Pa > 1960) return "Turbo_BC";
  if (p.Q_m3min < 500 && p.dP_Pa < 800) return "Sirocco";
  return "Axial";
}

/**
 * 동력 계산
 */
export function calcFanPower(
  Q_m3s: number,
  dP_Pa: number,
  fan_type: FanType
): { BHP_kW: number; motor_kW: number } {
  const η_fan = FAN_TYPES[fan_type].efficiency;
  const η_motor = 0.94;
  const η_drive = 0.97;
  const BHP_kW = (Q_m3s * dP_Pa) / (1000 * η_fan * η_motor * η_drive);
  const motor_kW = roundUpStandardMotor(BHP_kW * 1.20);
  return { BHP_kW, motor_kW };
}

/**
 * VFD ROI 계산
 */
export function calcVFDPayback(p: {
  load_variation_pct: number;
  op_hours_yr: number;
  motor_kW: number;
  R_kWh_won: number;
}): { use_VFD: boolean; payback_yr?: number } {
  const use_VFD = p.load_variation_pct > 20 && p.op_hours_yr > 4000 && p.motor_kW >= 30;
  if (!use_VFD) return { use_VFD: false };

  const C_VFD = p.motor_kW * 2_000_000;
  const N_avg = 1 - p.load_variation_pct / 200;     // 50% 변동 → 0.75 평균
  const power_factor = Math.pow(N_avg, 3);
  const power_savings_kW = p.motor_kW * (1 - power_factor) * 0.7;
  const annual_savings = power_savings_kW * p.op_hours_yr * p.R_kWh_won;
  const payback_yr = annual_savings > 0 ? C_VFD / annual_savings : undefined;
  return { use_VFD, payback_yr };
}

export function runStage7(
  input: Stage7Input,
  s1: Stage1Output,
  s2: Stage2Output,
  s3: Stage3Output,
  s5: Stage5Output,
  s6: Stage6Output,
  treatment: TreatmentType
): Stage7Output {
  const warnings: string[] = [];

  // 풍량 마진 — Stage 2 후드풍량과 Stage 3 덕트 풍량 중 큰 값 사용 (연결 끊김 안전망)
  const Q_base = Math.max(s2.Q_hood_m3min, s3.total.Q_total_m3min);
  const Q_design = Q_base * 1.10;

  // 정압 합산 + 마진 (Stage 2 후드 정압 실값 사용)
  const dP_hood = s2.dP_hood_Pa;
  const dP_stack = 100;  // 스택 통상 손실
  const dP_total = (dP_hood + s3.total.dP_duct_Pa + s5.dP_collector_Pa + dP_stack) * 1.20;

  const branches = input.hood_branches ?? 1;
  const conc_in_fan = input.conc_in_fan_g_m3 ?? 0.05;
  const abrasive = input.abrasive_dust ?? (s1.dust.particle_density_kg_m3 > 4000);

  const arrangement = decideArrangement({
    Q_m3min: Q_design,
    dP_Pa: dP_total,
    hood_branches: branches,
    treatment,
    redundancy_required: input.redundancy_required,
  });

  const fans: FanSpec[] = [];
  let total_kW = 0;

  const op_hours_yr = input.op_hours_yr ?? 6000;
  const R_kWh = input.R_kWh_won ?? 100;
  const load_var = input.load_variation_pct ?? 15;

  if (arrangement === "1_ID") {
    const type = selectFanType({
      role: "ID", conc_in_fan_g_m3: conc_in_fan, abrasive_dust: abrasive,
      T_in_C: s6.T_target_C ?? s1.gas.T_in_C, dP_Pa: dP_total, Q_m3min: Q_design,
    });
    const power = calcFanPower(Q_design / 60, dP_total, type);
    const vfd = calcVFDPayback({ load_variation_pct: load_var, op_hours_yr, motor_kW: power.motor_kW, R_kWh_won: R_kWh });
    fans.push({
      id: "FN-01", role: "ID", type,
      Q_m3min: Q_design, dP_Pa: dP_total,
      BHP_kW: power.BHP_kW, motor_kW: power.motor_kW, VFD: vfd.use_VFD,
    });
    total_kW = power.motor_kW;
  } else if (arrangement === "FD+ID_balanced") {
    const dP_FD = dP_total * 0.45;
    const dP_ID = dP_total * 0.55;
    const FD_type = selectFanType({
      role: "FD", conc_in_fan_g_m3: conc_in_fan, abrasive_dust: abrasive,
      T_in_C: s1.gas.T_in_C, dP_Pa: dP_FD, Q_m3min: Q_design,
    });
    const ID_type = selectFanType({
      role: "ID", conc_in_fan_g_m3: 0.01, abrasive_dust: false,
      T_in_C: s6.T_target_C ?? s1.gas.T_in_C, dP_Pa: dP_ID, Q_m3min: Q_design,
    });
    const FD = calcFanPower(Q_design / 60, dP_FD, FD_type);
    const ID = calcFanPower(Q_design / 60, dP_ID, ID_type);
    fans.push(
      { id: "FN-FD-01", role: "FD", type: FD_type, Q_m3min: Q_design, dP_Pa: dP_FD, ...FD, VFD: false },
      { id: "FN-ID-01", role: "ID", type: ID_type, Q_m3min: Q_design, dP_Pa: dP_ID, ...ID,
        VFD: calcVFDPayback({ load_variation_pct: load_var, op_hours_yr, motor_kW: ID.motor_kW, R_kWh_won: R_kWh }).use_VFD,
      }
    );
    total_kW = FD.motor_kW + ID.motor_kW;
  } else {
    // N+1 병렬
    const n_main = Math.max(2, Math.ceil(Q_design / 30000));
    const Q_per = Q_design / n_main;
    const ID_type = selectFanType({
      role: "ID", conc_in_fan_g_m3: conc_in_fan, abrasive_dust: abrasive,
      T_in_C: s6.T_target_C ?? s1.gas.T_in_C, dP_Pa: dP_total, Q_m3min: Q_per,
    });
    const power = calcFanPower(Q_per / 60, dP_total, ID_type);
    for (let i = 1; i <= n_main + 1; i++) {
      fans.push({
        id: `FN-ID-${String(i).padStart(2, "0")}`,
        role: "ID", type: ID_type,
        Q_m3min: Q_per, dP_Pa: dP_total,
        BHP_kW: power.BHP_kW, motor_kW: power.motor_kW,
        VFD: true,
      });
    }
    total_kW = power.motor_kW * n_main; // standby 1대 제외
  }

  // 재질
  let fan_material = "Carbon steel";
  if (treatment.includes("wet")) fan_material = "FRP or SUS316L";
  else if (s1.gas.T_in_C > 250) fan_material = "Heat-resistant steel";

  // 운전비
  const annual_kWh = total_kW * op_hours_yr * 0.7;
  const annual_cost = annual_kWh * R_kWh;

  const VFD_payback_yr = fans.find((f) => f.VFD)
    ? calcVFDPayback({ load_variation_pct: load_var, op_hours_yr, motor_kW: total_kW, R_kWh_won: R_kWh }).payback_yr
    : undefined;

  if (total_kW > 1000 && !fans.some((f) => f.VFD)) {
    warnings.push("대형 송풍기 — VFD 적용 검토 권장");
  }

  return {
    arrangement,
    fan_count: fans.length,
    fans,
    total_kW,
    annual_kWh,
    annual_cost_won: annual_cost,
    VFD_payback_yr,
    fan_material,
    warnings,
  };
}
