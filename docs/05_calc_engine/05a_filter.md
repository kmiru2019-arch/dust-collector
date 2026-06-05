# Stage 5-A — 여과집진 (백필터/카트리지) 코드

`docs/02_collector_matrix/bag_filter_design.md` 의 식을 코드로.

## 입력·출력 인터페이스

```typescript
export interface BagInput {
  Q_m3min: number;
  inlet_conc_g_m3: number;
  T_in_C: number;
  filter_type: "pulse_jet" | "reverse_air" | "shaker" | "cartridge";
  industry?: IndustryCode;        // 산업별 A/C 디폴트
  gas_chemistry: { HCl, SO3, NH3, H2O_vapor };
  manual_media?: FilterMedia;
  manual_AC?: number;
  bag_diameter_mm?: number;        // 디폴트 160
  bag_length_m?: number;           // 디폴트 6
}

export interface BagOutput {
  AC_ratio_m_min: number;
  A_total_m2: number;
  bag_count: number;
  bag_dim: { D_mm, L_m };
  media: FilterMediaInfo;
  dP_clean_Pa: number;
  dP_design_Pa: number;
  cleaning_interval_min: number;
  pulse_air_consumption_Nm3min?: number;
  warnings: string[];
}
```

## A/C 추천 로직

```typescript
const AC_RECOMMENDATIONS: Record<FilterType, Record<string, number>> = {
  pulse_jet: {
    default: 1.2,
    cement: 0.7,
    cement_kiln: 0.9,
    welding_fume: 0.6,
    msw_incineration: 0.9,
    woodworking: 1.5,
    eaf: 1.0,
  },
  reverse_air: { default: 0.5 },
  shaker: { default: 0.7 },
  cartridge: { default: 1.0, welding_fume: 0.7 },
};

function recommendAC(input: BagInput): number {
  if (input.manual_AC) return input.manual_AC;
  const map = AC_RECOMMENDATIONS[input.filter_type];
  if (input.industry && map[input.industry]) return map[input.industry];
  return map.default;
}
```

## 여재 선택 로직

```typescript
const FILTER_MEDIA: Record<MediaCode, FilterMediaInfo> = {
  PE:        { T_max: 130, acid: "med", alkali: "low",  hydrolysis: "med",  cost: 1, full_name: "Polyester" },
  PP:        { T_max: 90,  acid: "high",alkali: "high", hydrolysis: "high", cost: 1, full_name: "Polypropylene" },
  Acrylic:   { T_max: 125, acid: "med", alkali: "med",  hydrolysis: "med",  cost: 2 },
  Nomex:     { T_max: 200, acid: "med", alkali: "med",  hydrolysis: "med",  cost: 3, full_name: "Aramid" },
  PPS:       { T_max: 190, acid: "high",alkali: "high", hydrolysis: "high", cost: 3, full_name: "Polyphenylene Sulfide" },
  P84:       { T_max: 240, acid: "high",alkali: "med",  hydrolysis: "med",  cost: 4, full_name: "Polyimide" },
  PTFE:      { T_max: 260, acid: "vh",  alkali: "vh",   hydrolysis: "vh",   cost: 5, full_name: "Teflon" },
  Glass:     { T_max: 260, acid: "med", alkali: "med",  hydrolysis: "med",  cost: 2, full_name: "Glass fiber" },
  Ceramic:   { T_max: 600, acid: "high",alkali: "high", hydrolysis: "high", cost: 5 },
  Metal:     { T_max: 500, acid: "med", alkali: "med",  hydrolysis: "high", cost: 4, full_name: "Stainless steel fiber" },
  Cellulose: { T_max: 60,  acid: "low", alkali: "low",  hydrolysis: "low",  cost: 1 },
  ePTFE:     { T_max: 260, acid: "vh",  alkali: "vh",   hydrolysis: "vh",   cost: 5, full_name: "ePTFE membrane laminate" },
};

function recommendMedia(input: BagInput): MediaCode {
  if (input.manual_media) return input.manual_media;
  const T = input.T_in_C;
  const acidity = (input.gas_chemistry.SO3 ?? 0) > 5 || (input.gas_chemistry.HCl ?? 0) > 50;
  
  if (T > 240) return "PTFE";
  if (T > 200 && acidity) return "PTFE";
  if (T > 200) return "P84";
  if (T > 130 && acidity) return "PPS";
  if (T > 130) return "Nomex";
  if (acidity) return "PP";
  return "PE";
}
```

