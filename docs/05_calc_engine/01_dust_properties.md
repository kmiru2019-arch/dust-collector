# Stage 1 — 분진/가스 성상 (코드 매핑)

## 입력 인터페이스

```typescript
// lib/calc/dust/01-properties.ts
export interface Stage1Input {
  // 분진
  industry: IndustryCode;          // dust-types DB 키
  dust_name: string;
  d50: number;                     // μm
  d90?: number;
  particle_density: number;        // kg/m³
  bulk_density?: number;
  stickiness: "low"|"medium"|"high";
  flammable: boolean;
  Kst?: number;                    // bar·m/s
  MIE?: number;                    // mJ
  MIT?: number;                    // °C
  Pmax?: number;                   // bar
  corrosive: "none"|"mild"|"severe";
  
  // 가스
  T_in: number;                    // °C
  P_in: number;                    // kPa(a)
  RH_in: number;                   // %
  O2: number;                      // %v
  CO?: number;                     // ppm
  HCl?: number;                    // ppm
  SO2?: number;                    // ppm
  SO3?: number;                    // ppm
  NOx?: number;                    // ppm
  NH3?: number;                    // ppm
  Hg?: number;                     // μg/Nm³
  H2O_vapor?: number;              // %v
}
```

## 자동 도출

```typescript
export interface Stage1Output {
  dust: NormalizedDust;
  gas: NormalizedGas;
  derived: {
    ST_class: "ST0"|"ST1"|"ST2"|"ST3"|null;
    resistivity_estimate: { low: number, high: number };  // Ω·cm
    dewpoint_acid: number;          // °C, Verhoff-Banchero
    dewpoint_water: number;         // °C
    treatment_candidates: TreatmentCandidate[];
  };
}
```

## 식·구현

### ST 등급 (KOSHA D-13)
```typescript
function classifyST(Kst: number | undefined, flammable: boolean): STClass | null {
  if (!flammable) return null;
  if (Kst == null || Kst === 0) return "ST0";
  if (Kst <= 200) return "ST1";
  if (Kst <= 300) return "ST2";
  return "ST3";
}
```

### 비저항 추정 (DB lookup)
```typescript
import dustTypes from '@/lib/data/dust/dust-types';

function estimateResistivity(dust_name: string, T: number): [number, number] {
  const entry = dustTypes[dust_name];
  if (!entry?.resistivity) return [1e8, 1e10];  // 디폴트
  
  // 비저항은 온도 의존 (Bickelhaupt 식: log ρ vs 1/T)
  const adjusted = entry.resistivity.map(ρ_25 => 
    ρ_25 * Math.exp((1500/(T+273.15)) - (1500/298.15))
  );
  return [Math.min(...adjusted), Math.max(...adjusted)];
}
```

### Verhoff-Banchero 황산 노점
```typescript
export function verhoffBanchero(P_H2O_atm: number, P_H2SO4_atm: number): number {
  // Returns T_dp in K
  const inv_T = 2.276 - 0.0294*Math.log(P_H2O_atm) - 0.0858*Math.log(P_H2SO4_atm)
                + 0.0062*Math.log(P_H2O_atm * P_H2SO4_atm);
  return 1000 / inv_T - 273.15;  // °C
}

// 사용 예
function computeDewpointAcid(gas: NormalizedGas): number {
  if (!gas.SO3 || !gas.H2O_vapor) return -999;  // N/A
  const P_H2O = gas.H2O_vapor / 100;        // atm 분압
  const P_H2SO4 = gas.SO3 * 1e-6;
  return verhoffBanchero(P_H2O, P_H2SO4);
}
```

### 수증기 노점 (Magnus-Tetens)
```typescript
export function waterDewpoint(T_C: number, RH: number): number {
  const a = 17.625, b = 243.04;
  const γ = Math.log(RH/100) + (a*T_C)/(b+T_C);
  return (b*γ) / (a-γ);
}
```

### 처리방식 후보 결정
```typescript
function rankTreatments(dust: NormalizedDust, gas: NormalizedGas): TreatmentCandidate[] {
  const candidates: TreatmentCandidate[] = [];
  
  if (dust.flammable && dust.Kst != null) {
    candidates.push({ type: "dry+explosion_protection", score: 0.7, reason: "폭발성 분진 — Cyclone+Bag+ATEX" });
    candidates.push({ type: "wet", score: 0.6, reason: "폭발성 회피용 습식" });
  }
  
  if (dust.stickiness === "high") {
    candidates.push({ type: "wet", score: 0.9, reason: "점착성" });
    candidates.push({ type: "semi-dry", score: 0.5, reason: "반건식 (SDA 후 백)" });
  }
  
  if (gas.HCl > 50 || gas.SO2 > 100) {
    candidates.push({ type: "semi-dry+SDA", score: 0.9, reason: "산성가스 다량" });
    candidates.push({ type: "wet", score: 0.7, reason: "습식 흡수" });
  }
  
  if (gas.T_in > 400) {
    candidates.push({ type: "dry+precool", score: 0.8, reason: "고온 — 냉각 후 건식" });
    candidates.push({ type: "wet+quench", score: 0.7, reason: "직접 quench" });
  }
  
  if (candidates.length === 0) {
    candidates.push({ type: "dry", score: 0.95, reason: "일반 건식 표준" });
  }
  
  return candidates.sort((a, b) => b.score - a.score);
}
```

## 단위테스트

```typescript
// __tests__/stage1.test.ts
describe("Stage 1 — Properties", () => {
  it("ST class — 목분 Kst 150", () => {
    expect(classifyST(150, true)).toBe("ST1");
  });
  it("Verhoff 황산노점 — 일반 석탄보일러", () => {
    // SO3 10 ppm, H2O 8% v
    const T = verhoffBanchero(0.08, 10e-6);
    expect(T).toBeCloseTo(140, -1);   // ±10°C
  });
  it("처리방식 후보 — 목분", () => {
    const r = rankTreatments(
      { flammable: true, Kst: 150, stickiness: "low" },
      { T_in: 25, HCl: 0, SO2: 0 }
    );
    expect(r[0].type).toBe("dry+explosion_protection");
  });
});
```
