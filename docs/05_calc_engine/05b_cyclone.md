# Stage 5-B — 사이클론 (코드 매핑)

`docs/02_collector_matrix/cyclone_design.md` 식의 코드.

## 표준비율 표

```typescript
// lib/data/dust/cyclone-standards.ts
export const CYCLONE_STANDARDS = {
  Stairmand_HE: {
    a_D: 0.50, b_D: 0.20, De_D: 0.50, S_D: 0.50,
    h_D: 1.50, H_D: 4.00, B_D: 0.375,
    K_NH: 6.4, N_e: 5,
    label: "Stairmand High-Efficiency",
    use: "정밀집진",
  },
  Stairmand_HT: {
    a_D: 0.75, b_D: 0.375, De_D: 0.75, S_D: 0.875,
    h_D: 1.50, H_D: 4.00, B_D: 0.375,
    K_NH: 7.5, N_e: 4,
    label: "Stairmand High-Throughput",
    use: "대용량 전처리",
  },
  Lapple: {
    a_D: 0.50, b_D: 0.25, De_D: 0.50, S_D: 0.625,
    h_D: 2.00, H_D: 4.00, B_D: 0.25,
    K_NH: 8.0, N_e: 5,
    label: "Lapple GP",
    use: "일반산업 균형",
  },
  Swift_HE: {
    a_D: 0.44, b_D: 0.21, De_D: 0.40, S_D: 0.50,
    h_D: 1.40, H_D: 3.90, B_D: 0.40,
    K_NH: 9.24, N_e: 6,
    label: "Swift High-Efficiency",
    use: "미세분진",
  },
  Swift_GP: {
    a_D: 0.50, b_D: 0.25, De_D: 0.50, S_D: 0.60,
    h_D: 1.75, H_D: 3.75, B_D: 0.40,
    K_NH: 8.0, N_e: 5,
    label: "Swift GP",
    use: "균형형",
  },
  Peterson: {
    a_D: 0.583, b_D: 0.208, De_D: 0.50, S_D: 0.583,
    h_D: 1.333, H_D: 3.917, B_D: 0.50,
    K_NH: 7.0, N_e: 5,
    label: "Peterson-Whitby",
    use: "특수",
  },
} as const;
```

## 코드 (lib/calc/dust/05-cyclone.ts)

