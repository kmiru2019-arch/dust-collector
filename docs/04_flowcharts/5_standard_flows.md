# 5종 표준 P&ID 흐름도 — 자동생성 프리셋

각 산업/조건별로 위저드 1단계에서 선택 시 나머지 단계 디폴트가 자동 채워지는 5종 프리셋. lib/drawing/dust/presets/ 에 JSON으로 보관.

---

## 프리셋 1 — 건식 백필터 단독

```
┌────┐  ┌──┐  ┌────┐  ┌────┐  ┌─────────┐  ┌────┐  ┌────┐  ┌─────┐
│Hood│→│BD│→│Duct│→│Damp│→│Baghouse │→│Hop │→│ID  │→│Stack│→CEMS
│    │  │  │  │    │  │er  │  │+ER vent │  │RV  │  │Fan │  │     │
└────┘  └──┘  └────┘  └────┘  └─────────┘  └────┘  └────┘  └─────┘
                                  ↑
                              Pulse Jet
                              (Air rcv,
                               SV array,
                               Sequencer)
계장: ΔPT(필수), TT, AT(선택)
```

### 적용
- 일반산업, 목공·금속가공, 시멘트밀, 제재
- 분진 비폭발성 또는 ATEX 보호 추가
- 온도 ≤ 130°C (PE 또는 노멕스)

### 디폴트 값
```yaml
preset_1_dry_bag:
  stage1: { dust: "generic_dust", T: 25 }
  stage2: { hood_type: "enclosing", V_c: 0.7 }
  stage3: { transport_velocity: 18 }
  stage4: { treatment: "dry" }
  stage5: { collector: "bag_filter_pulse_jet", media: "PE", AC: 1.2 }
  stage6: { condenser: null }
  stage7: { arrangement: "1_ID", fan_type: "Turbo_BC" }
  stage8: { explosion_protection: false }
```

---

## 프리셋 2 — 사이클론 + 백필터 (직렬)

```
┌────┐  ┌────┐  ┌────────┐  ┌─────────┐  ┌────┐  ┌─────┐
│Hood│→│Duct│→│Cyclone │→│Baghouse │→│ID  │→│Stack│
│    │  │    │  │        │  │+ER vent │  │Fan │  │     │
└────┘  └────┘  └────────┘  └─────────┘  └────┘  └─────┘
                    ↓RV          ↓RV
                ┌────────┐  ┌────────┐
                │Coarse  │  │ Fine   │
                │ Bin    │  │ Bin    │
                └────────┘  └────────┘

계장: ΔPT × 2 (cyclone + bag), TT, AT
폭발성 분진: 사이클론과 백필터 사이 격리밸브, 폭발벤트 양쪽
```

### 적용
- 폭발성 (목분, 곡분) — ATEX 필수
- 고농도 (>50 g/Nm³)
- 시멘트, 제련 1차

### 디폴트 값
```yaml
preset_2_cyclone_bag:
  stage4: { treatment: "dry" }
  stage5:
    primary: { collector: "cyclone", standard: "Stairmand_HE", V_i: 18 }
    secondary: { collector: "bag_filter_pulse_jet", media: "Nomex", AC: 1.0 }
  stage7: { arrangement: "1_ID" }
  stage8: { explosion_protection: true, isolation_valve: true, vent_NFPA68: true }
```

---

## 프리셋 3 — 건식 EP (시멘트/발전)

```
┌──────┐  ┌─────────┐  ┌──────────┐  ┌────┐  ┌─────┐
│Boiler│→│GGH/Cooler│→│ESP       │→│ID  │→│Stack│
│      │  │  150°C   │  │2~4 field │  │Fan │  │     │
└──────┘  └─────────┘  └──────────┘  └────┘  └─────┘
                          ↓Rapper, Hopper/RV
                       
FD 옵션 (양압 방지):
[FD Fan]→[Boiler]→ ... →[ID Fan]→[Stack]

계장: T/R sets × 필드수, ZIT(rapper), TT(in/out), KV
```

### 적용
- 시멘트킬른, 석탄화력, 제철 EAF (대용량 + 고온)
- 분진 비저항 10⁴~10¹⁰
- 출구 5~10 mg/Nm³ 목표

### 디폴트 값
```yaml
preset_3_ep:
  stage1: { dust: "fly_ash", T: 350 }
  stage4: { treatment: "dry" }
  stage5: { collector: "ep_dry", field_count: 4, SCA: 100 }
  stage6: { condenser: "GGH_or_Cooler", T_target: 150 }
  stage7: { arrangement: "FD+ID_balanced" }
```

---

