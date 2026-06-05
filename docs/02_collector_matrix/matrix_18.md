# 18조합 매트릭스 — 처리방식 × 집진방식

## 매트릭스

| 집진방식 \ 처리 | 건식 (Dry) | 습식 (Wet) | 반건식 (Semi-dry/SDA) |
|---|---|---|---|
| **여과 (Bag/Cartridge)** | ◎ 표준 | × | ◎ SDA + Bag |
| **원심 (Cyclone)** | ◎ 전처리 | △ Cyclonic Sep | × |
| **전기 (EP)** | ◎ 대용량 고온 | ◎ WESP (서브미크론) | △ |
| **세정 (Scrubber)** | × | ◎ 표준 | ◎ SDA |
| **중력 (Settling)** | △ 전처리 | × | × |
| **관성 (Inertial/Mist)** | △ 전처리 | △ 미스트E | × |

◎ = 표준조합 / △ = 보조 / × = 부적합

## 표준 5조합

### 조합 1 — 건식 백필터 단독
- **적용**: 일반산업, 목공, 금속가공, 시멘트밀, 제재, 곡물(저온)
- **구성**: Hood → Duct → Bag → Hopper/RV → ID Fan → Stack
- **효율**: PM10 99.9% / PM2.5 99.5% / PM1 99%
- **CAPEX/OPEX**: ★★★ / ★★★

### 조합 2 — 사이클론 + 백필터 (직렬)
- **적용**: 폭발성(목분/곡분), 고농도(>50 g/Nm³), 시멘트, 제련 1차
- **구성**: Hood → Cyclone(70~90% 조분 제거) → Bag(미분 99%+) → ID Fan → Stack
- **이점**: 백필터 수명 3~5배 연장, 폭발 시 사이클론이 1차 격리

### 조합 3 — 건식 EP (시멘트/발전)
- **적용**: 시멘트킬른, 석탄화력, 제철 EAF, 비철제련 (대용량 + 고온)
- **구성**: Boiler → GGH/Cooler(150°C) → ESP(2~4 field) → ID Fan → Stack
- **효율**: SCA 80~150 m²/(m³/s) 시 99% 이상
- **CAPEX/OPEX**: ★★★★★ / ★★ (전력비 적음)

### 조합 4 — 반건식 SDA + 백필터 + 활성탄 (소각)
- **적용**: MSW/위험폐기물 소각, 바이오매스, 화장로
- **구성**: Furnace → Boiler/HX → SDA(Ca(OH)₂ 분무) → AC 주입 → Bag → ID Fan → Stack
- **효과**: SO₂ 95%+, HCl 99%+, Hg 80%+, PCDD/F 95%+ (활성탄 흡착)
- **장점**: 폐수 無 (반건식 핵심)

### 조합 5 — 습식 벤추리 + 사이클로닉 + 미스트E
- **적용**: 점착성/타르, 유증기/오일미스트, 산미스트, 폭발성(가연성) 회피
- **구성**: Hood → Quencher → Venturi(가변throat) → Cyclonic → Mist E → ID Fan(FRP/SS316) → Stack
- **효율**: PM2.5 95%, 미스트 99% (셰브론 27μm@99.9%)
- **단점**: 폐수처리 필요, ΔP 300~2500 mmAq

## 산업별 표준조합 (17개)

| # | 산업 | 분진/가스 | 표준조합 | 근거 |
|---|---|---|---|---|
| 1 | 시멘트 킬른/쿨러 | 시멘트분진(고비저항) | EP → Bag (하이브리드) 또는 Bag 단일 | <10 mg/Nm³ 달성 |
| 2 | 시멘트 밀/사일로 | 시멘트분진 | 펄스제트 Bag(아라미드) | 저~중온 표준 |
| 3 | 석탄화력 | 비산회 | EP(대형) → SCR/SDA → Bag 보완 | 경제성+미세PM |
| 4 | MSW 소각 | 분진+HCl/SOx/Hg/Dioxin | SDA + AC + Bag | 산성가스+다이옥신 |
| 5 | 위험폐기물 소각 | 위 + 중금속↑ | Quench → SDA → Bag → WESP | 다단필요 |
| 6 | 제철 EAF | 산화철·Zn/Pb (0.1~1μm) | 펄스제트 Bag(노멕스/PTFE) | 미세흄+고온 |
| 7 | 제련/비철 | 중금속, SO₂ | EP + 습식 Scrubber | SO₂ 회수 |
| 8 | 목재가공 | 목분(폭발성, NFPA664) | Cyclone + Bag(방폭벤트, 격리) | NFPA68/69, ATEX |
| 9 | 곡물·사료 | 곡분(폭발성, NFPA61) | Cyclone + Bag (ATEX) | 1차 입자분리 |
| 10 | 용접흄 | 금속산화물(<1μm) | Cartridge | 미세흄 저농도 |
| 11 | 목공 연마(가루대량) | 목분/금속분 | Cyclone(프리클리너) + Bag | 카트리지 막힘방지 |
| 12 | 화학 미스트/유증기 | 산미스트, 오일미스트 | Venturi + Cyclonic + Mist E | 미스트는 세정+관성 |
| 13 | 배연탈황 FGD | SO₂ | 습식 LSFO 또는 SDA + Bag | 황 함량별 |
| 14 | 배연탈질 SCR/SNCR | NOx | (집진 전후 위치 분기) | 350~400°C SCR |
| 15 | 아스팔트 플랜트 | 광물분진+오일흄 | Cyclone + Bag(노멕스) | 고온 점착성 |
| 16 | 유리 furnace | 알칼리분진+SOx | EP 또는 SDA + Bag | 고온냉각 후 |
| 17 | 반도체/Pharma | 미립+유해가스 | HEPA Cartridge + Scrubber | ULPA급 |

각 조합의 디테일은 `cyclone_design.md`, `ep_design.md`, `bag_filter_design.md`, `scrubber_design.md` 참조.
