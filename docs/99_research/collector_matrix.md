# 리서치 — 집진방식 매트릭스 (원본)

조사일: 2026-05-07
정제: docs/02_collector_matrix/

## A. 6대 집진방식 × 3대 처리방식 매트릭스

### A-1. 핵심 성능표

| 방식 | 처리 | 적용 입경(주효율) | 분진농도(g/Nm³) | 온도 한계 | 효율 PM10/PM2.5/PM1 | ΔP (mmAq) | 풍량(m³/min) | CAPEX/OPEX |
|---|---|---|---|---|---|---|---|---|
| 여과 백필터(Pulse-jet) | 건식 | >0.3 μm | 1~50 | PTFE 260, P84 240, 유리섬유 260, 노멕스 200, PE 130 | 99.9/99.5/99 | 100~200 | 50~5000 | ★★★/★★★ |
| 여과 백필터(Reverse-air) | 건식 | >1 μm | 1~30 | 동일 | 99/98/95 | 80~150 | 200~10000 | ★★★/★★ |
| 카트리지 | 건식 | >0.3 (HEPA급) | <5 | ≤80 | 99.99/99.9/99 | 100~150 | 10~500 | ★★/★★ |
| 사이클론(Stairmand HE) | 건식 | >5 μm | 1~200 | 400+ | 90/50~70/<30 | 80~150 | 20~3000 | ★/★ |
| 멀티사이클론 | 건식 | >3~5 μm | 1~200 | 동일 | 92~95/70/40 | 100~150 | 100~10000 | ★★/★ |
| 건식 EP | 건식 | 0.1~10 μm | 1~50 | 250~450 (특수 850) | 99.5/99/98 | 10~25 | 1000~50000 | ★★★★★/★★ |
| 습식 WESP | 습식 | 0.01~5 μm | <5 | <90 (포화) | 99.9/99.9/99 | 20~40 | 500~30000 | ★★★★★/★★★ |
| 벤추리 스크러버 | 습식 | 0.5~5 μm | 1~100 | 가스포화까지 | 99/95/70~95 | 300~2500 | 50~3000 | ★★/★★★★ |
| 패킹·스프레이 | 습식 | >5 μm + 가스흡수 | <10 | <80 | 90/60/30 | 50~250 | 100~5000 | ★★/★★★ |
| 반건식 SDA | 반건식 | + 백필터 시 PM 1μm까지 | 1~10 | 입구 150~250 → 출구 포화+20~30°F | (조합) | 150~300 | 1000~100000 | ★★★★/★★★ |
| 중력집진 | 건식 | >40~50 μm | <50 | >500 | 50/<10/0 | 10~30 | 전처리 | ★/★ |
| 관성집진 | 건식 | >10~20 μm | <20 | 350 이하 | 70/30/10 | 30~80 | 50~2000 | ★/★ |

### A-2. 적용 가이드

| 분진 특성 | 1순위 | 2순위 | 비추천 |
|---|---|---|---|
| 점착성/조해성 | 습식, WESP | 반건식+백 | 건식EP, 카트리지 |
| 폭발성 (목분/곡분/Al/Mg) | 사이클론+백+방폭 | 습식 | 건식EP |
| 가연성/유증기 | 습식(벤추리) | WESP | 건식 모든 |
| 부식성 (HCl/SO₃) | SDA+백, 습식 | WESP, FRP/SS316L | 일반탄소강백 |
| 고온 (>250°C) | 사이클론, EP, 유리섬유백 | - | PE/노멕스백 |
| 고비저항 분진 (>10¹¹) | WESP, SDA+백 | EP+컨디셔닝 | 단순 건식EP |

## B. 사이클론 6종 표준비율

| 비율 | Stairmand HE | Stairmand HT | Lapple | Swift HE | Swift GP | Peterson |
|---|---|---|---|---|---|---|
| a/D | 0.50 | 0.75 | 0.50 | 0.44 | 0.50 | 0.583 |
| b/D | 0.20 | 0.375 | 0.25 | 0.21 | 0.25 | 0.208 |
| De/D | 0.50 | 0.75 | 0.50 | 0.40 | 0.50 | 0.50 |
| S/D | 0.50 | 0.875 | 0.625 | 0.50 | 0.60 | 0.583 |
| h/D | 1.50 | 1.50 | 2.00 | 1.40 | 1.75 | 1.333 |
| H/D | 4.00 | 4.00 | 4.00 | 3.90 | 3.75 | 3.917 |
| B/D | 0.375 | 0.375 | 0.25 | 0.40 | 0.40 | 0.50 |
| K_NH | 6.4 | 7.5 | 8.0 | 9.24 | 8.0 | 7.0 |

### 식

- ΔP = K · ρ_g · V_i² / 2 (Shepherd-Lapple)
- d_50 = √[9μb / (2π·N_e·V_i·(ρ_p - ρ_g))] (Lapple)
- η(d) = 1/[1+(d_50/d)²] (Lapple) 또는 1-exp[-(d/d_50)^n] (Rosin-Rammler)
- N_e = 5~10 (Lapple 표준 5)

## C. 전기집진기

### Deutsch-Anderson
- η = 1 − exp(−A·w/Q)
- SCA = A/Q [m²/(m³/s)]; 99% 효율 시 50~80, 99.9% 시 100~200

