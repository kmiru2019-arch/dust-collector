# KOSHA Guide — 집진·환기·방폭 기술지침

본 룰엔진이 직접 참조하는 KOSHA Guide 정리. 각 가이드는 PDF로 KOSHA 자료마당에서 다운로드 가능. 본 웹앱은 PDF 직접 호스팅 X (저작권), 링크만.

## 환기·국소배기 계열 (W 시리즈)

### W-1-2019 산업환기설비에 관한 기술지침
- 후드형식별 풍량식
- 발산원별 제어풍속표 (별표13 보충)
- 덕트 반송속도 (분진 18~23 m/s, 흄 8~10 m/s, 가스 6~12 m/s)
- 후드 정압손실 K_hood 표
- 시스템 정압 균형 방법

본 웹앱 적용:
- Stage 2 후드 풍량 식
- Stage 3 덕트 반송속도 디폴트
- W-1 별표 → kosha-controls.ts

다운로드: https://kosha.or.kr/extappKosha/kosha/guidance/fileDownload.do?sfhlhTchnlgyManualNo=W-1-2019&fileOrdrNo=3

### W-2 후드 설계 지침
- 포위식, 외부식, 레시버식, 캐노피 식별 풍량 산정식
- 흡인범위(capture distance) 계산

### W-3 덕트 설계 지침
- 압력손실(정압·동압·전압) 계산법
- 등속법 vs 등압법
- 분기 합류 손실

### W-4 송풍기 설치 지침
- 송풍기 정압-풍량 매칭 (작동점)
- Surge·Stall 회피
- 진동·소음 기준
- 직결·벨트 구동

### W-11 국소배기장치 안전검사 기술지침
- 검사항목: 풍속, 정압, 소음, 부식·균열
- 측정점·측정방법

### W-13 작업장 환기설계 지침
- 전체환기 환기횟수표 (ACH)
- 부지선정·외기취입

## 분진폭발 계열 (D, P 시리즈)

### D-43-2012 집진설비 분진폭발 방지기술지침
**핵심 — 본 웹앱의 분진폭발 평가 모듈 직접 참조**

- Kst·MIE·MIT·Pmax 측정·등급화
- 폭발벤트 면적 산정
- 방폭형 집진기 구성요소
- 격리밸브·역화방지

다운로드: https://www.kosha.or.kr/extappKosha/kosha/guidance/fileDownload.do?sfhlhTchnlgyManualNo=D-43-2012&fileOrdrNo=3

### D-13 가연성 분진 폭발 위험 분석기법
- ST 등급 (Kst 기반)
  - ST1: Kst ≤ 200 bar·m/s
  - ST2: 200 ~ 300
  - ST3: > 300

### D-25 폭발성 분위기 위험성 평가
- HAZOP·LOPA 활용

### P-131-2013 화학공정 분진폭발 방지 기술지침
**Zone 20/21/22 구분의 핵심**

- Zone 20: 가연성 분진 분위기가 정상운전 중 장기간 존재
  → 집진기 내부, 호퍼, 사이클론 내부
- Zone 21: 정상운전 중 가끔 발생
  → 도어, 점검구 외부, 백 교체구역
- Zone 22: 비정상 시 짧게 발생
  → 집진기 주변실, 백필터 출구 (정상시 청정)

다운로드: https://www.kosha.or.kr/extappKosha/kosha/guidance/fileDownload.do?sfhlhTchnlgyManualNo=P-131-2013&fileOrdrNo=3

### E-186 IEC ATEX 인증 가이드
- IEC 60079 시리즈 매핑
- Ex 방폭전기기기 선정

### P-104, P-110 (보충)
- 분진폭발 보호시스템
- 폭발벤트 NFPA 68 매핑

## 룰엔진 구현 (lib/compliance/kosha_guides.ts)

```typescript
export function applyKOSHAGuides(input: ComplianceInput, dust: DustProperties): KOSHACompliance {
  // ST 등급 (D-13)
  let ST_class: "ST0"|"ST1"|"ST2"|"ST3"|null = null;
  if (dust.flammable && dust.Kst != null) {
    if (dust.Kst === 0) ST_class = "ST0";
    else if (dust.Kst <= 200) ST_class = "ST1";
    else if (dust.Kst <= 300) ST_class = "ST2";
    else ST_class = "ST3";
  }
  
  // Zone 구분 (P-131)
  const zones = {
    zone20: ["baghouse_internal", "hopper", "cyclone_internal", "duct_post_collector"],
    zone21: ["doors", "inspection_ports", "bag_changeout_area"],
    zone22: ["surrounding_room"],
  };
  
  // 폭발벤트 면적 (D-43 + NFPA 68)
  const vent_area_m2 = nfpa68VentArea({
    V_vessel: input.V_baghouse_m3,
    P_red: 0.1,        // bar (강도 한계)
    P_stat: 0.05,      // bar (벤트 개방압력)
    Kst: dust.Kst,
    L_D_ratio: 1.5,
  });
  
  return {
    ST_class,
    zones,
    vent_area_m2,
    isolation_required: dust.flammable,
    ATEX_recommended: true,
    citations: ["KOSHA D-43-2012", "KOSHA D-13", "KOSHA P-131-2013", "NFPA 68"],
    references: {
      W1: "https://kosha.or.kr/extappKosha/kosha/guidance/fileDownload.do?sfhlhTchnlgyManualNo=W-1-2019&fileOrdrNo=3",
      D43: "https://www.kosha.or.kr/extappKosha/kosha/guidance/fileDownload.do?sfhlhTchnlgyManualNo=D-43-2012&fileOrdrNo=3",
      P131: "https://www.kosha.or.kr/extappKosha/kosha/guidance/fileDownload.do?sfhlhTchnlgyManualNo=P-131-2013&fileOrdrNo=3",
    },
  };
}
```

## NFPA 68 폭발벤트 면적 식

```
A_v [m²] = K_st × V^(3/4) × (some function of P_red, P_stat)

상세:
A_v = 1e-4 × ((Kst × V^0.75) / sqrt(P_red − P_stat))
       × (1 + ε_L/D × (L/D − 2))
```

(NFPA 68 — 9 식, 단순화 표현)

```typescript
function nfpa68VentArea(p: {V_vessel: number, P_red: number, P_stat: number, Kst: number, L_D_ratio: number}): number {
  const term1 = (p.Kst * Math.pow(p.V_vessel, 0.75)) / Math.sqrt(p.P_red - p.P_stat);
  const eps_LD = 0.6;
  const term2 = 1 + eps_LD * (p.L_D_ratio - 2);
  return 1e-4 * term1 * term2;
}
```

## 면책

분진폭발 자동평가는 **참고용**. 실제 인증은 ATEX/IECEx 시험성적서 + 전문가 위험성평가 필수. 컴플라이언스 리포트에 다음 면책 자동삽입:

> "본 분진폭발 평가는 KOSHA D-43-2012 및 NFPA 68 식에 기반한 자동 추정치이며, 법적 효력 또는 ATEX/IECEx 인증을 대체하지 않습니다. 실제 설계 시 공인기관의 위험성평가 및 인증을 받으십시오."
