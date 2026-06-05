# 세정집진 (Scrubber) 설계 — 습식·반건식

## 4종 형식

| 형식 | ΔP (mmAq) | L/G (L/m³) | 효율 | 적용 |
|---|---|---|---|---|
| 벤추리 (가변throat) | 300~2500 | 0.5~3.0 | PM2.5 95%+ | 점착성·미스트·고효율 |
| 패킹베드 | 50~250 | 1.5~5.0 | 가스흡수 우수 | SO₂·HCl·NH₃ 흡수 |
| 스프레이타워 | 30~150 | 2.0~8.0 | PM>5μm 90% | 저저항 1차 처리 |
| 사이클로닉 (이류체) | 80~250 | 1.0~3.0 | PM>3μm 95% | 벤추리 후단 액분리 |

## 벤추리 설계 식

### 압력손실 (Calvert)
```
ΔP = 1.03e-3 × V_throat² × L/G
```
- V_throat = 목 속도 (m/s, 60~150 권장)
- L/G = 액가스비 (L/m³)
- ΔP (Pa)

### 효율 (Yung)
```
η(d) = 1 − exp(−4·B·d²·V_throat / d_drop / 9·μ_g)
```
- d = 입자직경 (m)
- d_drop = 액적직경 (m, Nukiyama-Tanasawa)
- B = 관성충돌 파라미터

### 액적크기 (Nukiyama-Tanasawa)
```
d_drop = 16400/V_relative + 1.45×(L/G)^1.5  [μm]
```

## 패킹베드 (가스흡수)

### NTU·HTU 방식
```
N_OG = ∫ dY / (Y − Y*)         [전달단위수]
HOG = G / (K_G·a·P)            [전달단위높이]
Z = N_OG × HOG                  [충전높이]
```

### Onda 상관식 (K_G·a 추정)
- 패킹 종류별 (Pall, Raschig, Berl Saddle, 구조화패킹)
- 가스속도·액속도·물성 변수

## SDA (Spray Dryer Absorber, 반건식)

### 원리
- 소석회 슬러리 Ca(OH)₂ 분무 → 산성가스(HCl, SO₂) 중화 → 잔수 즉시 증발
- 출구 = 백필터 입구 → 잔여 흡수 + 미반응 흡수제 회수
- 폐수 無 (반건식 핵심)

### 화학식
```
Ca(OH)₂ + SO₂ → CaSO₃·½H₂O
Ca(OH)₂ + 2HCl → CaCl₂ + 2H₂O
```

### 설계 변수
- Approach to saturation: T_out − T_sat = 20~30°F (11~17°C)
- Stoichiometric ratio: Ca/S = 1.4~2.0 (잉여)
- Retention time: 8~12 초 (분무→완전증발)
- Atomizer: rotary (디스크 6000~15000 rpm) 또는 dual-fluid nozzle

### 활성탄 주입 (Hg/Dioxin)
- PAC(분말활성탄) 50~200 mg/Nm³
- 백필터 케이크에서 흡착 → 필터 슬러지 폐기

## 코드 매핑 (lib/calc/dust/05-scrubber.ts)

```typescript
type ScrubberType = "venturi" | "packed" | "spray" | "cyclonic" | "sda";

export function designScrubber(input: {
  type: ScrubberType;
  Q_m3s: number;
  inlet_conc: number;
  particle_dist: PSD;
  gas_chemistry: { SO2, HCl, NH3 };
  target_efficiency: number;
}): {
  L_G_ratio: number;
  dP_Pa: number;
  efficiency_overall: number;
  water_consumption_m3h: number;
  wastewater_m3h: number;
  reagent_consumption?: number;  // SDA: kg/h Ca(OH)₂
  warnings: string[];
} {
  if (input.type === "venturi") {
    const V_throat = pickThroatVelocity(input.target_efficiency);  // 60~150 m/s
    const L_G = pickLG(input.target_efficiency);
    const dP = 1.03e-3 * V_throat**2 * L_G * 9.81;  // Pa
    const η = calvertYungEfficiency(input.particle_dist, V_throat, L_G);
    return { L_G_ratio: L_G, dP_Pa: dP, efficiency_overall: η, ... };
  }
  if (input.type === "sda") {
    const Ca_S = 1.6;
    const reagent = (input.gas_chemistry.SO2_kgh / 64) * Ca_S * 74;  // kg/h
    const approach = 15;  // K
    const retention_s = 10;
    return { reagent_consumption: reagent, ... };
  }
  // ...
}
```

## 미스트 엘리미네이터 (Mist Eliminator)

| 형식 | 효율 | dP |
|---|---|---|
| 셰브론 (chevron) | 99% @ 27μm | 100~250 Pa |
| 메쉬패드 (mesh pad) | 99% @ 5μm | 50~150 Pa |
| 베인팩 | 99% @ 10μm | 80~200 Pa |
| 사이클로닉 | 99% @ 100μm | 200~500 Pa |

## 검증 체크포인트
- L/G 과다 → 폐수 부담
- 벤추리 V_throat 60~150 m/s
- 출구 미스트엘리미네이터 필수
- 폐수 pH·중금속 → 처리계 연계
- 부식 → 재질(FRP, SS316L, Hastelloy)