### Modified Deutsch-Matts
- η = 1 − exp[−(A·w_k/Q)^k] (k=0.4~0.7)

### 드리프트 속도 가이드
| 분진 | w (m/s) |
|---|---|
| 비산회 | 0.05~0.15 |
| 시멘트킬른 | 0.06~0.08 |
| 펄프블랙리큐어 | 0.10~0.20 |

### 비저항 영향
| ρ (Ω·cm) | 거동 | 대응 |
|---|---|---|
| <10⁴ | 재비산 | 전압↓ |
| 10⁴~10¹⁰ | 정상 | 표준 |
| >10¹¹ | 백코로나 | 컨디셔닝/WESP |

## D. 응축기 5형식

| 형식 | 적용 T | η | 청소 | 분진 | 적용 |
|---|---|---|---|---|---|
| 판형(PHE) | <200 | 高 | 高 | 막힘 | 폐열회수, 청정가스측 |
| Shell&Tube | <500 | 中 | 中 | 中 | 표준 |
| 핀튜브 | <500 | 中 | 低 | 低 | APH |
| 공냉 | <300 | 中低 | 中 | 中 | 후단냉각 |
| Quench (직접) | 임의 | 高 | N/A | 高 | >800°C 후방 |

### 노점 식 (Verhoff-Banchero)
1000/T_dp = 2.276 - 0.0294·ln(P_H2O) - 0.0858·ln(P_H2SO4) + 0.0062·ln(P_H2O × P_H2SO4)

## E. 송풍기 배치

### 1팬 vs 2팬 매트릭스 (요약)
- Q < 5,000 m³/min · ΔP < 300 mmAq · 단순 → **1 ID Fan**
- Q < 50,000 · ΔP < 600 · 다지점·SDA·장거리 → **FD+ID balanced**
- Q > 50,000 · 대형/이중화 → **N+1 parallel**

### 5형식 적용
| 형식 | 압력대 | 풍량대 | η | 분진 | 적용 |
|---|---|---|---|---|---|
| 터보 BC | 고정압 | 중 | 80~85% | 청정 | 일반 ID |
| 시로코 | 저 | 대 | 60~70% | 약 | HVAC |
| Radial | 중 | 소중 | 60~68% | 매우강 | 분진가스, FD |
| 익형 | 고 | 대 | 85~90% | 약 | 청정·FGD 후단 |
| 축류 | 저 | 매우대 | 70~80% | 약 | 환기 |

## F. 산업별 표준조합 17개

(docs/02_collector_matrix/industry_standards.md 참조)

## 출처

- [Choosing a Collector — DustCollectorHQ](https://blog.dustcollectorhq.com/choosing-a-collector-when-to-use-a-baghouse-cartridge-collector-a-cyclone-or-a-wet-scrubber)
- [Cyclone Performance and Design](https://www.academia.edu/14779416/CYCLONE_PERFORMANCE_AND_DESIGN)
- [Stairmand Cyclone Geometry](https://www.researchgate.net/figure/Standard-Cyclone-dimension-as-per-stairmand-a-high-efficiency-b-high-gas-rate-cyclone_fig3_269839011)
- [Lapple Cyclone — Penn State](https://www.me.psu.edu/cimbala/me433/Lesson_Notes/ME433_Lesson_12_B_Lapple_Cyclones.pdf)
- [EPA Lesson 3 — ESP](https://ppcair.com/pdf/EPA%20Lesson%20Lesson%203%20-%20ESP%20Parameters%20and%20Efficiency.pdf)
- [Modified Deutsch-Anderson](https://pdfs.semanticscholar.org/43b2/dc0beaf0a888738e0acf9ba1c7127ec2253f.pdf)
- [Wet vs Dry ESP](https://ppcair.com/products-services/electrostatic-precipitation/wet-or-dry-which-esp-should-i-choose)
- [ANDRITZ Spray Dryer Absorber](https://www.andritz.com/products-en/environmental-solutions/clean-air-technologies/combined-flue-gas-cleaning/spray-dryer-absorber)
- [B&W SDA](https://www.babcock.com/home/products/spray-dryer-absorber-sda)
- [Acid Dewpoint — David N French](https://www.davidnfrench.com/Dot_page.asp?Dotid=112)
- [Forced vs Induced Draft — AirPro](https://blog.airprofan.com/forced-draft-versus-induced-draft/)
- [Cement Plant Baghouses](https://baghouse.com/cement-plant-baghouses-answers-to-the-most-common-questions/)
- [EAF Boiler Baghouse](https://torch-air.com/blog/eaf-boiler-baghouse)
- [ATEX Compliant Baghouse](https://moldow.com/dust-extraction-system/atex-filters-and-dust-collectors/)
- [NFPA 660 Combustible Dust](https://camfilapc.com/blog/understanding-nfpa-660-the-new-standard-for-combustible-dust-safety/)
- [Air-to-Cloth Ratio — Camfil APC](https://camfilapc.com/blog/air-to-cloth-ratio/)
- [Welding Fume Collectors](https://camfilapc.com/applications/metalworking/welding/)
- [Baghouse Sizing — CED Engineering](https://www.cedengineering.com/userfiles/Design%20and%20Sizing%20of%20Baghouse%20Dust%20Collectors.pdf)
