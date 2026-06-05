# 전기집진기 (EP/WESP) 설계

## 건식 EP vs 습식 WESP

| 항목 | 건식 EP | 습식 WESP |
|---|---|---|
| 분진 비저항 | 10⁴~10¹¹ Ω·cm | 제한 없음 |
| 백코로나 | 10¹¹↑ 발생 | 없음 |
| 가스조건 | 건조, 250~450°C | 포화가스, <90°C |
| 효율 | 99.5% | 99.9%+ (서브미크론) |
| 폐수 | 없음 | 발생 (블로다운 처리) |
| CAPEX | 높음 | 매우 높음 |

## 핵심 식

### Deutsch-Anderson
```
η = 1 − exp(−A·w / Q)
```
- A = 집진면적 (m²)
- w = 드리프트 속도 (m/s)
- Q = 풍량 (m³/s)

### Modified Deutsch-Matts (실측 보정)
```
η = 1 − exp[−(A·w_k / Q)^k]
```
- k ≈ 0.4~0.7 (실제 분포·재비산 반영)

### SCA (Specific Collecting Area)
```
SCA = A / Q  [m² / (m³/s)]
```
| 효율 목표 | SCA 권장 |
|---|---|
| 99% | 50~80 |
| 99.5% | 80~120 |
| 99.9% | 100~200 |

## 드리프트 속도 w 가이드

| 분진 | w (m/s) |
|---|---|
| 비산회 일반 | 0.05~0.15 |
| 시멘트킬른 | 0.06~0.08 |
| 펄프블랙리큐어 | 0.10~0.20 |
| 카본블랙 | 0.05~0.10 |
| 알루미나(낮은 비저항) | 0.20~0.30 |

## 전기조건

| 항목 | 범위 |
|---|---|
| 인가전압 | 30~75 kV (DC pulsating) |
| 전류밀도 | 0.1~0.5 mA/m² |
| 코로나 파워밀도 | 10~50 W/m² (집진면 기준) |

## 대전 메커니즘

| 메커니즘 | 지배 입경 | 식 |
|---|---|---|
| 전계대전 (Field charging) | >0.5 μm | q ∝ d² |
| 확산대전 (Diffusion charging) | <0.2 μm | q ∝ d |
| Greenfield gap | 0.2~0.5 μm | 효율 최저 |

## 비저항 영향 표

| 비저항 ρ (Ω·cm) | 거동 | 대응 |
|---|---|---|
| <10⁴ | 재비산(back mixing) | 전압↓, 베플·랩핑 강화 |
| 10⁴~10¹⁰ | 정상 | 표준 설계 |
| 10¹⁰~10¹¹ | 한계 | 펄스 에너자이제이션 |
| >10¹¹ | 백코로나 | SO₃/NH₃ 컨디셔닝, 가습, 온도조정, WESP 전환 |

## 코드 매핑 (lib/calc/dust/05-ep.ts)

```typescript
export function designEP(input: {
  Q_m3s: number;
  target_efficiency: number;
  dust_resistivity: number;       // Ω·cm
  particle_dist: PSD;
  ep_type: "dry" | "wet";
}): {
  SCA: number;                    // m²/(m³/s)
  A_total_m2: number;
  field_count: number;
  drift_velocity_used: number;
  conditioning_required: boolean;
  warnings: string[];
} {
  const ρ = input.dust_resistivity;
  let w = lookupDriftVelocity(input.dust_type);
  const warnings: string[] = [];

  // 비저항 보정
  if (ρ < 1e4) {
    warnings.push("재비산 위험 (비저항 낮음)");
    w *= 0.7;
  } else if (ρ >= 1e11) {
    if (input.ep_type === "dry") {
      warnings.push("백코로나 발생 위험. SO₃/NH₃ 컨디셔닝 또는 WESP 전환 권장");
      w *= 0.5;
    }
  } else if (ρ >= 1e10) {
    warnings.push("펄스 에너자이제이션 권장");
    w *= 0.8;
  }

  // SCA from target efficiency (Deutsch 역식)
  // η = 1 − exp(−SCA·w)  →  SCA = −ln(1−η) / w
  const SCA = -Math.log(1 - input.target_efficiency/100) / w;
  const A_total = SCA * input.Q_m3s;

  // 필드 수 (한 필드당 ~30 m² 가정, 대형은 더 큼)
  const A_per_field = 30;
  const field_count = Math.max(2, Math.ceil(A_total / A_per_field));

  // Modified Deutsch-Matts로 효율 재검증
  const k = 0.5;
  const η_modified = 1 - Math.exp(-Math.pow(SCA * w, k));
  if (η_modified < input.target_efficiency/100 * 0.9) {
    warnings.push(`Modified Deutsch-Matts 적용 시 효율 ${(η_modified*100).toFixed(1)}% — SCA 증가 권장`);
  }

  return {
    SCA, A_total_m2: A_total, field_count,
    drift_velocity_used: w,
    conditioning_required: ρ >= 1e10,
    warnings,
  };
}
```

## 검증 체크포인트
- SCA ≥ 80 (99% 목표) — 미달 시 경고
- 비저항 >10¹¹ + dry EP → 강한 경고 + WESP 전환 제안
- 필드 수 ≥ 2 (단일 필드 비추천)
- 출구 온도 > T_dewpoint + 20°C (산응축 방지)
- 가스 속도 ≤ 1.5 m/s (재비산 방지)
