# Stage 7 — 송풍기 배치 (코드 매핑)

`docs/99_research/fan_condenser_research.md` 의 매트릭스 코드화.

## 인터페이스

```typescript
export interface FanInput {
  Q_design_m3min: number;
  T_in_C: number;
  dP_total_Pa: number;          // Stage 2+3+5+6 합산 + 마진
  conc_in_fan_g_m3: number;     // 집진기 통과 후
  abrasive_dust: boolean;
  hood_branches: number;
  duct_length_m: number;
  treatment_type: TreatmentType;
  load_variation_pct: number;
  op_hours_yr: number;
  R_kWh_won?: number;
  capex_VFD_won?: number;
  redundancy_required: boolean;
}

export interface FanOutput {
  arrangement: "1_ID" | "FD+ID_balanced" | "Nplus1_parallel";
  fan_count: number;
  fans: Array<{
    id: string;
    role: "FD" | "ID";
    type: FanType;
    Q_m3min: number;
    dP_Pa: number;
    BHP_kW: number;
    motor_kW: number;
    VFD: boolean;
  }>;
  total_kW: number;
  annual_kWh: number;
  annual_cost_won: number;
  VFD_payback_yr?: number;
  fan_material: string;
  warnings: string[];
}
```

## 결정 매트릭스

```typescript
const ARRANGEMENT_MATRIX: Array<{condition: (i:FanInput)=>boolean, result: FanOutput['arrangement']}> = [
  { condition: i => i.Q_design_m3min < 5000 && i.dP_total_Pa < 2940 /* 300 mmAq */ && i.hood_branches <= 5,
    result: "1_ID" },
  { condition: i => i.Q_design_m3min < 50000 && i.dP_total_Pa < 5880 /* 600 mmAq */,
    result: "FD+ID_balanced" },
  { condition: () => true,
    result: "Nplus1_parallel" },
];

function decideArrangement(input: FanInput): FanOutput['arrangement'] {
  for (const rule of ARRANGEMENT_MATRIX) {
    if (rule.condition(input)) return rule.result;
  }
  return "1_ID";
}
```

## 송풍기 형식 선정

```typescript
type FanType = "Radial" | "Turbo_BC" | "Airfoil" | "Sirocco" | "Axial";

function selectFanType(input: FanInput, role: "FD"|"ID"): FanType {
  // 전단 (FD) — 분진 통과
  if (role === "FD" || input.conc_in_fan_g_m3 > 10 || input.abrasive_dust) {
    return "Radial";
  }
  if (input.T_in_C > 300) {
    return "Radial";  // 고온내성
  }
  // 후단 (ID) — 청정가스
  if (input.dP_total_Pa > 3920 /* 400 mmAq */ && input.Q_design_m3min > 10000) {
    return "Airfoil";
  }
  if (input.dP_total_Pa > 1960 /* 200 mmAq */) {
    return "Turbo_BC";
  }
  if (input.Q_design_m3min < 500 && input.dP_total_Pa < 800) {
    return "Sirocco";
  }
  return "Axial";
}
```

## 동력 식

```typescript
function calcFanPower(Q_m3s: number, dP_Pa: number, fan_type: FanType): {BHP_kW, motor_kW} {
  const η_table: Record<FanType, number> = {
    Airfoil: 0.85,
    Turbo_BC: 0.80,
    Radial: 0.65,
    Sirocco: 0.60,
    Axial: 0.75,
  };
  const η_fan = η_table[fan_type];
  const η_motor = 0.94;
  const η_drive = 0.97;  // V-belt, direct drive=1.0
  
  const BHP_kW = (Q_m3s * dP_Pa) / (1000 * η_fan * η_motor * η_drive);
  
  // 표준 모터 사이즈 (KS C IEC 60072 + 안전여유 20%)
  const motor_kW = roundUpStandardMotor(BHP_kW * 1.20);
  
  return { BHP_kW, motor_kW };
}

const STANDARD_MOTOR_kW = [
  0.75, 1.1, 1.5, 2.2, 3.7, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75,
  90, 110, 132, 160, 200, 250, 315, 400, 500, 630, 800
];

function roundUpStandardMotor(kW: number): number {
  return STANDARD_MOTOR_kW.find(s => s >= kW) ?? 800;
}
```

## VFD ROI

```typescript
function calcVFDPayback(input: FanInput, motor_kW: number): {use_VFD, payback_yr} {
  const use_VFD = (
    input.load_variation_pct > 20 &&
    input.op_hours_yr > 4000 &&
    motor_kW >= 30
  );
  
  if (!use_VFD) return { use_VFD: false, payback_yr: undefined };
  
  // VFD 가격 (kW당 약 200만원)
  const C_VFD = motor_kW * 2_000_000;
  
  // 절감액: 어피니티 P ∝ N³
  const N_avg_pct = 100 - input.load_variation_pct/2;
  const power_factor = Math.pow(N_avg_pct/100, 3);
  const power_savings_kW = motor_kW * (1 - power_factor) * 0.7;  // 0.7 = 평균 부하율
  const annual_savings = power_savings_kW * input.op_hours_yr * (input.R_kWh_won ?? 100);
  const payback_yr = C_VFD / annual_savings;
  
  return { use_VFD, payback_yr };
}
```

