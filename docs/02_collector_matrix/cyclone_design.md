# 사이클론 설계 — 6종 표준 + 효율식

## 표준비율 표 (본체직경 D 기준)

| 비율 | Stairmand HE | Stairmand HT | Lapple GP | Swift HE | Swift GP | Peterson-Whitby |
|---|---|---|---|---|---|---|
| 입구높이 a/D | 0.50 | 0.75 | 0.50 | 0.44 | 0.50 | 0.583 |
| 입구폭 b/D | 0.20 | 0.375 | 0.25 | 0.21 | 0.25 | 0.208 |
| 출구지름 De/D | 0.50 | 0.75 | 0.50 | 0.40 | 0.50 | 0.50 |
| 보텍스파인더 S/D | 0.50 | 0.875 | 0.625 | 0.50 | 0.60 | 0.583 |
| 실린더부 h/D | 1.50 | 1.50 | 2.00 | 1.40 | 1.75 | 1.333 |
| 전체높이 H/D | 4.00 | 4.00 | 4.00 | 3.90 | 3.75 | 3.917 |
| 콘 하단 B/D | 0.375 | 0.375 | 0.25 | 0.40 | 0.40 | 0.50 |

| 모델 | 특성 | 적용 |
|---|---|---|
| Stairmand HE | 고효율, d50 작음 | 정밀집진 |
| Stairmand HT | 고풍량, ΔP 작음 | 대용량 전처리 |
| Lapple GP | 균형형 | 일반산업 |
| Swift HE | 고효율 | 미세분진 |
| Swift GP | 균형형 | - |
| Peterson | 변형 | 특수 |

## 핵심 식

### 입구속도
- 권장: V_i = 15~20 m/s (효율 피크 ≈ 13 m/s)
- 너무 빠르면 재비산, 너무 느리면 효율 저하

### 압력손실 (Shepherd-Lapple)
```
ΔP = K × ρ_g × V_i² / 2
```
| 모델 | K (NH) |
|---|---|
| Stairmand HE | 6.4 |
| Stairmand HT | 7.5 |
| Lapple | 8 |
| Swift HE | 9.24 |
| 무베인 | 16 |
| 중립베인 | 7.5 |

### 컷오프 입경 d50

**Lapple 식**:
```
d_50 = √[ 9·μ·b / (2·π·N_e·V_i·(ρ_p − ρ_g)) ]
```
- μ = 가스 점성 (Pa·s)
- b = 입구폭 (m)
- N_e = 유효회전수 (Lapple 기준 5~10, 일반 5)
- V_i = 입구속도 (m/s)
- ρ_p, ρ_g = 입자/가스 밀도 (kg/m³)

**Barth 식** (보텍스 평형 기반): 더 정확, EP 후단 등 정밀계산 시
**Iozia-Leith 식** (시간상수 기반): 가장 정확, 복잡

### 효율 곡선

**단순형 (Lapple)**:
```
η(d) = 1 / [1 + (d_50/d)²]
```

**Rosin-Rammler 형**:
```
η(d) = 1 − exp[−(d/d_50)^n]   (n ≈ 0.7~1.5)
```

**전체효율** (분진 입도분포 적분):
```
η_overall = Σ_i η(d_i) × m_fraction(d_i)
```

## 멀티/병렬/직렬 구성

### 멀티사이클론
- 소형 직경(150~300 mm) 다수 병렬
- d_50 ∝ √D 이므로 작은 D가 효율↑
- 발전·시멘트 프리클리너 표준

### 더블(2단) 사이클론
- 1단 거친먼지 (D_1 = 800 mm) + 2단 미세 (D_2 = 300 mm)
- d_50 단계적 감소

### 인라인 사이클론
- 축류형, ΔP↓ Q↑ 단 효율 낮음
- 덕트내장형

## 코드 매핑 (lib/calc/dust/05-cyclone.ts)

```typescript
type CycloneStandard = "Stairmand_HE" | "Stairmand_HT" | "Lapple" | "Swift_HE" | "Swift_GP" | "Peterson";

const STANDARDS: Record<CycloneStandard, Ratios> = {
  Stairmand_HE: { a: 0.5, b: 0.2, De: 0.5, S: 0.5, h: 1.5, H: 4.0, B: 0.375, K: 6.4, N_e: 5 },
  Stairmand_HT: { a: 0.75, b: 0.375, De: 0.75, S: 0.875, h: 1.5, H: 4.0, B: 0.375, K: 7.5, N_e: 4 },
  // ...
};

export function designCyclone(input: {
  Q_m3min: number;        // 처리풍량
  V_target_ms: number;    // 18 디폴트
  standard: CycloneStandard;
  rho_g: number;
  mu_g: number;
  rho_p: number;
  particle_dist: PSD;     // 입도분포
}): {
  D_m: number;            // 본체직경
  dimensions: AllDimensions;
  V_i: number;
  dP_Pa: number;
  d50_um: number;
  efficiency_overall: number;
  efficiency_curve: Array<[d_um, η]>;
} {
  const ratios = STANDARDS[input.standard];
  const A_inlet = ratios.a * ratios.b;  // /D² 비례
  // D = sqrt(Q / (V × a/D × b/D))
  const D = Math.sqrt(input.Q_m3min/60 / (input.V_target_ms * ratios.a * ratios.b));
  const dimensions = computeAll(D, ratios);
  const V_i = (input.Q_m3min/60) / (dimensions.a * dimensions.b);
  const dP = ratios.K * input.rho_g * V_i**2 / 2;
  const d50 = Math.sqrt(9*input.mu_g*dimensions.b / (2*Math.PI*ratios.N_e*V_i*(input.rho_p - input.rho_g))) * 1e6;
  const η_curve = input.particle_dist.bins.map(b => [b.d, 1/(1+(d50/b.d)**2)] as [number,number]);
  const η_overall = sum(η_curve.map(([d, η], i) => η * input.particle_dist.bins[i].mass_frac));
  return { D_m: D, dimensions, V_i, dP_Pa: dP, d50_um: d50, efficiency_overall: η_overall, efficiency_curve: η_curve };
}
```

## 멀티사이클론 자동결정

```typescript
if (Q_total > Q_per_cyclone * 1.2) {
  const n = Math.ceil(Q_total / Q_per_cyclone);
  return { type: "multi", count: n, D_each: D_small };
}
```

## 검증 체크포인트
- V_i ∈ [10, 25] m/s (경고: <15 또는 >22)
- ΔP ∈ [80, 200] mmAq (경고: >250)
- 출구속도 ≥ V_terminal (재비산 방지)
- 콘각도 ≥ 60° (분진 슬라이드 방지)
- d50 < d_target × 0.5 (목표 입경 절반 이하)