## 코드 (lib/calc/dust/05-bag.ts)

```typescript
export function designBaghouse(input: BagInput): BagOutput {
  const AC = recommendAC(input);
  const media_code = recommendMedia(input);
  const media = FILTER_MEDIA[media_code];
  const warnings: string[] = [];
  
  if (input.T_in_C > media.T_max - 30) {
    warnings.push(`온도 마진 부족 — 여재 한계 ${media.T_max}°C, 운전 ${input.T_in_C}°C`);
  }
  
  // 면적
  const A_total = input.Q_m3min / AC;  // m²
  
  // 백 수 (직경 160mm × 길이 6m → 백당 ≈ 3.02 m²)
  const D_mm = input.bag_diameter_mm ?? 160;
  const L_m = input.bag_length_m ?? 6;
  const A_per_bag = Math.PI * (D_mm/1000) * L_m;
  const bag_count = Math.ceil(A_total / A_per_bag);
  
  // ΔP 모델
  const V_face_m_s = AC / 60;
  const ρ = airDensity(input.T_in_C);
  const dP_clean = 50 * 9.81;  // 50 mmAq → ~490 Pa
  
  // 분진 케이크 ΔP (시간경과)
  // K_2: 분진별 케이크 저항계수 (Pa·s·m/kg)
  const K_2 = lookupCakeResistance(input.dust_type) ?? 1e10;
  const C_inlet_kg_m3 = input.inlet_conc_g_m3 / 1000;
  const t_clean_s = 1200;  // 청소 인터벌 20분
  const dP_dust = K_2 * C_inlet_kg_m3 * V_face_m_s * t_clean_s;
  
  const dP_design = dP_clean + dP_dust;
  
  // 청소 인터벌 (ΔP 트리거 또는 시간만료)
  const cleaning_interval_min = Math.min(
    20,
    (200*9.81 - dP_clean) / (K_2 * C_inlet_kg_m3 * V_face_m_s) / 60
  );
  
  // 펄스제트 공기소비
  const pulse_air = input.filter_type === "pulse_jet"
    ? bag_count * 0.05 / cleaning_interval_min  // 0.05 m³ per pulse
    : undefined;
  
  // 검증
  if (dP_design > 2000) warnings.push("ΔP_design > 200 mmAq — A/C 낮춰야 함");
  if (AC > 2.0) warnings.push("A/C 너무 높음");
  
  return {
    AC_ratio_m_min: AC,
    A_total_m2: A_total,
    bag_count,
    bag_dim: { D_mm, L_m },
    media: { code: media_code, ...media },
    dP_clean_Pa: dP_clean,
    dP_design_Pa: dP_design,
    cleaning_interval_min,
    pulse_air_consumption_Nm3min: pulse_air,
    warnings,
  };
}
```

## 단위테스트

```typescript
describe("Stage 5-A — Bag", () => {
  it("일반 펄스제트 — 100 m³/min", () => {
    const r = designBaghouse({
      Q_m3min: 100, inlet_conc_g_m3: 5, T_in_C: 80,
      filter_type: "pulse_jet", gas_chemistry: {}
    });
    expect(r.AC_ratio_m_min).toBe(1.2);
    expect(r.A_total_m2).toBeCloseTo(83.3, 1);
    expect(r.bag_count).toBeGreaterThanOrEqual(28);
    expect(r.media.code).toBe("PE");  // T 80 → PE
  });
  
  it("MSW 소각 — PTFE 추천", () => {
    const r = designBaghouse({
      Q_m3min: 1000, inlet_conc_g_m3: 5, T_in_C: 180,
      filter_type: "pulse_jet",
      industry: "msw_incineration",
      gas_chemistry: { HCl: 100, SO3: 10 }
    });
    expect(r.media.code).toBe("PTFE");
    expect(r.AC_ratio_m_min).toBe(0.9);
  });
});
```