## 통합 함수

```typescript
export function designFan(input: FanInput): FanOutput {
  const warnings: string[] = [];
  
  // 풍량 환산 (운전온도 → 표준상태)
  const Q_design_at_T = input.Q_design_m3min * 1.10;  // 5~10% 마진
  const Q_design_at_std = Q_design_at_T * 273.15 / (input.T_in_C + 273.15);
  
  // 정압 마진
  const dP_design = input.dP_total_Pa * 1.20;  // 20% 마진
  
  // 배치
  const arrangement = decideArrangement(input);
  
  let fans: FanOutput['fans'] = [];
  let total_kW = 0;
  
  if (arrangement === "1_ID") {
    const type = selectFanType(input, "ID");
    const power = calcFanPower(Q_design_at_T/60, dP_design, type);
    const vfd = calcVFDPayback(input, power.motor_kW);
    fans = [{
      id: "FN-01", role: "ID", type,
      Q_m3min: Q_design_at_T,
      dP_Pa: dP_design,
      BHP_kW: power.BHP_kW,
      motor_kW: power.motor_kW,
      VFD: vfd.use_VFD,
    }];
    total_kW = power.motor_kW;
    
  } else if (arrangement === "FD+ID_balanced") {
    // FD: 처음~SDA 또는 처음~집진기, ID: 집진기~스택
    const dP_FD = dP_design * 0.45;
    const dP_ID = dP_design * 0.55;
    const FD_type = selectFanType(input, "FD");
    const ID_type = selectFanType(input, "ID");
    const FD = calcFanPower(Q_design_at_T/60, dP_FD, FD_type);
    const ID = calcFanPower(Q_design_at_T/60, dP_ID, ID_type);
    fans = [
      { id:"FN-FD-01", role:"FD", type:FD_type, Q_m3min: Q_design_at_T, dP_Pa: dP_FD, ...FD, VFD: false },
      { id:"FN-ID-01", role:"ID", type:ID_type, Q_m3min: Q_design_at_T, dP_Pa: dP_ID, ...ID, VFD: calcVFDPayback(input, ID.motor_kW).use_VFD },
    ];
    total_kW = FD.motor_kW + ID.motor_kW;
    
  } else {
    // N+1 병렬
    const n_main = Math.ceil(Q_design_at_T / 30000);
    const Q_per = Q_design_at_T / n_main;
    const ID_type = selectFanType(input, "ID");
    const power = calcFanPower(Q_per/60, dP_design, ID_type);
    fans = [];
    for (let i = 1; i <= n_main; i++) {
      fans.push({ id:`FN-ID-${i.toString().padStart(2,'0')}`, role:"ID", type:ID_type, Q_m3min: Q_per, dP_Pa: dP_design, ...power, VFD: true });
    }
    fans.push({ id:`FN-ID-${(n_main+1).toString().padStart(2,'0')}`, role:"ID", type:ID_type, Q_m3min: Q_per, dP_Pa: dP_design, ...power, VFD: true });
    total_kW = power.motor_kW * n_main;  // standby는 운전시간 0
  }
  
  // 재질 (가스 부식성)
  let fan_material = "Carbon steel";
  if (input.treatment_type.includes("wet")) {
    fan_material = "FRP or SUS316L";
  } else if (input.T_in_C > 250) {
    fan_material = "Heat-resistant steel";
  }
  
  // 연간 운전비
  const annual_kWh = total_kW * input.op_hours_yr * 0.7;  // 부하율 0.7
  const annual_cost = annual_kWh * (input.R_kWh_won ?? 100);
  
  return {
    arrangement,
    fan_count: fans.length,
    fans,
    total_kW,
    annual_kWh,
    annual_cost_won: annual_cost,
    VFD_payback_yr: fans.find(f=>f.VFD)?.VFD ? calcVFDPayback(input, total_kW).payback_yr : undefined,
    fan_material,
    warnings,
  };
}
```

## 단위테스트

```typescript
describe("Stage 7 — Fan", () => {
  it("일반 백필터 — 1팬 ID", () => {
    const r = designFan({
      Q_design_m3min: 1000, T_in_C: 80,
      dP_total_Pa: 150*9.81,    // 150 mmAq
      conc_in_fan_g_m3: 0.05,
      abrasive_dust: false,
      hood_branches: 1,
      treatment_type: "dry",
      load_variation_pct: 10,
      op_hours_yr: 6000,
    });
    expect(r.arrangement).toBe("1_ID");
    expect(r.fan_count).toBe(1);
    expect(r.fans[0].type).toMatch(/Turbo|Sirocco|Axial/);
  });
  
  it("MSW 소각 — FD+ID 2팬", () => {
    const r = designFan({
      Q_design_m3min: 30000, T_in_C: 200,
      dP_total_Pa: 400*9.81,
      conc_in_fan_g_m3: 0.01,
      abrasive_dust: false,
      hood_branches: 1,
      treatment_type: "semi-dry",
      load_variation_pct: 30,
      op_hours_yr: 8000,
    });
    expect(r.arrangement).toBe("FD+ID_balanced");
    expect(r.fan_count).toBe(2);
  });
});
```
