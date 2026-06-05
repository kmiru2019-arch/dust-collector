# Stage 2 — 후드 설계 (코드 매핑)

KOSHA W-1-2019 + 별표13 기반.

## 후드 8형식

| 형식 | 식 | 설명 |
|---|---|---|
| 포위형(Enclosing) | Q = 60·A_o·V_c·SF | 발산원 둘러쌈, 개구면적 A_o |
| 외부식 측방 | Q = 60·V_c·(10X² + A) | 발산원 옆 |
| 외부식 하방 | Q = 60·V_c·(10X² + A) | 발산원 아래 |
| 외부식 상방 | Q = 60·V_c·(10X² + A) | 발산원 위 |
| 캐노피 | Q = 1.4·P·V_c·H | 발산원 둘레 P, 높이 H |
| 레시버형 | Q = 1.5·D²·V_c | 발산원 자연흐름 활용 |
| 슬롯 | Q = 60·3.7·L·X·V_c | 슬롯길이 L |
| 부스 | Q = 60·A_face·V_c | 작업자 부스 |

## 제어풍속 (별표13)

```typescript
// lib/data/dust/kosha-controls.ts
export const CONTROL_VELOCITY: Record<HoodType, {gas: number, particle: number}> = {
  enclosing:        { gas: 0.4, particle: 0.7 },
  exterior_lateral: { gas: 0.5, particle: 1.0 },
  exterior_downward:{ gas: 0.5, particle: 1.0 },
  exterior_upward:  { gas: 1.0, particle: 1.5 },
  canopy:           { gas: 1.0, particle: 1.5 },
  receiving:        { gas: 0.5, particle: 1.0 },
  slot:             { gas: 0.5, particle: 1.0 },
  booth:            { gas: 0.4, particle: 0.5 },
};
```

발암성·고독성 물질 시 1.5배 가산.

## 후드 정압손실 K_hood

| 후드형식 | K_hood (∝ V²) |
|---|---|
| 포위형 (단순구) | 0.49 |
| 외부식 (테이퍼링 25°) | 0.06 |
| 외부식 (테이퍼링 90°) | 0.49 |
| 캐노피 | 0.25 |
| 슬롯 | 1.78 |
| 부스 | 0.5 |

```typescript
ΔP_hood = (1 + K_hood) × ρ × V_duct² / 2
```

## 코드 (lib/calc/dust/02-hood.ts)

```typescript
export function calcHood(input: Stage2Input, s1: Stage1Output): Stage2Output {
  // 제어풍속 lookup
  const dust_state = s1.dust.particulate ? "particle" : "gas";
  let V_c = CONTROL_VELOCITY[input.hood_type][dust_state];
  
  // 발암성·고독성 가산
  if (s1.dust.carcinogen || s1.dust.high_toxicity) {
    V_c *= 1.5;
  }
  
  // 안전계수
  const SF = input.safety_factor ?? 1.25;
  
  // 풍량 계산
  let Q_h: number;  // m³/min
  switch (input.hood_type) {
    case "enclosing":
      Q_h = 60 * input.open_area * V_c * SF;
      break;
    case "exterior_lateral":
    case "exterior_downward":
    case "exterior_upward":
      Q_h = 60 * V_c * (10 * input.X**2 + input.source_area) * SF;
      break;
    case "canopy":
      Q_h = 1.4 * input.source_perimeter * V_c * input.H * 60;
      break;
    case "receiving":
      Q_h = 1.5 * input.D**2 * V_c * 60;
      break;
    case "slot":
      Q_h = 60 * 3.7 * input.slot_length * input.X * V_c * SF;
      break;
    case "booth":
      Q_h = 60 * input.face_area * V_c * SF;
      break;
  }
  
  // 정압손실
  const V_duct_assumed = 18;  // m/s (Stage 3에서 재계산)
  const K_hood = HOOD_LOSS_COEFF[input.hood_type];
  const ρ = airDensity(s1.gas.T_in);
  const dP_hood = (1 + K_hood) * ρ * V_duct_assumed**2 / 2;
  
  return {
    hood: { type: input.hood_type, ...input },
    Q_hood: Q_h,
    V_c_applied: V_c,
    dP_hood,
    capture_velocity: V_c,
  };
}
```

## 다중 후드 (분기 시)

```typescript
// 여러 발산원이 있을 때 합산
const Q_total = sumOf(branchHoods.map(h => calcHood(h, s1).Q_hood));
```

## 검증 체크포인트

- V_c가 별표13 기준 미만일 시 경고
- 외부식 X (포집거리)가 D (발산원 등가직경)의 3배 초과 시 경고
- 캐노피 H가 1.5 m 이상 시 풍량 급증 → SF↑ 권고

## 단위테스트

```typescript
describe("Stage 2 — Hood", () => {
  it("포위형 — 광물 분쇄", () => {
    const r = calcHood({
      hood_type: "enclosing",
      open_area: 0.5,         // m²
      safety_factor: 1.25
    }, { dust: { particulate: true } });
    expect(r.Q_hood).toBeCloseTo(60 * 0.5 * 0.7 * 1.25, 1);  // 26.25 m³/min
  });
  
  it("캐노피 — 용해로", () => {
    const r = calcHood({
      hood_type: "canopy",
      source_perimeter: 2,    // m
      H: 1.0
    }, { dust: { particulate: true } });
    expect(r.Q_hood).toBeCloseTo(1.4 * 2 * 1.5 * 1.0 * 60, 0);
  });
});
```
