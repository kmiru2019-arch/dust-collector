# 대기환경보전법 — 컴플라이언스 데이터

본 문서는 대기환경보전법·시행령·시행규칙의 집진설비 관련 조항을 룰엔진에 코드화하기 위한 데이터 정리.

## 1. 사업장 종별 분류 (시행령 별표1의3)

연간 대기오염물질 발생량 기준:

| 종별 | 발생량 (t/yr) |
|---|---|
| 1종 | ≥ 80 |
| 2종 | 20 ~ 80 |
| 3종 | 10 ~ 20 |
| 4종 | 2 ~ 10 |
| 5종 | < 2 |

```yaml
# rules/business_classification.yaml
classification:
  - {emission_min: 80,   class: "1종"}
  - {emission_min: 20,   class: "2종"}
  - {emission_min: 10,   class: "3종"}
  - {emission_min: 2,    class: "4종"}
  - {emission_min: 0,    class: "5종"}
```

## 2. 배출시설 분류 (시행규칙 별표3)

70여 업종 — 신고/허가 대상. 본 룰엔진은 **KSIC 코드 ↔ 별표3 시설 코드** 매핑 유지.

대표 시설:
- 화학제품 제조업 (시간당 폐가스 발생량 50 m³ 이상)
- 1차 금속산업 (모든 시설)
- 비금속 광물제품 (시멘트 등)
- 발전·열공급시설
- 폐기물처리시설 (소각·매립)
- 음식료품 (대형)
- 인쇄·출판 (VOC 다량 사용)

## 3. 방지시설 종류 (시행규칙 별표4)

13종:
1. 중력집진시설
2. 관성력집진시설
3. 원심력집진시설
4. 세정집진시설
5. 여과집진시설
6. 전기집진시설
7. 음파집진시설
8. 흡수에 의한 시설
9. 흡착에 의한 시설
10. 직접연소에 의한 시설
11. 촉매반응을 이용하는 시설
12. 응축에 의한 시설
13. 산화·환원에 의한 시설

(추가: 미생물·악취제거 시설 등)

본 웹앱은 1~7번 + 12번 + 8·9·11(산성가스/Hg 흡착) 자동설계.

## 4. 배출허용기준 (시행규칙 별표8)

신·증설 시점별 차등:
- 2015.1.1. 이후 신설
- 2007.1.1. ~ 2014.12.31. 신설
- 2007.1.1. 이전 기존시설

대표값 (2015.1.1. 이후 신설 + 일반시설):

| 오염물질 | 일반보일러 | 시멘트 | 소각시설 | 발전 |
|---|---|---|---|---|
| 먼지 | 10~50 mg/Sm³ | 30 | 25 | 10~25 |
| SO₂ | 80~270 ppm | 30 | 50 | 50~100 |
| NOx | 70~250 ppm | 80 | 70 | 50~140 |
| HCl | - | - | 20 | - |
| HF | 2 ppm | 2 | 2 | 2 |
| Pb | 0.2 mg/Sm³ | 0.2 | 0.2 | 0.2 |
| Cd | 0.05 | 0.05 | 0.05 | 0.05 |
| Hg | 0.05 | 0.05 | 0.05 | 0.05 |
| 다이옥신 | - | - | 0.1~5 ng-TEQ/Sm³ | - |

특별대책지역·대기관리권역은 더 엄격(별표 8의 일부 조항).

```yaml
# rules/emission_standards.yaml
standards:
  - facility_type: "incineration_msw_2t_per_h_or_more"
    install_after: "2015-01-01"
    region: "general"
    limits:
      dust: {value: 25, unit: "mg/Sm3"}
      SO2: {value: 50, unit: "ppm"}
      NOx: {value: 70, unit: "ppm"}
      HCl: {value: 20, unit: "ppm"}
      HF: {value: 2, unit: "ppm"}
      Hg: {value: 0.05, unit: "mg/Sm3"}
      Pb: {value: 0.2, unit: "mg/Sm3"}
      Cd: {value: 0.05, unit: "mg/Sm3"}
      PCDD: {value: 0.1, unit: "ng-TEQ/Sm3"}
  # ... 시점별·시설별 30+ 행
```

## 5. 자가측정·TMS

### TMS (굴뚝자동측정) 부착 의무
| 종별·시설 | TMS 의무 |
|---|---|
| 1종 사업장 | 의무 |
| 2종 사업장 | 일부 |
| 3종 사업장 | 일부 (대형 보일러·소각) |
| 4·5종 | 면제 |

측정 항목: 먼지, SO₂, NOx, HCl, NH₃, 산소, 유속

### 자가측정 (수동)
- 1·2·3종: 분기 또는 반기 1회
- 4·5종: 연 1회

## 6. 비산먼지 발생사업 (시행규칙 별표14)

11개 업종:
1. 시멘트·석회·플라스터·시멘트 제품 제조
2. 1차 금속 (제철·제강)
3. 비료·사료 제조
4. 건설업
5. 운송업 (석탄·시멘트·고철·곡물 등 분체 운송)
6. 채광·조쇄
7. 야외절단·탈청·연마·도장
8. 야적
9. 하역
10. 유리·세라믹
11. 그밖에 (석탄·코크스 보관 등)

## 7. VOC 배출시설 (시행규칙 별표16)

석유정제·화학·도장·인쇄 등.
- 누설 점검: 월 1회
- 회수효율: 92% 이상 (대형) / 85% 이상 (중형)

## 8. 다이옥신 (잔류성유기오염물질관리법)

| 시설 용량 | 기준 (ng-TEQ/Sm³) |
|---|---|
| ≥ 2 t/h | 0.1 |
| 0.2 ~ 2 t/h | 5 |
| < 0.2 t/h | 40 |

(폐기물 소각시설)

## 9. 룰엔진 구현 (lib/compliance/air_quality_act.ts)

```typescript
import standardsYaml from "./rules/emission_standards.yaml";

export function applyAirQualityAct(input: ComplianceInput): AirQualityCompliance {
  // 종별 분류
  const class_no = classifyBusiness(input.annual_emission_t);
  
  // 배출허용기준 lookup
  const standards = standardsYaml.find(s =>
    s.facility_type === input.facility_type &&
    isAfterDate(input.install_date, s.install_after) &&
    s.region === input.region
  );
  
  // TMS 의무
  const TMS_required = (
    class_no === "1종" ||
    (class_no === "2종" && certain_facilities.includes(input.facility_type)) ||
    (class_no === "3종" && large_combustion.includes(input.facility_type))
  );
  
  // 비산먼지
  const fugitive_dust_obligation = list11Industries.includes(input.industry_KSIC);
  
  // VOC
  const VOC_obligation = (
    voc_facility_list.includes(input.facility_type) &&
    input.VOC_use_t_yr > 5
  );
  
  return {
    class_no,
    standards,
    TMS_required,
    fugitive_dust_obligation,
    VOC_obligation,
    citations: [
      "대기환경보전법 시행령 별표1의3",
      "동 시행규칙 별표8",
      "동 시행규칙 별표14"
    ],
  };
}
```

## 출처 (PDF 리포트에 자동삽입)

- 국가법령정보센터: https://www.law.go.kr/법령/대기환경보전법
- 시행규칙 별표8: https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=218457
- 찾기쉬운 생활법령정보: https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=1466
- 굴뚝자동측정망: https://www.air.go.kr/contents/view.do?contentsId=6&menuId=36
