# 백필터/카트리지 설계

## A/C ratio (Air-to-Cloth Ratio)

```
A/C = Q / A_filter  [m/min]
```
실질적으로 **여과면 통과속도(face velocity)**.

| 청소방식 | A/C (m/min) | 적용 |
|---|---|---|
| 펄스제트 (일반산업) | 1.2~1.5 | 표준 |
| 펄스제트 (시멘트) | 0.6~0.9 | 점착성 |
| 펄스제트 (용접흄) | 0.45~0.75 | 미세 |
| 리버스에어 | 0.3~0.6 | 발전소 비산회 |
| 셰이커 | 0.5~1.0 | 노화기술 |
| 카트리지 | 0.5~2.0 | 저~중부하 |

## ΔP 모델

```
ΔP_total = ΔP_clean + ΔP_dust
ΔP_dust = K_2 × C_inlet × V × t        (Darcy 변형)
```
- K_2 = 분진 케이크 저항계수
- C_inlet = 입구 분진농도 (kg/m³)
- V = A/C ratio (m/s)
- t = 청소주기 (s)

| 상태 | ΔP (mmAq) |
|---|---|
| Clean | 30~50 |
| 정상운전 | 100~150 |
| 청소 트리거 | 150~200 |
| 위험 (교체검토) | >250 |

## 여재 12종 + 온도한계

| 매체 | 연속(°C) | 피크(°C) | 산저항 | 알칼리 | 가수분해 | 가격 |
|---|---|---|---|---|---|---|
| 폴리에스터(PET) | 130 | 150 | 中 | 弱 | 中 | ★ |
| 폴리프로필렌(PP) | 90 | 100 | 高 | 高 | 高 | ★ |
| 아크릴 | 125 | 140 | 中 | 中 | 中 | ★★ |
| 노멕스/아라미드 | 200 | 220 | 中 | 中 | 中 | ★★★ |
| PPS (Ryton) | 190 | 210 | 高 | 高 | 高 | ★★★ |
| P84 (폴리이미드) | 240 | 260 | 高 | 中 | 中 | ★★★★ |
| PTFE (Teflon) | 260 | 280 | 매우高 | 매우高 | 매우高 | ★★★★★ |
| 유리섬유 | 260 | 290 | 中 | 中 | 中 | ★★ |
| 세라믹 | 400~600 | 700 | 高 | 高 | 高 | ★★★★★ |
| 금속섬유 (SS316) | 400~600 | 800 | 中 | 中 | 高 | ★★★★ |
| 셀룰로오스 | 60 | 80 | 弱 | 弱 | 弱 | ★ (카트리지) |
| ePTFE 막 | 260 | 280 | 매우高 | 매우高 | 매우高 | ★★★★★ |

## 펄스제트 시퀀스

```
타이머(Sequencer)
  ↓
솔레노이드 OPEN (10~50 ms)
  ↓
다이아프램 작동 → 6 bar 공기 분사
  ↓
백 진동·역세 → 케이크 탈리
  ↓
ΔP 회복 확인 (또는 시간만료)
  ↓
다음 챔버
```
- 청소 인터벌: ΔP 트리거 또는 시간 (10~30 분)
- 펄스 주기: 1~5 초 (전체 백 1주기 = 청소시간/백수)

## 코드 매핑 (lib/calc/dust/05-bag.ts)

```typescript
export function designBaghouse(input: {
  Q_m3min: number;
  inlet_conc_g_m3: number;
  T_in_C: number;
  filter_type: "pulse_jet" | "reverse_air" | "shaker" | "cartridge";
  recommend_media?: boolean;
  industry?: string;
}): {
  AC_ratio: number;
  A_total_m2: number;
  bag_count: number;
  bag_dimensions: {D_m: number, L_m: number};
  media_recommended: FilterMedia;
  dP_clean: number;
  dP_design: number;
  cleaning_interval_min: number;
  warnings: string[];
} {
  // A/C 결정
  const AC_table = {
    pulse_jet: { default: 1.2, sticky: 0.7, fume: 0.6 },
    reverse_air: { default: 0.5 },
    shaker: { default: 0.7 },
    cartridge: { default: 1.0 },
  };
  const AC = pickAC(AC_table, input);
  
  // 여재 추천
  const media = recommendMedia(input.T_in_C, input.gas_chemistry);
  // T 130 폴리에스터, 200 노멕스, 240 P84, 260 PTFE/유리섬유
  
  // 면적
  const A_total = (input.Q_m3min) / AC;  // m²
  
  // 백 수 (직경 160 mm, 길이 6 m 기준 1개 ≈ 3.0 m²)
  const A_per_bag = Math.PI * 0.160 * 6.0;  // 3.02 m²
  const bag_count = Math.ceil(A_total / A_per_bag);
  
  // ΔP
  const V_face = AC / 60;  // m/s
  const dP_clean = 50 * 9.81;  // 50 mmAq → Pa
  const K2 = 1e10;  // 분진별 보정 필요
  const t_clean_s = 1200;
  const dP_dust = K2 * (input.inlet_conc_g_m3/1000) * V_face * t_clean_s;
  const dP_design = dP_clean + dP_dust;
  
  return { AC_ratio: AC, A_total_m2: A_total, bag_count, ... };
}
```

## 검증 체크포인트
- A/C가 권장범위 내인가
- 여재 온도한계 ≥ T_in + 30°C 마진
- 산성가스(SO₃/HCl) 시 PTFE/PPS/P84 권장
- 알칼리(NaOH/NH₃) 시 PP/유리섬유 비추천
- ΔP_design < 200 mmAq
- 폭발성 분진 + ER 벤트 면적 NFPA68 자동 계산
