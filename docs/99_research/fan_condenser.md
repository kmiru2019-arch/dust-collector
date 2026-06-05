# 리서치 — 송풍기·응축기·열교환기 (원본)

조사일: 2026-05-07
정제: docs/02_collector_matrix/scrubber_design.md + docs/05_calc_engine/06,07

## 1. 송풍기 1팬 vs 2팬 매트릭스

| 입력값 | 1팬(ID) | 2팬(FD+ID) | 다팬 병렬 |
|---|---|---|---|
| Q (m³/min) <500 | ◎ | × | × |
| 500~5,000 | ◎ | △ | × |
| 5,000~50,000 | ○ | ◎ | ○ |
| >50,000 | × | ○ | ◎ |
| ΔP <100 mmAq | ◎ | × | △ |
| 100~300 | ◎ | ○ | △ |
| 300~600 | △ | ◎ | ○ |
| >600 | × | ◎ | ◎ |
| 덕트 <50 m | ◎ | × | × |
| 50~200 m | ○ | ◎ | △ |
| >200 m | × | ◎ | ◎ |
| 흡인지점 1 | ◎ | × | × |
| 2~5 | ○ | ◎ | △ |
| 6~20 | △ | ◎ | ○ |
| >20 | × | ○ | ◎ |
| 운전 200~400°C | ○(고온) | ◎ | ○ |
| >400°C | △ | ◎(Quench 후) | △ |
| 시스템 단순 | ◎ | × | × |
| 다지점 | ○ | ◎ | △ |
| SDA+백+활성탄 | △ | ◎ | ○ |
| FGD | × | ◎ | ◎ |

## 2. 송풍기 배치 4유형

### ① ID Fan only (Pull-Through, 표준)
[후드]→[덕트]→[전처리]→[집진기]→[ID FAN]→[Stack]
음압운전. 누설 시 외기 유입. 케이싱 부압 보강 필요.

### ② FD Fan only (Push-Through, 비표준)
[후드]→[FD FAN]→[덕트]→[집진기]→[Stack]
양압운전. 누설 시 분진 비산. 단거리·청정공기·공압수송.

### ③ FD + ID 직렬 (Balanced Draft)
[후드]→[FD FAN]→[Quench/SDA]→[Bag]→[활성탄]→[ID FAN]→[Stack]
균압점(0 mmAq)을 집진기 부근. 고정압(>600 mmAq) 유리. FGD/SDA 표준.

### ④ Multiple ID Fans 병렬 (N+1)
[집진기]→[공통덕트]→[ID×N+1대]→[Stack]
대용량(>50,000 m³/min) 한계극복. 정비 무정지. 서지·헌팅 주의 + 역류방지댐퍼.

## 3. 송풍기 5형식

| 형식 | Q | ΔP | η | 분진 | 가격 | 적용 |
|---|---|---|---|---|---|---|
| 터보 BC | 100~10,000 | 100~500 mmAq | 70~80% | 中 | 中 | 일반 EP·백 후단 |
| 시로코 FC | <500 | <80 | 55~65% | 低 | 低 | 소형 환기 |
| Radial | 50~5,000 | 200~800 | 60~65% | 高 | 中 | 고분진·고온, FD |
| 익형 (Airfoil) | 1,000~100,000 | 100~600 | 80~88% | 低 (중공) | 高 | 청정·FGD |
| 축류 | 1,000~50,000 | <100 | 70~85% | 低 | 中 | 저정압대풍량 |

## 4. VFD ROI

### 어피니티 법칙
P ∝ N³. 속도 80% → 동력 51.2% (절감 48.8%).

### ROI 식
Payback[yr] = C_VFD / [P_rated × LF_avg × h × R_kWh × (1 - (N_avg/N_max)³)]

### 권장조건
- 부하변동 ±20% 이상
- 운전시간 >4,000 h/yr
- 모터 ≥30 kW
- 일반 산업 1.5~2년 회수

### 댐퍼 vs VFD
댐퍼는 50% 폐쇄 시 60~70% 동력 소비 → 비효율.
대형(>500 kW) VFD: 6펄스→12/18펄스 고조파 대책.

## 5. 동력 식

```
BHP[kW] = Q[m³/s] × ΔP_total[Pa] / (1000 × η_fan × η_drive × η_motor)
ΔP_total = ΔP_hood + ΔP_duct + ΔP_fitting + ΔP_collector + ΔP_stack + Margin
Q_design = Q_oper × (T_oper+273)/(T_std+273)
```

안전여유: 정압 +15~25%, 풍량 +5~10%, 동력 +20~30%.
백필터 ΔP는 클린 대비 2~3배(8~12 inWG)로 증가 → 카탈로그 클린값 사용 시 미니 사이즈 위험.

## 6. 응축기 / HX 결정트리

```
IF T_in > 후단여재한계 + 30:
    냉각필요
IF gas.sticky or dust.tar:
    Direct Quench
IF T_in > 800:
    Direct Quench
IF T_in > 350 and 폐열활용:
    Shell&Tube WHB + ROI 평가
IF treatment == "wet+FGD":
    GGH (재가열)
IF T_in < 200:
    Plate (PHE)
ELSE:
    Finned tube APH

T_target = max(T_required_max, T_dewpoint_acid + 20)
```

