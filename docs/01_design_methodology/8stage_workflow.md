# 8단 위저드 워크플로우 — 상세

본 문서는 BLUEPRINT.md §1의 8단 위저드 흐름을 상세화한다. 각 Stage의 입력 폼·검증 규칙·출력 데이터 구조·UI 컴포넌트 매핑을 정의한다.

---

## Stage 1 — 분진/가스 성상 (Properties)

### 입력 필드
| 필드 | 타입 | 단위 | 디폴트 | 검증 |
|---|---|---|---|---|
| industry | enum | - | - | dust-types DB의 17 산업 중 |
| dust_name | string | - | - | dust-types DB lookup |
| d50, d90 | float | μm | - | 0.01 ≤ d50 ≤ 1000, d90 ≥ d50 |
| particle_density | float | kg/m³ | 2200 | 500~9000 |
| bulk_density | float | kg/m³ | 700 | 200~5000 |
| stickiness | enum | - | low | low/medium/high |
| flammable | bool | - | false | - |
| Kst | float | bar·m/s | - | flammable=true 시 필수 |
| MIE | float | mJ | - | flammable=true 시 필수 |
| MIT | float | °C | - | flammable=true 시 필수 |
| corrosive | enum | - | none | none/mild/severe |
| T_in | float | °C | 25 | -40~1500 |
| RH_in | float | % | 50 | 0~100 |
| O2 | float | %v | 21 | 0~21 |
| CO, HCl, SO2, NOx, Hg | float | ppm/μg/Nm³ | 0 | ≥0 |

### 자동 도출
- **분진폭발 등급(ST)**: Kst ≤ 200 → ST1, 200~300 → ST2, >300 → ST3
- **비저항 추정**: dust-types DB lookup (예: 비산회 10⁹~10¹², 시멘트 10¹⁰~10¹², 카본블랙 10² 등)
- **노점 추정**: H₂O·SO₃ 함량 → Verhoff-Banchero 식
- **처리방식 후보**: 가연성 → 사이클론+백+방폭 / 점착성·고온·산성 → 반건식·습식 / 일반 → 건식

### 출력 (다음 Stage 전달)
```typescript
type Stage1Output = {
  dust: { name, d50, d90, ρ_p, ρ_bulk, stickiness, flammable, Kst, MIE, MIT };
  gas: { T, RH, O2, CO, HCl, SO2, NOx, Hg, density };
  derived: {
    ST_class: "ST1"|"ST2"|"ST3"|null;
    resistivity_range: [low, high];
    dewpoint_acid: number;
    treatment_candidates: ("dry"|"wet"|"semi-dry")[];
  };
}
```

---

## Stage 2 — 후드 설계 (Hood)

### 입력
| 필드 | 타입 | 단위 | 디폴트 | 검증 |
|---|---|---|---|---|
| dust26_code | enum | - | - | 산안법 별표16 (1~26호) |
| hood_type | enum | - | enclosing | 8종: enclosing/exterior_lateral/exterior_downward/exterior_upward/canopy/receiving/slot/booth |
| source_area | float | m² | - | 0.01~100 |
| source_perimeter | float | m | - | canopy일 때 |
| capture_distance_X | float | m | 0 | 외부식 시 |
| hood_height_H | float | m | 1.0 | canopy 시 |
| open_area | float | m² | - | enclosing 시 |
| safety_factor | float | - | 1.25 | 1.0~2.0 |

### 자동 도출
- **제어풍속 V_c**: KOSHA 별표13에서 (작업종, 후드형식) → V_c (가스상 0.4~1.0, 입자상 0.5~1.5 m/s)
- **풍량 Q_h**: Stage 3에서 사용
  - 포위식: Q = 60 × A_o × V_c × SF
  - 외부식: Q = 60 × V_c × (10X² + A) × SF
  - 캐노피: Q = 1.4 × P × V_c × H
- **후드 정압손실**: ΔP_hood = (1 + K_hood) × V²ρ/2

### 출력
```typescript
type Stage2Output = {
  hood: { type, source_area, X, H, P, V_c_applied };
  Q_hood: number;        // m³/min
  dP_hood: number;       // Pa
  capture_velocity: number;  // KOSHA 적용값
}
```

---

## Stage 3 — 덕트 사이징 (Duct)

### 입력
| 필드 | 타입 | 단위 | 디폴트 | 검증 |
|---|---|---|---|---|
| branch_count | int | - | 1 | 1~50 |
| total_length | float | m | - | 0.1~1000 |
| transport_velocity | float | m/s | 18 | 6~25 (분진18~23, 흄8~10) |
| material | enum | - | SS400 | SS400/SUS304/SUS316L/FRP |
| roughness | float | mm | 0.046 | 자동 (재질별) |
| elbows | array | - | [] | {radius, angle, count} |
| transitions | array | - | [] | {ratio, type} |
| dampers | array | - | [] | {type, K} |
| sizing_method | enum | - | equal_velocity | equal_velocity / equal_friction / static_regain |