## 프리셋 4 — 반건식 SDA + 백필터 (소각)

```
┌────────┐  ┌────────┐  ┌────────────┐  ┌──────────┐  ┌─────────┐  ┌────┐  ┌─────┐
│Furnace │→│Boiler/ │→│SDA         │→│AC injection│→│Baghouse │→│ID  │→│Stack│
│        │  │HX      │  │Ca(OH)2 분무│  │            │  │+ER vent │  │Fan │  │+CEMS│
└────────┘  └────────┘  └────────────┘  └──────────┘  └─────────┘  └────┘  └─────┘
                              ↑               ↑
                         Lime slurry    Activated Carbon
                         (Hg/Dioxin)
                              ↓RV
                         [filter cake to disposal]

계장: ΔPT × 다중, TT × 4 (in/SDA out/Bag in/out), AT(SO2/HCl/Hg/Dioxin/PCDD)
```

### 적용
- MSW 소각, 위험폐기물 소각
- 산성가스 + Hg + 다이옥신 동시제거
- 폐수 無

### 디폴트 값
```yaml
preset_4_sda_bag:
  stage1: { dust: "incineration_fly_ash", T: 800, SO2: 300, HCl: 800, Hg: 0.05 }
  stage4: { treatment: "semi-dry+SDA" }
  stage5:
    primary: { collector: "sda", reagent: "Ca(OH)2", Ca_S: 1.6 }
    secondary: { collector: "bag_filter_pulse_jet", media: "PTFE", AC: 0.9 }
    tertiary: { ac_injection: true, PAC_mg_Nm3: 100 }
  stage6: { condenser: "Boiler_HX", T_target: 200 }
  stage7: { arrangement: "FD+ID_balanced" }
```

---

## 프리셋 5 — 습식 벤추리 + 사이클로닉 + 미스트E

```
┌────┐  ┌────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌─────┐  ┌─────┐
│Hood│→│Quencher │→│Venturi  │→│Cyclonic │→│Mist     │→│ID   │→│Stack│
│    │  │         │  │가변throat│  │Sep      │  │Eliminator│  │Fan  │  │     │
└────┘  └────────┘  └──────────┘  └─────────┘  └──────────┘  └─────┘  └─────┘
              ↑              ↑                   ↓Slurry
          냉각수 분무     ΔP 30~250 mbar
                                          [Slurry Tank/Pump]
                                                  ↓
                                          [Wastewater Treatment]

재질: FRP / SUS316L (부식 대응)
계장: ΔPT(venturi), FT(액류), TT, AT, pH
```

### 적용
- 점착성/타르 분진
- 유증기·오일미스트
- 산미스트 (HCl, H₂SO₄)
- 폭발성 분진 회피용

### 디폴트 값
```yaml
preset_5_venturi:
  stage4: { treatment: "wet" }
  stage5:
    primary: { collector: "venturi", V_throat: 90, L_G: 1.0 }
    secondary: { collector: "cyclonic_separator" }
    tertiary: { collector: "mist_eliminator", type: "chevron" }
  stage6: { condenser: "direct_quench" }
  stage7: { arrangement: "1_ID", fan_material: "FRP_or_SS316L" }
```

---

## 위저드 1단계 산업 → 프리셋 매핑

| 산업 선택 | 자동 적용 프리셋 |
|---|---|
| 시멘트 킬른 | 프리셋 3 (EP) — 또는 EP+Bag 하이브리드 |
| 시멘트 밀 | 프리셋 1 (백필터 단독) |
| 발전소 | 프리셋 3 (EP) |
| MSW 소각 | 프리셋 4 (SDA+Bag) |
| 위험폐기물 소각 | 프리셋 4 + WESP 추가 |
| 제철 EAF | 프리셋 1 (Bag 단독, 노멕스) |
| 제련 비철 | 프리셋 3 + 습식 SO₂회수 |
| 목재가공 | 프리셋 2 (Cyclone+Bag, ATEX) |
| 곡물·사료 | 프리셋 2 (Cyclone+Bag, ATEX) |
| 용접흄 | 프리셋 1 (Cartridge) |
| 화학 미스트 | 프리셋 5 (벤추리) |
| 아스팔트 | 프리셋 2 (Cyclone+Bag 노멕스) |
| 유리 furnace | 프리셋 3 (EP) 또는 4 (SDA+Bag) |
| 반도체/Pharma | 프리셋 1 (HEPA Cartridge) + 습식 보조 |

## JSON 스키마 (System Definition)

5종 프리셋은 동일 JSON 스키마로 직렬화 — system_json_schema.md 참조.
