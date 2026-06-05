# 정부 보조금·지원사업

집진설비 도입·교체 시 받을 수 있는 보조금·융자 매칭 데이터.

## 1. 환경부 — 소규모사업장 방지시설 설치지원

### 개요
- 대상: 4·5종 사업장 우선 (1·3종 일부)
- 지원율: 국비 50% + 지방비 40% + 자부담 10% (총 90%)
- 한도: 시설별 차등 (일반 5천만~3억)
- 신청: 매년 초 (지자체 환경부서)

### 적용 시설
- 여과집진(백필터)
- 전기집진
- 흡수·흡착 시설
- VOC 회수설비

### 출처
- 환경부 정부지원 환경사업 종합안내서: https://me.go.kr/home/web/board/read.do?boardMasterId=39&boardId=1728990&menuId=10524
- bizinfo.go.kr 사업공고: https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?pblancId=PBLN_000000000094680

## 2. 환경부 — 노후 방지시설 교체 지원

- 대상: 설치 10년 이상 노후 방지시설
- 지원율: 50~70%
- 우선: 1~3종 사업장 + 미세먼지 영향 큰 시설

## 3. 산업부·에너지공단 — 에너지효율향상 (송풍기 인버터)

- VFD(인버터) 설치 시 보조 또는 융자
- ROI 1.5~2년 + 보조금으로 회수기간 단축
- 대상: 산업용 모터·송풍기·펌프
- 신청: 한국에너지공단

## 4. 안전보건공단 — 안전보건투자 융자

- 국소배기장치 신·증설
- 분진폭발 방지시설
- 융자: 연 1~2% 저리, 한도 10억
- 신청: 안전보건공단 광역본부

## 5. 지자체 추가지원

| 지역 | 특화 지원 |
|---|---|
| 서울 | 매연저감장치 90% 지원, 사업장 방지시설 우선 |
| 부산 | 항만 인근 사업장 우선 |
| 울산 | 산단 미세먼지 저감 |
| 시·군 단위 | 자체 조례 추가지원 |

## 6. 룰엔진 구현 (lib/compliance/subsidies.ts)

```typescript
import subsidiesYaml from "./rules/subsidies.yaml";

export function matchSubsidies(input: ComplianceInput, design: SystemDesign): SubsidyMatch[] {
  const matches: SubsidyMatch[] = [];
  
  // 환경부 소규모사업장
  if (["4종","5종"].includes(input.classification)) {
    matches.push({
      name: "환경부 소규모사업장 방지시설 설치지원",
      eligibility: "4·5종 사업장",
      subsidy_rate: 0.90,
      max_amount_won: 300_000_000,
      deadline: "매년 초 지자체 공고",
      agency: "환경부 + 광역지자체",
      link: "https://me.go.kr/home/web/board/read.do?boardMasterId=39&boardId=1728990",
    });
  }
  
  // 노후 교체
  const facility_age = thisYear - input.install_year;
  if (facility_age >= 10) {
    matches.push({
      name: "노후 방지시설 교체 지원",
      eligibility: "설치 10년 이상",
      subsidy_rate: 0.5 + (facility_age >= 15 ? 0.2 : 0),
      max_amount_won: 500_000_000,
      agency: "환경부",
    });
  }
  
  // VFD 보조
  if (design.fan_VFD_recommended) {
    matches.push({
      name: "에너지효율향상 — 인버터 보조",
      eligibility: "산업용 모터 ≥30 kW",
      subsidy_rate: 0.30,
      agency: "한국에너지공단",
      link: "https://www.energy.or.kr/",
    });
  }
  
  // 분진폭발 방지
  if (design.explosion_protection_required) {
    matches.push({
      name: "안전보건투자 융자 — 분진폭발 방지시설",
      type: "loan",
      interest_rate: 0.015,
      max_amount_won: 1_000_000_000,
      agency: "안전보건공단",
    });
  }
  
  // 지자체별
  const local = lookupLocalSubsidy(input.region);
  if (local) matches.push(...local);
  
  return matches;
}
```

## YAML 시드 (rules/subsidies.yaml)

```yaml
subsidies:
  - id: env_smb_install
    name: "환경부 소규모사업장 방지시설 설치지원"
    eligibility:
      classification: ["4종","5종"]
    subsidy_rate: 0.90
    max_amount: 300000000
    cycle: "annual"
    agency: "환경부+지자체"
    link: "https://me.go.kr/home/web/board/read.do?boardMasterId=39&boardId=1728990"

  - id: env_old_replace
    name: "노후 방지시설 교체 지원"
    eligibility:
      facility_age_min: 10
    subsidy_rate: 0.50
    
  - id: kemc_vfd
    name: "에너지효율향상 — 인버터 보조"
    eligibility:
      motor_kW_min: 30
      VFD_required: true
    subsidy_rate: 0.30
    agency: "한국에너지공단"
    
  - id: kosha_loan
    name: "안전보건투자 융자"
    type: "loan"
    interest_rate: 0.015
    eligibility:
      explosion_or_LEV: true
    agency: "안전보건공단"
```

## 컴플라이언스 리포트 출력 예

> ### 적용 가능한 보조금·융자 (4건)
> 
> 1. **환경부 소규모사업장 방지시설 설치지원** (5종 사업장)
>    - 지원율: 90% (국비50+지방비40)
>    - 한도: 3억원
>    - 신청: 2026년 매년 초 지자체 공고
>    - [공고 페이지](https://me.go.kr/...)
> 
> 2. **에너지효율향상 — 인버터 보조** (송풍기 75kW VFD)
>    - 지원율: 30%
>    - 예상 ROI: 1.5년 (보조금 적용 시 1.0년)
>    - 신청: 한국에너지공단
> 
> ... (자동 정렬: 지원율 높은 순)