```typescript
import { CYCLONE_STANDARDS } from '@/lib/data/dust/cyclone-standards';

export interface CycloneInput {
  Q_m3min: number;
  V_target_m_s?: number;        // default 18
  standard: keyof typeof CYCLONE_STANDARDS;
  rho_g_kg_m3?: number;
  mu_g_Pa_s?: number;
  rho_p_kg_m3: number;
  particle_dist: PSD;            // 입도분포
  count?: number;                // 멀티사이클론
  series?: "single" | "double" | "multi_parallel";
}

export interface CycloneOutput {
  D_m: number;
  dimensions_mm: AllDimensions;
  V_i_m_s: number;
  dP_Pa: number;
  d50_um: number;
  efficiency_overall: number;
  efficiency_curve: Array<{ d_um: number, eta: number }>;
  count: number;
  warnings: string[];
}

export function designCyclone(input: CycloneInput): CycloneOutput {
  const std = CYCLONE_STANDARDS[input.standard];
  const V_target = input.V_target_m_s ?? 18;
  const ρ_g = input.rho_g_kg_m3 ?? 1.2;
  const μ = input.mu_g_Pa_s ?? 1.85e-5;
  const warnings: string[] = [];
  
  // 본체 직경 계산
  // Q[m³/s] = V_i × a × b = V_i × (a/D × D) × (b/D × D) = V_i × (a/D)(b/D) × D²
  const Q_per_unit = (input.Q_m3min / 60) / (input.count ?? 1);
  const D = Math.sqrt(Q_per_unit / (V_target * std.a_D * std.b_D));
  
  // 차원
  const dim = {
    D_mm: D * 1000,
    a_mm: D * std.a_D * 1000,
    b_mm: D * std.b_D * 1000,
    De_mm: D * std.De_D * 1000,
    S_mm: D * std.S_D * 1000,
    h_mm: D * std.h_D * 1000,
    H_mm: D * std.H_D * 1000,
    B_mm: D * std.B_D * 1000,
  };
  
  // 실제 입구속도
  const V_i = Q_per_unit / (dim.a_mm/1000 * dim.b_mm/1000);
  
  // 압력손실 (Shepherd-Lapple)
  const dP = std.K_NH * ρ_g * V_i**2 / 2;
  
  // 컷오프 입경 (Lapple)
  const d50 = Math.sqrt(
    9 * μ * (dim.b_mm/1000) /
    (2 * Math.PI * std.N_e * V_i * (input.rho_p_kg_m3 - ρ_g))
  ) * 1e6;  // m → μm
  
  // 효율 곡선
  const efficiency_curve = input.particle_dist.bins.map(bin => ({
    d_um: bin.d_um,
    eta: 1 / (1 + Math.pow(d50 / bin.d_um, 2)),  // Lapple 단순형
  }));
  
  // 전체 효율
  const efficiency_overall = efficiency_curve.reduce(
    (sum, c, i) => sum + c.eta * input.particle_dist.bins[i].mass_frac,
    0
  );
  
  // 검증
  if (V_i < 12) warnings.push(`입구속도 ${V_i.toFixed(1)} m/s 너무 낮음`);
  if (V_i > 22) warnings.push(`입구속도 ${V_i.toFixed(1)} m/s 너무 높음 (마모)`);
  if (dP > 2000) warnings.push(`ΔP ${(dP/9.81).toFixed(0)} mmAq — 200 초과 부담`);
  
  // 멀티사이클론 자동 추천
  if (D > 1.0 && (input.count ?? 1) === 1) {
    warnings.push(`본체 직경 ${(D*1000).toFixed(0)}mm — 멀티사이클론 (소형 ${Math.ceil(D/0.3)}대) 검토`);
  }
  
  return {
    D_m: D,
    dimensions_mm: dim,
    V_i_m_s: V_i,
    dP_Pa: dP,
    d50_um: d50,
    efficiency_overall,
    efficiency_curve,
    count: input.count ?? 1,
    warnings,
  };
}

// 멀티사이클론 자동 결정
export function autoMulticyclone(input: CycloneInput): CycloneOutput {
  const single = designCyclone({...input, count: 1});
  if (single.D_m <= 0.5) return single;
  
  // 소형 D=0.3m 다수 병렬
  const D_small = 0.3;
  const Q_per_small = Math.PI/4 * D_small**2 * (input.V_target_m_s ?? 18) * input.standard.a_D * input.standard.b_D / (Math.PI/4 * D_small**2);
  // = V_target × a/D × b/D × D²
  const Q_per_small_calc = (input.V_target_m_s ?? 18) * 
                           CYCLONE_STANDARDS[input.standard].a_D *
                           CYCLONE_STANDARDS[input.standard].b_D * D_small**2;
  const n = Math.ceil((input.Q_m3min/60) / Q_per_small_calc);
  return designCyclone({ ...input, count: n });
}
```

## 효율식 옵션 (Barth, Iozia-Leith)

```typescript
export type EfficiencyModel = "Lapple" | "Barth" | "Iozia-Leith" | "Rosin-Rammler";

function computeEfficiency(d_um: number, d50_um: number, model: EfficiencyModel = "Lapple"): number {
  switch (model) {
    case "Lapple":
      return 1 / (1 + Math.pow(d50_um/d_um, 2));
    case "Rosin-Rammler":
      return 1 - Math.exp(-Math.pow(d_um/d50_um, 1.0));
    case "Barth":
      // Barth (보텍스 평형) — 더 정확
      return barthEfficiency(d_um, d50_um);
    case "Iozia-Leith":
      // Iozia-Leith (시간상수)
      return ioziaLeithEfficiency(d_um, d50_um);
  }
}
```

## 단위테스트

```typescript
describe("Stage 5-B — Cyclone", () => {
  it("Stairmand HE — 30 m³/min", () => {
    const r = designCyclone({
      Q_m3min: 30, standard: "Stairmand_HE",
      rho_p_kg_m3: 2200,
      particle_dist: { bins: [
        { d_um: 1, mass_frac: 0.1 },
        { d_um: 5, mass_frac: 0.3 },
        { d_um: 10, mass_frac: 0.4 },
        { d_um: 50, mass_frac: 0.2 },
      ]},
    });
    expect(r.D_m).toBeCloseTo(0.413, 2);  // V_i 18 m/s
    expect(r.V_i_m_s).toBeCloseTo(18, 0);
    expect(r.d50_um).toBeGreaterThan(2);
    expect(r.d50_um).toBeLessThan(8);
    expect(r.efficiency_overall).toBeGreaterThan(0.7);
  });
});
```
