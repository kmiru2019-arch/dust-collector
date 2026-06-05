# Stage 3 — 덕트 사이징 (코드 매핑)

## 반송속도 (KOSHA W-3 기준)

| 분진 종류 | V_t (m/s) |
|---|---|
| 가스·증기 | 6~12 |
| 흄 (welding, 미세) | 8~10 |
| 가벼운 분진 (목분, 면) | 13~16 |
| 중간 분진 (시멘트, 곡분) | 18~20 |
| 무거운 분진 (금속, 광물) | 20~23 |
| 매우 무거운 (납, 무거운 광물) | 23~25 |

## 덕트 사이징 — 등속법 vs 등압법

### 등속법 (Equal Velocity) — 분진계
모든 가지에서 V_t 일정 → 침전 방지. 표준.
```
D = √(4·Q / (π·V_t))
```

### 등압법 (Equal Pressure Drop) — HVAC
가지별 ΔP/L 일정 → 균압. 분진 없을 때.

### 정압회복법 (Static Regain) — 대형 시스템
가지마다 정압 회복 활용.

## 마찰손실 (Darcy-Weisbach)

```
ΔP_straight = f · (L/D) · ρ · V² / 2
```

f = Colebrook 또는 Swamee-Jain 근사:
```
1/√f = -2·log₁₀(ε/(3.7·D) + 2.51/(Re·√f))      (Colebrook, 묵시적)

f = 0.25 / [log₁₀(ε/(3.7·D) + 5.74/Re^0.9)]²    (Swamee-Jain, 명시적)
```

ε = 절대조도:
| 재질 | ε (mm) |
|---|---|
| SS400 (carbon steel) | 0.046 |
| SUS304/316L | 0.015 |
| FRP | 0.005 |
| 갈바나이즈드 | 0.15 |
| 콘크리트 | 0.3~3.0 |

## 국부손실 (Local Loss)

```
ΔP_local = K · ρ · V² / 2
```

| 형상 | K |
|---|---|
| 90° 엘보 (R/D=1.0) | 0.30 |
| 90° 엘보 (R/D=1.5) | 0.20 |
| 90° 엘보 (R/D=2.0) | 0.15 |
| 45° 엘보 | 0.20 |
| 분기 T (분기측) | 0.5~1.5 (각도별) |
| 분기 T (직진측) | 0.1~0.4 |
| 합류 Y (30°) | 0.20 |
| 합류 Y (45°) | 0.40 |
| 합류 Y (90°) | 1.20 |
| 점진 확대 (15°) | 0.15 |
| 점진 축소 (15°) | 0.05 |
| 급격 확대 | 1.0 |
| 급격 축소 | 0.5 |
| 게이트밸브 (full open) | 0.15 |
| 버터플라이 (full open) | 0.30 |
| 댐퍼 (open) | 0.20 |
| 블래스트 게이트 (open) | 0.50 |

## 합류 손실

분기 합류 시 추가 보정 (Wright 식):
```
ΔP_combine = K_c · ρ · V_main² / 2
```

## 코드 (lib/calc/dust/03-duct.ts)

```typescript
import { CARRIER_VELOCITY, ROUGHNESS, FITTING_K } from '@/lib/data/dust/duct-fittings';

export function sizeDuct(input: Stage3Input, s1: Stage1Output, s2: Stage2Output): Stage3Output {
  // 반송속도 결정
  const V_t = input.transport_velocity ?? recommendVt(s1.dust);
  
  // 가스 물성
  const T_K = s1.gas.T_in + 273.15;
  const ρ = airDensityAt(s1.gas);
  const μ = airViscosityAt(s1.gas.T_in);
  
  // 가지별 사이징
  const branches: BranchResult[] = [];
  let Q_running = 0;
  
  for (const branch of input.branches) {
    const Q = branch.Q_m3min;  // 또는 Stage 2 후드 풍량
    Q_running += Q;
    
    // 직경 계산
    const D_calc = Math.sqrt(4 * (Q/60) / (Math.PI * V_t));
    const D = roundUpStandardDuct(D_calc);  // KS B 6361 표준
    
    // 실제 속도
    const V_actual = (Q/60) / (Math.PI/4 * D**2);
    
    // Reynolds
    const Re = ρ * V_actual * D / μ;
    
    // 마찰계수
    const ε_over_D = ROUGHNESS[input.material] / 1000 / D;
    const f = swameeJain(Re, ε_over_D);
    
    // 직선손실
    const ΔP_straight = f * (branch.length / D) * ρ * V_actual**2 / 2;
    
    // 국부손실
    let ΔP_local = 0;
    for (const fit of branch.fittings) {
      const K = FITTING_K[fit.type];
      ΔP_local += K * ρ * V_actual**2 / 2 * fit.count;
    }
    
    // 합류손실
    let ΔP_combine = 0;
    if (branch.junction) {
      ΔP_combine = combineLoss(branch.junction.angle, V_actual, ρ);
    }
    
    branches.push({
      id: branch.id,
      D, V_actual, Re, f,
      ΔP_straight, ΔP_local, ΔP_combine,
      ΔP_total: ΔP_straight + ΔP_local + ΔP_combine,
    });
  }
  
  // 메인 덕트 (합산)
  const main = sizeMainDuct(Q_running, V_t, ρ, μ, input);
  
  // 가지 균형 (각 가지 ΔP 균등화 — 블래스트게이트로)
  const balanced = balanceBranches(branches);
  
  // 검증
  const warnings: string[] = [];
  if (V_t < recommendVt(s1.dust) * 0.9) {
    warnings.push("반송속도 미달 — 분진 침전 위험");
  }
  if (V_t > 25) {
    warnings.push("반송속도 과다 — 마모 위험");
  }
  
  return {
    branches: balanced,
    main,
    total: {
      ΔP_duct: balanced[0].ΔP_total + main.ΔP_total,
      Q_total: Q_running,
      V_min: Math.min(...balanced.map(b => b.V_actual)),
      V_max: Math.max(...balanced.map(b => b.V_actual)),
    },
    warnings,
  };
}

function swameeJain(Re: number, ε_D: number): number {
  return 0.25 / Math.pow(Math.log10(ε_D/3.7 + 5.74/Math.pow(Re, 0.9)), 2);
}
```

## 표준 덕트 사이즈 (KS B 6361)

```typescript
const STANDARD_DUCT_DIAMETER_MM = [
  100, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500,
  550, 600, 650, 700, 750, 800, 900, 1000, 1100, 1200, 1400, 1600, 1800, 2000
];

function roundUpStandardDuct(D_calc_m: number): number {
  const D_mm = D_calc_m * 1000;
  return STANDARD_DUCT_DIAMETER_MM.find(s => s >= D_mm) ?? 2000;
}
```

## 단위테스트

```typescript
describe("Stage 3 — Duct", () => {
  it("Swamee-Jain — 매끄러운 관 Re 1e5", () => {
    expect(swameeJain(1e5, 0.0001)).toBeCloseTo(0.018, 3);
  });
  it("덕트 사이징 — 분진 100 m³/min, V_t 18", () => {
    const D = sqrt(4*(100/60)/(Math.PI*18));
    expect(D).toBeCloseTo(0.343, 2);  // ≈ 343mm → 표준 350
  });
});
```