### 자동 도출
- **덕트 직경**: D = √(4Q/πV) → 표준 사이즈 round-up (KS B 6361)
- **Reynolds**: Re = ρVD/μ
- **마찰계수 f**: Colebrook 또는 Swamee-Jain
- **직선손실**: ΔP_s = f(L/D)·ρV²/2
- **국부손실**: Σ(K_i × ρV²/2) — 엘보·확대축소·T·댐퍼
- **합류 손실**: branch 합류 시 추가
- **총 덕트 정압**: Sum

### 출력
```typescript
type Stage3Output = {
  ducts: Array<{ id, D, L, V, dP_straight, dP_local }>;
  total: { dP_duct, Q_total, V_min, V_max };
  warnings: string[];  // 반송속도 미달 등
}
```

---

## Stage 4 — 처리방식 결정 (Treatment Branch)

### 입력
| 필드 | 타입 | 디폴트 | 검증 |
|---|---|---|---|
| target_efficiency | float | 99 | 50~99.99 % |
| target_emission | float | 30 | 1~50 mg/Sm³ |
| budget_class | enum | medium | low/medium/high |
| has_waste_heat_use | bool | false | - |
| water_available | bool | true | - |

### 결정트리 (의사코드)
```
if dust.flammable and dust.Kst > 0:
    if water_available and not concerned_emission:
        candidates = ["wet", "dry+explosion_protection"]
    else:
        candidates = ["dry+explosion_protection"]
elif dust.stickiness == "high" or dust.tar:
    candidates = ["wet", "semi-dry"]
elif gas.HCl > 50 or gas.SO2 > 100:
    candidates = ["semi-dry+SDA", "wet"]
elif gas.T_in > 400:
    candidates = ["dry+precool", "wet+quench"]
else:
    candidates = ["dry"]

return ranked(candidates, by=score(efficiency, capex, opex, water_use))
```

### 출력
```typescript
type Stage4Output = {
  treatment: "dry" | "wet" | "semi-dry";
  rationale: string;     // 사용자에게 보여줄 근거
  collector_candidates: CollectorType[];  // Stage 5로
}
```

---

## Stage 5 — 집진방식 선정 (Collector Selection)

6분기 탭 UI. 각 분기에서 세부 입력.

### 5-A 여과집진 (Bag/Cartridge)
| 필드 | 단위 | 디폴트 |
|---|---|---|
| filter_type | - | pulse_jet / reverse_air / shaker / cartridge |
| media | - | PE / 노멕스 / PPS / P84 / PTFE / 유리섬유 / 셀룰로오스 |
| AC_ratio | m/min | 1.2 (펄스제트 기준) |
| pulse_pressure | bar | 6 |
| dP_design | mmAq | 150 |

### 5-B 원심집진 (Cyclone)
| 필드 | 단위 | 디폴트 |
|---|---|---|
| cyclone_type | - | Stairmand_HE / Stairmand_HT / Lapple / Swift_HE / Swift_GP / Peterson |
| body_diameter D | mm | auto (V_i 18 m/s 만족) |
| count | - | 1 (멀티사이클론 시 자동) |
| series | - | single / double / multi |

### 5-C 전기집진 (EP)
| 필드 | 단위 | 디폴트 |
|---|---|---|
| ep_type | - | dry / wet |
| field_count | - | 3 |
| SCA | s/m | 80 (99% 효율 기준) |
| voltage | kV | 60 |
| rapper_type | - | mechanical / electromagnetic |

### 5-D 세정집진 (Scrubber)
| 필드 | 단위 | 디폴트 |
|---|---|---|
| scrubber_type | - | venturi / packed / spray / cyclonic |
| L/G_ratio | L/m³ | 1.0 |
| throat_velocity (벤추리) | m/s | 90 |
| dP_design | mbar | 50 |

### 5-E 중력집진, 5-F 관성집진 — 전처리 옵션만

### 출력
```typescript
type Stage5Output = {
  collector: { primary, secondary?, tertiary? };
  efficiency_overall: number;
  dP_collector: number;
  dimensions: object;
}
```

---

## Stage 6 — 응축기/HX 결정

