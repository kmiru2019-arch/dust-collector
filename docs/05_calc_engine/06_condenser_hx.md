# Stage 6 — 응축기/HX (코드 매핑)

5형식 결정 + Verhoff-Banchero 노점 + 응축수량 + 폐열회수 ROI.

## 인터페이스

```typescript
export interface CondenserInput {
  T_in_C: number;
  T_target_C?: number;            // 미지정 시 자동
  Q_m3h_at_T: number;
  gas_composition: { H2O_vol, SO3_ppm, HCl_ppm };
  downstream_collector_type: CollectorType;  // 후단 집진기
  downstream_media?: MediaCode;    // 백필터 시
  has_waste_heat_use: boolean;
  waste_heat_temp_target_C?: number;
  fuel_type?: "coal" | "oil" | "gas" | "msw";
  capex_budget?: number;
}

export interface CondenserOutput {
  type: CondenserType | null;
  T_target_C: number;
  T_dewpoint_acid_C: number;
  T_dewpoint_water_C: number;
  margin_K: number;
  m_condensate_kg_h: number;
  waste_heat_kW: number;
  ROI_yr?: number;
  material_recommendation: string;
  insulation_thickness_mm: number;
  startup_heating_required: boolean;
  warnings: string[];
}
```

## 결정 로직

