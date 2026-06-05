# Stage 5-C — 전기집진기 EP/WESP (코드 매핑)

`docs/02_collector_matrix/ep_design.md` 의 식 코드화.

## 입력·출력

```typescript
export interface EPInput {
  Q_m3s: number;
  target_efficiency: number;       // 0~1
  dust_resistivity_Ohm_cm: number;
  particle_dist: PSD;
  ep_type: "dry" | "wet";
  T_in_C: number;
  area_per_field_m2?: number;      // 디폴트 30
}

export interface EPOutput {
  SCA_s_per_m: number;
  A_total_m2: number;
  field_count: number;
  drift_velocity_m_s: number;
  voltage_kV: number;
  current_density_mA_m2: number;
  conditioning: ConditioningRecommendation | null;
  efficiency_modified: number;     // Modified Deutsch-Matts 재검증
  warnings: string[];
}
```

## 드리프트 속도 DB

```typescript
// lib/data/dust/drift-velocity.ts
export const DRIFT_VELOCITY: Record<DustCode, [number, number]> = {
  fly_ash:        [0.05, 0.15],
  cement_kiln:    [0.06, 0.08],
  cement_dust:    [0.05, 0.10],
  pulp_black_liquor: [0.10, 0.20],
  carbon_black:   [0.05, 0.10],
  alumina:        [0.20, 0.30],
  iron_oxide:     [0.10, 0.20],
  limestone:      [0.15, 0.25],
  // ...
};
```

## 코드 (lib/calc/dust/05-ep.ts)

```typescript
export function designEP(input: EPInput, dust_code: DustCode): EPOutput {
  const ρ = input.dust_resistivity_Ohm_cm;
  let [w_low, w_high] = DRIFT_VELOCITY[dust_code] ?? [0.05, 0.15];
  let w = (w_low + w_high) / 2;
  const warnings: string[] = [];
  let conditioning: ConditioningRecommendation | null = null;
  
  // 비저항 보정
  if (ρ < 1e4) {
    warnings.push(`비저항 ${ρ.toExponential(1)} 낮음 — 재비산 위험`);
    w *= 0.7;
  } else if (ρ >= 1e11) {
    if (input.ep_type === "dry") {
      warnings.push(`비저항 ${ρ.toExponential(1)} > 10¹¹ — 백코로나 위험`);
      conditioning = {
        type: "SO3_or_NH3",
        recommendation: "SO₃/NH₃ 컨디셔닝 또는 WESP 전환",
        SO3_ppm: 10,
      };
      w *= 0.5;
    }
  } else if (ρ >= 1e10) {
    warnings.push("비저항 한계영역 — 펄스 에너자이제이션 권장");
    w *= 0.8;
  }
  
  // SCA 계산 (Deutsch 역식)
  const SCA = -Math.log(1 - input.target_efficiency) / w;
  const A_total = SCA * input.Q_m3s;
  
  // 필드 수
  const A_per_field = input.area_per_field_m2 ?? 30;
  const field_count = Math.max(2, Math.ceil(A_total / A_per_field));
  
  // 전기조건 (경험치)
  const voltage_kV = input.ep_type === "wet" ? 50 : 60;
  const current_density_mA_m2 = ρ < 1e9 ? 0.4 : 0.2;
  
  // Modified Deutsch-Matts 재검증
  const k = 0.5;
  const SCA_w = SCA * w;
  const η_modified = 1 - Math.exp(-Math.pow(SCA_w, k));
  
  if (η_modified < input.target_efficiency * 0.9) {
    warnings.push(
      `Modified Deutsch-Matts: ${(η_modified*100).toFixed(1)}% (목표 ${(input.target_efficiency*100).toFixed(1)}%) — SCA 30% 증가 권장`
    );
  }
  
  // 출구온도 vs 노점 (산응축 방지)
  if (input.T_in_C < 130) {
    warnings.push("EP 운전온도 130°C 미만 — 산노점 응축 위험");
  }
  
  return {
    SCA_s_per_m: SCA,
    A_total_m2: A_total,
    field_count,
    drift_velocity_m_s: w,
    voltage_kV,
    current_density_mA_m2,
    conditioning,
    efficiency_modified: η_modified,
    warnings,
  };
}
```

## 효율 곡선 (입경별)

```typescript
function efficiencyByParticleSize(d_um: number, ep: EPOutput, gas: GasState): number {
  // 전계대전 (>0.5 μm)
  // 확산대전 (<0.2 μm)
  // Greenfield gap 0.2~0.5 μm
  
  if (d_um >= 0.5) {
    // 전계대전 지배
    const w_d = ep.drift_velocity_m_s * (d_um / 1.0);  // q ∝ d²
    return 1 - Math.exp(-ep.SCA_s_per_m * w_d);
  } else if (d_um <= 0.2) {
    // 확산대전 지배
    const w_d = ep.drift_velocity_m_s * 0.7;
    return 1 - Math.exp(-ep.SCA_s_per_m * w_d);
  } else {
    // Greenfield gap (효율 최저)
    const w_d = ep.drift_velocity_m_s * 0.4;
    return 1 - Math.exp(-ep.SCA_s_per_m * w_d);
  }
}
```

## 단위테스트

```typescript
describe("Stage 5-C — EP", () => {
  it("비산회 99% — SCA 계산", () => {
    const r = designEP({
      Q_m3s: 100,
      target_efficiency: 0.99,
      dust_resistivity_Ohm_cm: 1e9,
      ep_type: "dry",
      T_in_C: 150,
      particle_dist: defaultPSD,
    }, "fly_ash");
    
    // SCA = -ln(0.01)/0.10 = 46
    expect(r.SCA_s_per_m).toBeCloseTo(46, 0);
    expect(r.A_total_m2).toBeCloseTo(4600, -2);
    expect(r.warnings.length).toBe(0);
  });
  
  it("고비저항 10¹² → 백코로나 경고", () => {
    const r = designEP({
      Q_m3s: 100,
      target_efficiency: 0.99,
      dust_resistivity_Ohm_cm: 1e12,
      ep_type: "dry",
      T_in_C: 150,
      particle_dist: defaultPSD,
    }, "cement_kiln");
    
    expect(r.warnings.some(w => w.includes("백코로나"))).toBe(true);
    expect(r.conditioning).not.toBeNull();
  });
});
```

## 면책

비저항이 큰 영향을 미치므로 실제 설계는 **분진 비저항 실측** 권장. DB값은 ±2 order 가능.