## 7. 응축기 5형식 비교

| 형식 | T_max | η | 청소 | 분진 | 가격 | 집진플랜트 적용 |
|---|---|---|---|---|---|---|
| 판형(PHE) | <200°C 권장 | 高 | 高 | 막힘취약 | 中 | 폐열회수, 청정가스측 |
| Shell&Tube | <500°C | 中 | 中 | 中 | 中 | 표준 폐열보일러 |
| 핀튜브 이코노마이저 | <400°C | 中 | 低 | 低 | 低 | APH, 청정측 |
| 공냉(ACHE) | <300°C | 中低 | 中 | 中 | 中 | 수자원 부족 지역 |
| Quench tower | 800→200°C | 高 (즉시) | 자가세척 | 매우 우수 | 低 | 소각·제련 |

## 8. 노점 회피

### 황산노점 (Verhoff & Banchero)
1000/T_dp = 2.276 - 0.0294·ln(P_H2O) - 0.0858·ln(P_H2SO4) + 0.0062·ln(P_H2O × P_H2SO4)

대표값: 석탄/중유 110~150°C. SO₃ 10 ppm → ~138°C.

### 룰
- 운전온도 ≥ T_dp + 20°C (강한 마진)
- 케이싱·덕트 보온 두께 50~100 mm 미네랄울
- 시동 시 보조히터·N₂ 퍼지로 콜드스팟 응축 방지
- 정지 시 트레이스 히팅
- 저온부 재질: SS400 → SUS316L → Hastelloy C-276/AL-6XN

## 9. 응축수량

```
m_cond [kg/h] = Q_dry × (W_in - W_out) × 0.804
W = 0.622 × P_sat / (P - P_sat)
```

응축수 pH 1~3, 중금속 함유 → SUS316L 라이닝 + 폐수처리(중화·침전·활성탄)

## 10. 폐열회수 옵션

- **GGH** (가스-가스): FGD 입구 130→90°C, 출구 50→80°C 재가열, 굴뚝 백연·산응축 방지. 누설 0.5~1%, 차압 100~200 mmAq.
- **가스-수 (폐열보일러)**: 350°C 이상 → LP스팀. T_out > 산노점 + 20°C 제약.
- **가스-공기 (APH)**: 보일러 1차연소공기 예열, 효율 +3~5%pt.

ROI: ROI[yr] = C_HE / (Q × ρ × Cp × ΔT × h × R_energy × 3600)

## 출처

- [AirPro Baghouse Fan Efficiency](https://blog.airprofan.com/baghouse-fan-efficiency-for-dust-collectors/)
- [AirPro ID Fans](https://blog.airprofan.com/application-overview-induced-draft-fans-id-fans/)
- [AirPro FD Fans](https://blog.airprofan.com/fd-fans-forced-draft-blowers/)
- [Fans and Blowers ID & FD Working Principle](https://fansandblowers.com/news/What-is-ID-FD-Fan)
- [Baghouse.com System Design Variables](https://baghouse.com/the-four-key-baghouse-system-design-variables-part-2-of-design-guide/)
- [CED Engineering Baghouse Sizing](https://www.cedengineering.com/userfiles/Design%20and%20Sizing%20of%20Baghouse%20Dust%20Collectors.pdf)
- [ACT Fan Type Selection](https://www.actdustcollectors.com/blog/what-type-of-fan-should-i-be-considering-for-my-dust-collection-system)
- [Hartzell Centrifugal Fan Guide](https://hartzellairmovement.com/blog/how-to-choose-the-right-centrifugal-fans-for-maximum-performance/)
- [Citizendium Acid dew point](https://en.citizendium.org/wiki/Acid_dew_point)
- [HeatMatrix Acid Dew Point Calc](https://heatmatrixgroup.com/knowledge-center/how-to-calculate-the-acid-dew-point-adp-of-flue-gas/)
- [OGJ Verhoff Sulfuric Acid Dewpoints](https://www.ogj.com/drilling-production/production-operations/article/17221374/new-correlation-predicts-flue-gas-sulfuric-acid-dewpoints)
- [Inverter Drive Cube Law](https://www.inverterdrivesystems.com/cube-law/)
- [VFD vs Damper](http://www.variablefrequencydrive.org/vfd-vs-damper-for-fans)
- [Mitsubishi GGH](https://power.mhi.com/products/aqcs/lineup/ggh)
- [Ljungström FGD GGH](https://www.ljungstrom.com/fgd-gas-gas-heaters/)
- [Power Magazine Flue Gas Heat Recovery](https://www.powermag.com/power-101-flue-gas-heat-recovery-in-power-plants-part-iii/)
- [Turnbull&Scott Heat Exchanger Types](https://www.turnbull-scott.co.uk/about-us/types-of-heat-exchanger/)
- [Engineering Toolbox Fan Power](https://www.engineeringtoolbox.com/fans-efficiency-power-consumption-d_197.html)
- [Intensiv-Filter Pressure Drop](https://www.intensiv-filter-himenviro.com/blogs/high-pressure-drop-and-low-airflow-in-dust-collectors/)
