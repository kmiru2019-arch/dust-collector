# 폐기물·화관·위험물·환평법

## 1. 폐기물관리법

### 폐기물처리시설 (소각시설) — 대기방지시설 의무 (시행규칙 별표9)
- 집진(여과 또는 전기)
- 산성가스 제거 (SDA/Wet)
- NOx 저감 (SCR 또는 SNCR)
- 다이옥신 저감 (활성탄 흡착)

### 잔재물(필터백·집진재) 분류
지정폐기물 판정 기준:
- 중금속 용출 (Pb 3, Cd 0.3, Hg 0.005, Cr⁶⁺ 1.5 mg/L)
- 다이옥신 ≥ 0.0001 mg/kg
- pH 12.5 이상 또는 2.0 이하
- 폭발성·인화성

→ 본 웹앱: 잔재물 처리 지정폐기물 가능성 자동안내.

### 폐기물부담금
사업장폐기물 처리·재활용 시 부과금 (kg당)

## 2. 화학물질관리법 (화관법)

### 유해화학물질 취급시설 (시행규칙 별표5)
환기설비 기준:
- 강제배기 ≥ 18 m³/h·m² (바닥면적)
- 배기구 지상 2 m 이상 또는 지붕 위
- 국소배기·공조 가산 가능

본 웹앱: 사용자가 "유해화학물질 취급" 체크 시 후드 풍량 보정 + 배기구 위치 자동 권고.

## 3. 위험물안전관리법

### 시행규칙 별표18·4·5
제조소·옥내저장소 환기:
- 환기구 바닥 2 m 이상
- 인화방지망
- 자연배기 또는 강제배기

## 4. 환경영향평가법

### 환경영향평가 대상 (시행령 별표3)
17개 분야 대규모 사업:
- 산업단지 ≥ 15만㎡
- 공장 ≥ 3만㎡
- 발전소
- 폐기물처리시설 (소각 ≥ 일 300t)
- 등

### 소규모 환경영향평가 (시행령 별표4)
보전용도지역 내 소규모 개발.

### 사후환경영향조사
협의 후 공사·운영 단계 모니터링.

## 5. 룰엔진 구현 (lib/compliance/waste_chem_acts.ts)

```typescript
export function applyWasteChemActs(input: ComplianceInput, design: SystemDesign): WasteChemCompliance {
  const obligations: ObligationItem[] = [];
  
  // 폐기물 잔재물
  if (design.collector_includes_filter || design.collector_includes_ep) {
    const dust_residue_class = classifyDustResidue(input.dust_chemistry);
    if (dust_residue_class === "designated") {
      obligations.push({
        category: "waste",
        item: "필터백·집진재 지정폐기물 처리",
        deadline: null,
        citation: "폐기물관리법 시행규칙 별표9, 폐기물공정시험기준",
      });
    }
  }
  
  // 소각시설
  if (input.facility_type === "incineration") {
    obligations.push({
      category: "waste",
      item: "대기방지시설 4단 의무 (집진+산성가스+NOx+다이옥신)",
      citation: "폐기물관리법 시행규칙 별표9",
    });
  }
  
  // 화관법
  if (input.handles_hazardous_chemicals) {
    obligations.push({
      category: "chemical",
      item: "강제배기 ≥18 m³/h·m² + 배기구 2m이상",
      citation: "화학물질관리법 시행규칙 별표5",
    });
  }
  
  // 위험물법
  if (input.handles_hazardous_substances) {
    obligations.push({
      category: "hazardous",
      item: "환기구 바닥 2m이상 + 인화방지망",
      citation: "위험물안전관리법 시행규칙 별표18",
    });
  }
  
  // 환경영향평가
  const eia_required = input.facility_size_m2 >= 30000 || input.is_industrial_complex;
  if (eia_required) {
    obligations.push({
      category: "eia",
      item: "환경영향평가 대상 — 협의 절차 필요",
      citation: "환경영향평가법 시행령 별표3",
    });
  }
  
  return { obligations };
}
```

## 출처

- 폐기물관리법 시행규칙 별표9: https://law.go.kr/flDownload.do?flSeq=83966133
- 화관법 시행규칙 별표5: https://law.go.kr/flDownload.do?flSeq=68334595
- 위험물법 시행규칙 별표18: https://www.law.go.kr/flDownload.do?flSeq=87496899
- 환평법 시행령 별표3: https://law.go.kr/flDownload.do?flSeq=34819077
- 환경영향평가정보지원시스템: https://www.eiass.go.kr/