### 결정트리
```
T_filter_limit = filter_media[selected_media].T_max
T_required_max = T_filter_limit - 30  // 마진

if T_in <= T_required_max + 10:
    condenser = None
elif gas.sticky or dust.tar:
    condenser = "Direct Quench"
elif T_in > 800:
    condenser = "Direct Quench"
elif T_in > 350 and has_waste_heat_use:
    condenser = "Shell&Tube WHB"
elif treatment == "wet+FGD":
    condenser = "GGH (regenerative)"
elif T_in < 200:
    condenser = "Plate (PHE)"
else:
    condenser = "Finned tube APH"

T_target = max(T_required_max, T_dewpoint_acid + 20)
```

### 출력
```typescript
type Stage6Output = {
  condenser_type: string | null;
  T_target: number;
  dP_hx: number;
  m_condensate: number;  // kg/h
  waste_heat_kW: number;
  ROI_yr: number;
  material: string;       // SUS316L/Hastelloy 등
}
```

---

## Stage 7 — 송풍기 배치

### 결정매트릭스
```
Q_total < 5000 m³/min and ΔP_total < 300 mmAq and points <= 5
  → "1 ID Fan"
Q < 50000 and ΔP < 600 and (points > 5 or treatment == "semi-dry")
  → "FD + ID balanced"
Q > 50000 or redundancy_required
  → f"{ceil(Q/30000)} parallel ID + 1 standby"
```

### 송풍기 형식 선정
```
if conc_in_collector > 10 or T > 300:
    fan_type = "Radial"
elif gas_after_collector_clean and ΔP > 400:
    fan_type = "Airfoil"
elif ΔP > 200:
    fan_type = "Turbo (Backward)"
elif Q < 500 and ΔP < 80:
    fan_type = "Sirocco"
else:
    fan_type = "Axial"
```

### VFD ROI
```
if load_variation > 20% and op_hours > 4000 and motor_kW >= 30:
    use_VFD = true
    payback_yr = C_VFD / (P_rated × LF × h × R_kWh × (1 - (N_avg/N_max)³))
```

### 출력
```typescript
type Stage7Output = {
  arrangement: "1ID" | "FD+ID" | "Nplus1";
  fans: Array<{ id, type, Q, dP, BHP, motor_kW, VFD: boolean }>;
  total_kW: number;
  annual_kWh: number;
}
```

---

## Stage 8 — 안전·법규 컴플라이언스

### 자동판정 12항목 (BLUEPRINT §5 참조)
1. 사업장 종별
2. 배출허용기준
3. TMS 의무
4. 비산먼지 신고
5. VOC 시설
6. 분진작업 26종 적용 + 의무
7. 별표13 제어풍속 적용값
8. 안전검사 도래일
9. 유해위험방지계획서
10. 작업환경측정 주기
11. 분진폭발 Zone + ST + 폭발벤트 면적
12. 보조금·융자 매칭

### 폭발벤트 면적 (NFPA 68)
```
A_v = α × V_vessel^(3/4) × (P_red − P_stat)^(−1/2)
       × (some Kst function)
```

### 출력
```typescript
type Stage8Output = {
  classification: { class_no, applicable_standards };
  obligations: Array<{ category, required, deadline, citation }>;
  explosion: { zone20_areas, zone21_areas, zone22_areas, vent_area_m2 };
  subsidies: Array<{ name, amount, deadline, agency, link }>;
  disclaimer: "본 자동평가는 참고용이며 법적 효력 없음. 전문가·관할기관 확인 필수.";
}
```

---

## Stage 9 — 산출물 생성

8단 출력을 종합한 **System Definition JSON**을 입력으로:

```typescript
type SystemDefinition = {
  meta: { project, date, designer, revision };
  stage1: Stage1Output;
  stage2: Stage2Output;
  // ... stage8
}
```

→ 다음 산출물 자동생성:
- **PFD/P&ID**: pid-generator.ts (System JSON → React Flow nodes)
- **3D 미리보기**: Plant3DViewer (R3F + glTF 어셈블리)
- **단면도/배치도**: Konva (Stage5/7 dimensions)
- **DXF**: dxf-export.ts (Konva 좌표 → DXF entities)
- **PDF 보고서 12페이지**: react-pdf
  - p1 표지·요약
  - p2 분진성상
  - p3 후드설계
  - p4 덕트 계산서
  - p5 처리방식·집진방식 결정 근거
  - p6 집진기 사양
  - p7 응축기·HX
  - p8 송풍기 사양
  - p9 안전·분진폭발
  - p10 법규 컴플라이언스
  - p11 BOM
  - p12 5년 TCO + ESG
- **BOM 엑셀**: xlsx (장비·자재·계장 수량집계)
- **5년 TCO**: Recharts (CAPEX + OPEX 시뮬레이션)
