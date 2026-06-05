# 산업안전보건법 — 컴플라이언스 데이터

산안법 + 산업안전보건기준에 관한 규칙(이하 "기준규칙") 의 집진설비 관련 조항.

## 1. 분진작업 26종 (기준규칙 별표16)

| 호 | 작업내용 | 의무 |
|---|---|---|
| 1 | 갱내 광물 채굴·운반·파쇄 | 밀폐, 국소배기, 보호구 |
| 2 | 갱외 광물 채굴 | 보호구 |
| 3 | 광물 분쇄/연마 (밀폐 외) | 국소배기 |
| 4 | 광물 분쇄/연마 (밀폐 내) | 밀폐 또는 국소배기 |
| 5 | 광물·암석 운반 | 밀폐 또는 국소배기 |
| 6 | 광물·암석 절단 | 국소배기 |
| 7 | 광물·암석 조각/마무리 | 국소배기 |
| 8 | 시멘트 제조 | 국소배기, 밀폐 |
| 9 | 도자기·내화물 제조 | 국소배기 |
| 10 | 광물 조쇄·분쇄 | 국소배기 |
| 11 | 곡물 분쇄·계량 | 국소배기 (가연성: 방폭) |
| 12 | 사료 제조 | 국소배기 |
| 13 | 목재 분쇄 | 국소배기 (가연성: 방폭) |
| 14 | 펄프 제조 | 국소배기 |
| 15 | 카본블랙·흑연 분쇄 | 국소배기 |
| 16 | 석면 취급 | **밀폐 절대의무** |
| 17 | 주물사 처리 | 국소배기 |
| 18 | 금속 용해·주조 | 국소배기 |
| 19 | 금속 용접·용단 | 국소배기 (흄) |
| 20 | 금속 연삭·연마 | 국소배기 |
| 21 | 금속 주조 | 국소배기 |
| 22 | 도료 분무 도장 | 국소배기 |
| 23 | 시멘트 제품 제조 | 국소배기 |
| 24 | 모래 분사 (블라스팅) | 국소배기, 밀폐 |
| 25 | 분체 충전·분포·계량 | 국소배기 |
| 26 | 그밖에 분진 발생 작업 | 국소배기 |

본 룰엔진:
```yaml
# rules/dust_works_26.yaml
- id: 19
  desc: "금속 용접·용단"
  obligations:
    - LEV_required
    - safety_inspection_3y_then_2y
    - measurement_periodic
  recommended_collector: "cartridge"
  recommended_media: "PTFE_membrane"
- id: 13
  desc: "목재 분쇄"
  obligations:
    - LEV_required
    - explosion_protection
    - ATEX_certification_recommended
    - safety_inspection
  recommended_collector: "cyclone+bag"
  Kst_lookup: ["wood_dust"]
```

## 2. 국소배기장치 성능기준 (기준규칙 제422~430조)

- 후드: 발산원 최대근접 포위형 우선
- 덕트: 굴곡 최소, 청소구 설치, 부식·마모 방지
- 공기정화장치: 농도기준 만족
- 배기구: 외부 1.5m 이상, 작업장 외부

## 3. 제어풍속 (기준규칙 별표13)

관리대상 유해물질 — 발산원·후드형식별 풍속:

| 후드 형식 | 가스상 (m/s) | 입자상 (m/s) |
|---|---|---|
| 포위식 | 0.4 | 0.7 |
| 외부식 측방 | 0.5 | 1.0 |
| 외부식 하방 | 0.5 | 1.0 |
| 외부식 상방 | 1.0 | 1.5 |

```yaml
# rules/control_velocity.yaml
control_velocity_table13:
  enclosing:
    gas: 0.4
    particle: 0.7
  exterior_lateral:
    gas: 0.5
    particle: 1.0
  exterior_downward:
    gas: 0.5
    particle: 1.0
  exterior_upward:
    gas: 1.0
    particle: 1.5
```

## 4. 안전검사 (산안법 제93조)

| 항목 | 주기 |
|---|---|
| 최초 검사 | 설치 완료 + 3년 이내 |
| 정기 검사 | 이후 2년마다 |
| 면제 | 측정결과 노출기준 50% 미만 시 (관할 공단 승인) |

검사기관: 안전보건공단 또는 지정검사기관

## 5. 유해위험방지계획서 (산안법 제48조)

작업시작 **15일 전** 한국산업안전보건공단 제출.

대상 (집진설비 관련):
| 조건 | 트리거 |
|---|---|
| 안전검사대상물질 49종 + 배풍량 ≥ 60 m³/min | 의무 |
| 그 외 관리·허가물질 또는 분진작업 + 배풍량 ≥ 150 m³/min | 의무 |

49종 안전검사대상 = 분진작업 26종 일부 + 화학물질 일부.

## 6. 작업환경측정 (산안법 제125조)

| 빈도 | 조건 |
|---|---|
| 신규/변경 30일 이내 | 신설·변경 시 |
| 반기 1회 | 평시 |
| 분기 1회 | 발암성 물질 또는 노출기준 2배 초과 |
| 결과 보존 | 5년 (발암성: 30년) |

## 7. 분진폭발 방지 (기준규칙 제232조 + 별표1)

위험물질 (폭연성·가연성 분진):
- 마그네슘, 알루미늄 분말
- 곡물 분말
- 유황·인 분말
- 카본블랙
- 그 외 가연성 분진

조치:
- 점화원 차단 (방폭 전기기기, 정전기 접지)
- 폭발벤트, 격리밸브
- 작업장 청소
- ATEX/IECEx 권장

## 8. 룰엔진 구현 (lib/compliance/osh_act.ts)

```typescript
import dustWorks from "./rules/dust_works_26.yaml";
import controlVelocity from "./rules/control_velocity.yaml";

export function applyOSHAct(input: ComplianceInput, design: SystemDesign): OSHCompliance {
  // 분진작업 26종
  const dust26 = dustWorks.find(w => w.id === input.dust26_code);
  
  // 제어풍속 적용값
  const V_c = controlVelocity[design.hood_type][
    input.dust_state === "particle" ? "particle" : "gas"
  ];
  
  // 안전검사 도래일
  const install_date = input.install_date;
  const inspection_first = addYears(install_date, 3);
  const inspections = [];
  for (let i = 0; i < 20; i++) {
    inspections.push(addYears(inspection_first, i*2));
  }
  
  // 유해위험방지계획서
  const Q_min = (input.dust_state === "designated_chem") ? 60 : 150;
  const prevention_plan_required = design.Q_design_m3min >= Q_min;
  const submit_deadline = addDays(input.work_start_date, -15);
  
  // 작업환경측정 주기
  const measurement_freq = input.is_carcinogen ? "quarterly" : "biannual";
  const retention_years = input.is_carcinogen ? 30 : 5;
  
  return {
    dust26_obligations: dust26?.obligations || [],
    control_velocity: V_c,
    inspection_schedule: inspections,
    prevention_plan_required,
    submit_deadline,
    measurement_freq,
    retention_years,
    citations: [
      "산업안전보건기준에 관한 규칙 별표16",
      "동 별표13",
      "산업안전보건법 제93조",
      "동 법 제48조",
      "동 법 제125조"
    ],
  };
}
```

## 출처

- 국가법령정보센터: https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=0&lsId=007363
- 안전보건공단 안전검사: https://miis.kosha.or.kr/minwon/info/viewIsSiCycle.do
- 유해위험방지계획서: https://www.kosha.or.kr/kosha/business/manufacturingb.do
