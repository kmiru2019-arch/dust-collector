# 산업별 표준조합 17개 — 디테일

각 산업의 표준 집진 라인업 + 핵심 설계 파라미터.

| # | 산업 | 분진 | 온도 | 농도 | 권장 조합 |
|---|---|---|---|---|---|
| 1 | **시멘트 킬른** | 시멘트분진 (고비저항 10¹⁰~10¹²) | 250~400°C | 10~50 g/Nm³ | EP(3~4 field) → Bag(P84/PTFE) 하이브리드. 출구 5 mg/Nm³ |
| 2 | **시멘트 밀/사일로** | 시멘트분진 | <100°C | 5~30 g/Nm³ | 펄스제트 Bag(아라미드/노멕스), A/C 0.6~0.9 |
| 3 | **석탄화력 보일러** | 비산회 (비저항 변동) | 130~160°C | 5~30 g/Nm³ | EP(대형) + SCR + SDA + Bag(2차). 출구 5 mg/Nm³ |
| 4 | **MSW 소각** | 분진+HCl/SOx/Hg/PCDD | 800°C → 150°C | 1~10 g/Nm³ | Boiler → SDA + AC + Bag(노멕스/PTFE). PCDD <0.1 ng/Sm³ |
| 5 | **위험폐기물 소각** | 위 + 중금속·휘발성 | 1100°C → 90°C | 1~5 g/Nm³ | Quench → SDA → Bag → WESP |
| 6 | **제철 EAF** | 산화철·Zn/Pb (0.1~1μm) | 200~400°C → 130°C | 5~25 g/Nm³ | Air-cooled HX → 펄스제트 Bag(노멕스 또는 PTFE), A/C 1.2 |
| 7 | **제련/비철 (Cu/Pb/Zn)** | 중금속·SO₂ | 200~600°C | 5~50 g/Nm³ | EP + Wet Scrubber(SO₂ 회수) → 황산공장 |
| 8 | **목재가공** | 목분 (Kst 100~200, ST1) | 상온 | 5~50 g/Nm³ | Cyclone(prefilter) + Bag + 폭발벤트(NFPA68) + 격리밸브(NFPA69) |
| 9 | **곡물·사료** | 곡분 (Kst 100~250, ST1) | 상온 | 5~30 g/Nm³ | Cyclone + Bag + ATEX 인증 |
| 10 | **용접흄** | 금속산화물 (<1 μm, 0.1 g/Nm³) | <80°C | 0.05~1 g/Nm³ | Cartridge(셀룰로오스+PTFE 막), A/C 0.5~1.0 |
| 11 | **목공 연마** | 목분(가루대량) | 상온 | 10~100 g/Nm³ | Cyclone + Bag |
| 12 | **화학 미스트/유증기** | 산미스트·오일미스트 | 80~150°C | 0.5~5 g/Nm³ | Quench + Venturi + Cyclonic + Mist E |
| 13 | **배연탈황 FGD (대형)** | SO₂·SO₃·잔분진 | 130°C | <30 mg/Nm³ | EP 후단 + 습식 LSFO(석회석-석고) + GGH |
| 14 | **배연탈질 SCR** | NOx | 350~400°C | <100 ppm | EP/Bag 입구 또는 출구 (촉매 보호) |
| 15 | **아스팔트 플랜트** | 광물분진+오일흄 | 150~200°C | 5~30 g/Nm³ | Cyclone(1차) + Bag(노멕스) |
| 16 | **유리 furnace** | 알칼리분진+SOx+SeO₂ | 1300°C → 200°C | 1~10 g/Nm³ | Boiler → EP 또는 SDA + Bag(유리섬유) |
| 17 | **반도체/Pharma** | 미립+유해가스 | 상온~80°C | <10 mg/Nm³ | HEPA Cartridge + Wet Scrubber(toxic gas) |

## 코드 매핑 (lib/data/dust/industries.ts)

```typescript
export const INDUSTRIES: Record<IndustryCode, IndustryProfile> = {
  cement_kiln: {
    label: { ko: "시멘트 킬른", en: "Cement Kiln" },
    typical_dust: { name: "시멘트분진", d50: 10, ρ_p: 3100, resistivity: 1e11 },
    typical_gas: { T_in: 350, SO2: 200, NOx: 600, HCl: 5 },
    typical_conc: 30,  // g/Nm³
    standard_combo: ["ep_3field", "bag_P84"],
    target_emission: 5,  // mg/Sm³
    references: ["EU LCP BAT 2017", "환경부 시멘트제조업 BAT"],
  },
  msw_incineration: {
    label: { ko: "MSW 소각", en: "Municipal Solid Waste Incineration" },
    typical_dust: { name: "비산재+HM", d50: 5, ρ_p: 2200 },
    typical_gas: { T_in: 800, SO2: 300, HCl: 800, Hg: 0.05, PCDD: 1 },
    standard_combo: ["boiler_HX", "sda", "ac_injection", "bag_PTFE"],
    target_emission: 10,
    references: ["폐기물관리법 시행규칙 별표9", "EU IED 2010/75/EU"],
  },
  woodworking: {
    label: { ko: "목재가공", en: "Woodworking" },
    typical_dust: { name: "목분", d50: 50, Kst: 150, MIE: 30, ST_class: "ST1" },
    typical_gas: { T_in: 25 },
    standard_combo: ["cyclone", "bag_PE_atex", "explosion_vent"],
    safety: { ATEX_required: true, NFPA_standard: "NFPA664" },
    references: ["NFPA 660", "KOSHA D-43-2012"],
  },
  // ... 17개 전체
};
```

## 위저드에서의 활용

Stage 1에서 사용자가 산업 선택 → 다음 단계 디폴트 자동 채움:
- Stage 1: 분진 d50, ρ_p, Kst, 가스 T·조성
- Stage 2: 후드형식 (산업 표준)
- Stage 4·5: 처리방식·집진방식 디폴트
- Stage 8: 적용 법규 미리 표시

사용자는 디폴트를 그대로 가거나 수정. 산업별 5분 완성 경로의 핵심.

## SEO 페이지 매핑

각 산업 = 1개의 `/industries/{code}` 페이지 → 검색트래픽 흡수:
- /industries/cement-kiln
- /industries/msw-incineration
- /industries/woodworking
- /industries/welding-fume
- /industries/grain-handling
... (17개)

각 페이지에 산업별 분진특성 + 표준조합 + 법규 + 사례연구 + 빠른견적 위저드 진입점.