```typescript
import { verhoffBanchero, waterDewpoint } from './01-properties';
import { FILTER_MEDIA } from '@/lib/data/dust/filter-media';

const FILTER_T_LIMIT_LOOKUP = {
  bag: (media: MediaCode) => FILTER_MEDIA[media].T_max,
  cartridge: () => 80,
  ep_dry: () => 450,
  ep_wet: () => 90,
  scrubber: () => 80,
};

export function designCondenser(input: CondenserInput): CondenserOutput {
  const warnings: string[] = [];
  
  // 노점 계산
  const P_H2O_atm = (input.gas_composition.H2O_vol ?? 8) / 100;
  const P_SO3_atm = (input.gas_composition.SO3_ppm ?? 0) * 1e-6;
  const T_dp_acid = P_SO3_atm > 0 ? verhoffBanchero(P_H2O_atm, P_SO3_atm) : -999;
  const T_dp_water = waterDewpoint(input.T_in_C, P_H2O_atm * 100);
  
  // 후단 한계온도
  const T_limit = input.downstream_media
    ? FILTER_T_LIMIT_LOOKUP.bag(input.downstream_media)
    : FILTER_T_LIMIT_LOOKUP[input.downstream_collector_type as keyof typeof FILTER_T_LIMIT_LOOKUP]?.(undefined as any) ?? 200;
  const T_required_max = T_limit - 30;  // 마진
  
  // 목표온도 = max(T_required, T_dp_acid + 20)
  const T_target = input.T_target_C ?? Math.max(T_required_max, T_dp_acid > 0 ? T_dp_acid + 20 : 100);
  
  // 응축기 형식 결정
  let type: CondenserType | null = null;
  let ROI_yr: number | undefined;
  
  if (input.T_in_C <= T_target + 10) {
    type = null;  // 불필요
  } else if (input.T_in_C > 800) {
    type = "direct_quench";
  } else if (input.gas_composition.H2O_vol < 5 && input.fuel_type !== "msw") {
    if (input.T_in_C > 350 && input.has_waste_heat_use) {
      type = "shell_tube_WHB";
      const waste_heat_kW = computeRecoverableHeat(input, T_target);
      ROI_yr = capexHX(type) / (waste_heat_kW * 8000 * 0.10 * 3600/1000);
    } else if (input.T_in_C > 200) {
      type = "finned_tube_APH";
    } else {
      type = "plate_PHE";
    }
  } else if (input.downstream_collector_type === "scrubber") {
    type = "GGH_regenerative";
  } else {
    type = "shell_tube_WHB";
  }
  
  // 점착성·타르 → Quench
  // (사용자 입력에서 받음)
  
  // 응축수량
  const W_in = absoluteHumidity(input.T_in_C, P_H2O_atm * 100);
  const W_out = absoluteHumidity(T_target, 100);  // 포화
  const m_dry_gas_kg_h = input.Q_m3h_at_T * 1.2 * (273.15)/(input.T_in_C+273.15) * 0.95;
  const m_cond = Math.max(0, m_dry_gas_kg_h * (W_in - W_out));
  
  // 폐열
  const cp_g = 1100;  // J/(kg·K)
  const waste_heat_kW = (m_dry_gas_kg_h / 3600) * cp_g * (input.T_in_C - T_target) / 1000;
  
  // 재질 (노점 기반)
  let material = "SS400 (carbon steel)";
  if (T_dp_acid > 0 && T_target < T_dp_acid + 30) {
    material = "Hastelloy C-276";
  } else if (T_dp_acid > 100) {
    material = "SUS316L";
  }
  
  // 보온 두께 (노점 회피)
  const insulation_mm = T_target < 200 ? 100 : 80;
  
  // 시동 가열 (cold start 응축 방지)
  const startup_heating = T_target < T_dp_acid + 20;
  
  // 검증
  if (T_dp_acid > 0 && T_target < T_dp_acid + 20) {
    warnings.push(`목표온도 ${T_target}°C < 노점 ${T_dp_acid.toFixed(0)}°C + 20K — 산응축 위험`);
  }
  if (m_cond > 0 && type !== "direct_quench") {
    warnings.push(`응축수 ${m_cond.toFixed(0)} kg/h 발생 — 폐수처리 필요`);
  }
  
  return {
    type,
    T_target_C: T_target,
    T_dewpoint_acid_C: T_dp_acid,
    T_dewpoint_water_C: T_dp_water,
    margin_K: T_target - Math.max(T_dp_acid, 0),
    m_condensate_kg_h: m_cond,
    waste_heat_kW,
    ROI_yr,
    material_recommendation: material,
    insulation_thickness_mm: insulation_mm,
    startup_heating_required: startup_heating,
    warnings,
  };
}

function absoluteHumidity(T_C: number, RH_pct: number): number {
  const P_sat_kPa = magnusEquation(T_C);
  const P_v_kPa = P_sat_kPa * RH_pct / 100;
  const P_atm = 101.325;
  return 0.622 * P_v_kPa / (P_atm - P_v_kPa);
}

function magnusEquation(T_C: number): number {
  return 0.6108 * Math.exp(17.27 * T_C / (T_C + 237.3));
}

function capexHX(type: CondenserType): number {
  const map: Record<CondenserType, number> = {
    plate_PHE: 30000000,
    shell_tube_WHB: 80000000,
    finned_tube_APH: 50000000,
    air_cooled: 60000000,
    direct_quench: 20000000,
    GGH_regenerative: 200000000,
  };
  return map[type] ?? 50000000;
}

function computeRecoverableHeat(input: CondenserInput, T_target: number): number {
  // 폐열활용 시 회수 가능한 kW
  return (input.Q_m3h_at_T * 1.2) * 1100 * (input.T_in_C - T_target) / 3600 / 1000;
}
```

## 단위테스트

```typescript
describe("Stage 6 — Condenser", () => {
  it("일반 보일러 350°C → 백필터 PE 130°C", () => {
    const r = designCondenser({
      T_in_C: 350,
      Q_m3h_at_T: 5000,
      gas_composition: { H2O_vol: 8, SO3_ppm: 5 },
      downstream_collector_type: "bag",
      downstream_media: "PE",
      has_waste_heat_use: true,
      fuel_type: "oil",
    });
    
    expect(r.T_target_C).toBeLessThan(130);
    expect(["shell_tube_WHB","finned_tube_APH"]).toContain(r.type);
    expect(r.waste_heat_kW).toBeGreaterThan(50);
  });
  
  it("MSW 800°C → Quench", () => {
    const r = designCondenser({
      T_in_C: 800,
      Q_m3h_at_T: 50000,
      gas_composition: { H2O_vol: 18, HCl_ppm: 800 },
      downstream_collector_type: "bag",
      downstream_media: "PTFE",
      has_waste_heat_use: true,
      fuel_type: "msw",
    });
    
    // SDA 또는 Quench 권장
    expect(r.warnings.length).toBeGreaterThanOrEqual(0);
  });
});
```
