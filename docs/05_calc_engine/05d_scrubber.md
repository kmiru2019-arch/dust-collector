# Stage 5-D — 세정집진 (코드 매핑)

`docs/02_collector_matrix/scrubber_design.md` 식 코드화.

## 인터페이스

```typescript
export interface ScrubberInput {
  type: "venturi" | "packed" | "spray" | "cyclonic" | "sda";
  Q_m3s: number;
  inlet_conc_g_m3: number;
  particle_dist: PSD;
  gas_chemistry: { SO2, HCl, NH3, H2O_vapor };
  target_efficiency: number;
  L_G?: number;             // 수동 지정 시
}

export interface ScrubberOutput {
  L_G_L_per_m3: number;
  V_throat_m_s?: number;    // 벤추리
  dP_Pa: number;
  efficiency_overall: number;
  water_consumption_m3h: number;
  wastewater_m3h: number;
  reagent_consumption_kg_h?: number;
  approach_to_saturation_K?: number;  // SDA
  retention_time_s?: number;          // SDA
  material_recommendation: string;
  warnings: string[];
}
```

## 벤추리 코드

```typescript
function designVenturi(input: ScrubberInput): ScrubberOutput {
  const target = input.target_efficiency;
  
  // V_throat 추천 (효율 기반)
  let V_throat: number;
  if (target >= 0.99) V_throat = 120;
  else if (target >= 0.95) V_throat = 90;
  else V_throat = 70;
  
  // L/G
  const L_G = input.L_G ?? (target >= 0.99 ? 1.5 : 1.0);
  
  // ΔP (Calvert 식)
  const dP = 1.03e-3 * V_throat**2 * L_G * 9.81;  // Pa
  
  // 효율 (Yung)
  const eff_curve = input.particle_dist.bins.map(b => ({
    d_um: b.d_um,
    eta: yungEfficiency(b.d_um*1e-6, V_throat, L_G, input.gas_chemistry),
  }));
  const eff_overall = eff_curve.reduce((s, c, i) => s + c.eta * input.particle_dist.bins[i].mass_frac, 0);
  
  // 물·폐수
  const water_m3h = (input.Q_m3s * 3600 * L_G) / 1000;
  const wastewater_m3h = water_m3h * 0.85;  // 15% 증발
  
  return {
    L_G_L_per_m3: L_G,
    V_throat_m_s: V_throat,
    dP_Pa: dP,
    efficiency_overall: eff_overall,
    water_consumption_m3h: water_m3h,
    wastewater_m3h,
    material_recommendation: "FRP or SUS316L",
    warnings: [],
  };
}

function yungEfficiency(d_m: number, V_throat: number, L_G: number, chem: any): number {
  // Yung-Calvert 식 (단순화)
  const d_drop = nukiyamaTanasawa(V_throat, L_G);  // m
  const Stk = ρ_p * d_m**2 * V_throat / (9 * μ_g * d_drop);
  const B = 0.7;  // 관성충돌 파라미터
  return 1 - Math.exp(-4 * B * Stk * L_G * 1e-3);
}

function nukiyamaTanasawa(V_rel: number, L_G: number): number {
  const d_um = 16400/V_rel + 1.45 * Math.pow(L_G, 1.5);
  return d_um * 1e-6;
}
```

## SDA 코드

```typescript
function designSDA(input: ScrubberInput): ScrubberOutput {
  // Stoichiometric ratio Ca/S
  const Ca_S = 1.6;
  
  // 반응물 소요량 (Ca(OH)2 = 74, SO2 = 64)
  const SO2_kg_h = (input.gas_chemistry.SO2 * input.Q_m3s * 3600 * 64) / 22.414e6;
  const HCl_kg_h = (input.gas_chemistry.HCl * input.Q_m3s * 3600 * 36.5) / 22.414e6;
  const reagent_kg_h = (SO2_kg_h/64 * Ca_S + HCl_kg_h/36.5 * Ca_S/2) * 74;
  
  // Approach to saturation
  const approach_K = 15;  // 15~17 K (SDA 표준)
  
  // Retention time
  const retention_s = 10;
  
  // 물 소비 (슬러리 + 증발)
  const slurry_concentration = 0.20;  // 20%
  const water_m3h = (reagent_kg_h / slurry_concentration) / 1000;
  
  return {
    L_G_L_per_m3: 0,  // SDA는 L/G 개념 X
    dP_Pa: 200 * 9.81,  // ~200 mmAq
    efficiency_overall: 0.90,  // SDA 단독 기준 (백필터와 함께 99%)
    water_consumption_m3h: water_m3h,
    wastewater_m3h: 0,  // 반건식 핵심
    reagent_consumption_kg_h: reagent_kg_h,
    approach_to_saturation_K: approach_K,
    retention_time_s: retention_s,
    material_recommendation: "Carbon steel (SDA chamber) + SS316L (atomizer)",
    warnings: ["출구는 백필터 의무"],
  };
}
```

## 패킹베드·스프레이·사이클로닉

```typescript
function designPacked(input): ScrubberOutput { /* Onda 상관식 */ }
function designSpray(input): ScrubberOutput { /* 단순 스프레이 */ }
function designCyclonic(input): ScrubberOutput { /* 후단 미스트 분리 */ }
```

## 통합 함수

```typescript
export function designScrubber(input: ScrubberInput): ScrubberOutput {
  switch (input.type) {
    case "venturi": return designVenturi(input);
    case "packed":  return designPacked(input);
    case "spray":   return designSpray(input);
    case "cyclonic":return designCyclonic(input);
    case "sda":     return designSDA(input);
  }
}
```

## 미스트엘리미네이터

```typescript
export type MistEliminatorType = "chevron" | "mesh_pad" | "vane_pack" | "cyclonic";

const MIST_ELIMINATOR: Record<MistEliminatorType, {eta_at_um: number, dP_Pa: number}> = {
  chevron:   { eta_at_um: 27,  dP_Pa: 175 },  // 99% @ 27 μm
  mesh_pad:  { eta_at_um: 5,   dP_Pa: 100 },
  vane_pack: { eta_at_um: 10,  dP_Pa: 140 },
  cyclonic:  { eta_at_um: 100, dP_Pa: 350 },
};
```

## 단위테스트

```typescript
describe("Stage 5-D — Scrubber", () => {
  it("벤추리 99% — V_throat 120 m/s", () => {
    const r = designVenturi({
      type: "venturi", Q_m3s: 10, inlet_conc_g_m3: 5,
      particle_dist: smallParticleDist,
      gas_chemistry: {}, target_efficiency: 0.99
    });
    expect(r.V_throat_m_s).toBe(120);
    expect(r.dP_Pa).toBeGreaterThan(2000);
    expect(r.dP_Pa).toBeLessThan(25000);
  });
  
  it("SDA — SO₂ 300 ppm", () => {
    const r = designSDA({
      type: "sda", Q_m3s: 10,
      gas_chemistry: { SO2: 300, HCl: 0 },
      // ...
    } as any);
    expect(r.reagent_consumption_kg_h).toBeGreaterThan(30);
    expect(r.wastewater_m3h).toBe(0);
  });
});
```
