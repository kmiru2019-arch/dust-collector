# Stage 8 — 안전·법규 컴플라이언스 (코드 매핑)

`docs/03_compliance/` 의 5개 법규 문서를 통합 룰엔진으로.

## 인터페이스

```typescript
export interface ComplianceInput {
  // 사업장
  region: KoreaRegion;          // 시·도 코드
  industry_KSIC: string;
  annual_emission_t: number;
  hourly_emission_Sm3h: number;
  install_date: string;         // ISO YYYY-MM-DD
  is_industrial_complex: boolean;
  facility_size_m2: number;
  
  // 시설
  facility_type: FacilityType;  // boiler, incinerator, kiln 등
  facility_capacity?: number;   // soak: t/h, boiler: MW
  
  // 분진·작업
  dust26_code?: number;         // 1~26
  is_carcinogen: boolean;
  handles_hazardous_chemicals: boolean;
  handles_hazardous_substances: boolean;
  
  // 운전
  Q_design_m3min: number;       // Stage 2 후드 풍량
  worker_count: number;
  daily_exposure_h: number;
  
  // 가스 (Stage 1 출력 활용)
  PCDD_emission?: number;
  Hg_emission?: number;
  VOC_use_t_yr?: number;
  
  // 분진폭발 (Stage 1 출력)
  dust_flammable: boolean;
  Kst?: number;
  V_baghouse_m3?: number;       // Stage 5 출력
  
  // 작업
  work_start_date?: string;
}

export interface ComplianceOutput {
  classification: { class_no: string, applicable_standards: any };
  emission_standards: any;
  TMS_required: boolean;
  fugitive_dust_obligation: boolean;
  VOC_obligation: boolean;
  dust26_obligations: ObligationItem[];
  control_velocity: number;
  inspection_schedule: string[];
  prevention_plan: { required: boolean, deadline?: string };
  measurement: { freq: "biannual"|"quarterly", retention_yr: number };
  explosion: ExplosionAnalysis | null;
  waste_obligations: ObligationItem[];
  chemical_obligations: ObligationItem[];
  eia_required: boolean;
  subsidies: SubsidyMatch[];
  citations: string[];
  disclaimer: string;
}
```

## 통합 코드 (lib/calc/dust/08-compliance.ts)

```typescript
import { applyAirQualityAct } from '@/lib/compliance/air_quality_act';
import { applyOSHAct } from '@/lib/compliance/osh_act';
import { applyKOSHAGuides } from '@/lib/compliance/kosha_guides';
import { applyWasteChemActs } from '@/lib/compliance/waste_chem_acts';
import { matchSubsidies } from '@/lib/compliance/subsidies';

export function generateCompliance(
  input: ComplianceInput,
  design: SystemDesign
): ComplianceOutput {
  // 1. 대기환경보전법
  const aq = applyAirQualityAct(input);
  
  // 2. 산안법
  const osh = applyOSHAct(input, design);
  
  // 3. KOSHA Guide (분진폭발 + 환기)
  const kosha = applyKOSHAGuides(input, design);
  
  // 4. 폐기물·화관·위험물·환평
  const wc = applyWasteChemActs(input, design);
  
  // 5. 보조금
  const subsidies = matchSubsidies({
    classification: aq.class_no,
    install_date: input.install_date,
    region: input.region,
    facility_age: thisYear - parseYear(input.install_date),
    fan_VFD: design.fan?.fans?.some(f => f.VFD),
    explosion_protection: kosha.zone20.length > 0,
    motor_kW_max: design.fan?.total_kW,
  }, design);
  
  // 인용 통합
  const citations = dedupe([
    ...aq.citations,
    ...osh.citations,
    ...(kosha.citations ?? []),
    ...(wc.citations ?? []),
  ]);
  
  return {
    classification: { class_no: aq.class_no, applicable_standards: aq.standards },
    emission_standards: aq.standards,
    TMS_required: aq.TMS_required,
    fugitive_dust_obligation: aq.fugitive_dust_obligation,
    VOC_obligation: aq.VOC_obligation,
    dust26_obligations: osh.dust26_obligations,
    control_velocity: osh.control_velocity,
    inspection_schedule: osh.inspection_schedule,
    prevention_plan: {
      required: osh.prevention_plan_required,
      deadline: osh.submit_deadline,
    },
    measurement: { freq: osh.measurement_freq, retention_yr: osh.retention_years },
    explosion: input.dust_flammable ? {
      ST_class: kosha.ST_class,
      zone20_areas: kosha.zones.zone20,
      zone21_areas: kosha.zones.zone21,
      zone22_areas: kosha.zones.zone22,
      vent_area_m2: kosha.vent_area_m2,
      isolation_required: kosha.isolation_required,
      ATEX_recommended: kosha.ATEX_recommended,
    } : null,
    waste_obligations: wc.obligations.filter(o => o.category === "waste"),
    chemical_obligations: wc.obligations.filter(o => ["chemical","hazardous"].includes(o.category)),
    eia_required: wc.obligations.some(o => o.category === "eia"),
    subsidies,
    citations,
    disclaimer: `본 컴플라이언스 평가는 입력값 기반 자동 추정이며, 법적 효력 또는 인증을 대체하지 않습니다. 실제 인허가·안전검사·인증은 관할기관과 공인기관을 통해 진행하십시오. 분진폭발 평가는 KOSHA D-43-2012 및 NFPA 68 식 기반이며, ATEX/IECEx 인증을 대체하지 않습니다.`,
  };
}
```

## NFPA 68 폭발벤트 면적

```typescript
function nfpa68VentArea(p: {
  V_vessel_m3: number;
  P_red_bar: number;
  P_stat_bar: number;
  Kst_bar_m_s: number;
  L_D_ratio?: number;
}): number {
  // NFPA 68 단순화 식
  const term1 = (p.Kst * Math.pow(p.V_vessel_m3, 0.75)) / Math.sqrt(p.P_red_bar - p.P_stat_bar);
  const eps_LD = 0.6;
  const L_D = p.L_D_ratio ?? 1.5;
  const term2 = 1 + eps_LD * Math.max(0, L_D - 2);
  return 1e-4 * term1 * term2;
}
```

## 12항목 출력 구조 (PDF용)

```typescript
function compileReport(output: ComplianceOutput, design: SystemDesign): ReportSections {
  return [
    {
      no: 1, title: "사업장 종별",
      content: `귀 사업장은 연간 발생량 ${design.annual_emission_t}t 기준 **${output.classification.class_no}**입니다.`,
      citation: "대기환경보전법 시행령 별표1의3",
    },
    {
      no: 2, title: "배출허용기준",
      content: tableFromStandards(output.emission_standards),
      citation: "대기환경보전법 시행규칙 별표8",
    },
    {
      no: 3, title: "TMS 부착 의무",
      content: output.TMS_required ? "**의무** — 6개월 이내 부착·연계" : "면제",
      citation: "대기환경보전법 + 대기오염측정망 운영지침",
    },
    {
      no: 4, title: "비산먼지 발생사업 신고",
      content: output.fugitive_dust_obligation ? "**의무** — 신고+저감조치" : "해당 없음",
      citation: "대기환경보전법 시행규칙 별표14",
    },
    {
      no: 5, title: "VOC 배출시설",
      content: output.VOC_obligation ? "**의무**" : "해당 없음",
      citation: "대기환경보전법 시행규칙 별표16",
    },
    {
      no: 6, title: "분진작업 26종 적용",
      content: output.dust26_obligations.map(o => `- ${o.item}`).join("\n"),
      citation: "산업안전보건기준에 관한 규칙 별표16",
    },
    {
      no: 7, title: "제어풍속 적용값",
      content: `${output.control_velocity} m/s — KOSHA W-1 별표13`,
      citation: "기준규칙 별표13 + KOSHA W-1-2019",
    },
    {
      no: 8, title: "안전검사 도래일",
      content: output.inspection_schedule.slice(0, 5).join(", "),
      citation: "산업안전보건법 제93조",
    },
    {
      no: 9, title: "유해위험방지계획서",
      content: output.prevention_plan.required ? `**제출 필요** — 마감: ${output.prevention_plan.deadline}` : "면제",
      citation: "산업안전보건법 제48조",
    },
    {
      no: 10, title: "작업환경측정",
      content: `${output.measurement.freq === "quarterly" ? "분기 1회 (발암성)" : "반기 1회"} + 보존 ${output.measurement.retention_yr}년`,
      citation: "산업안전보건법 제125조",
    },
    {
      no: 11, title: "분진폭발",
      content: output.explosion 
        ? renderExplosionSection(output.explosion)
        : "비폭발성 분진 — 해당 없음",
      citation: "KOSHA D-43-2012 + P-131-2013 + NFPA 68",
    },
    {
      no: 12, title: "보조금·융자 매칭",
      content: output.subsidies.map(s => `- **${s.name}**: ${s.subsidy_rate*100}% 지원, [${s.agency}](${s.link})`).join("\n"),
    },
    {
      no: 13, title: "면책",
      content: output.disclaimer,
      type: "disclaimer",
    },
  ];
}
```

## 단위테스트

```typescript
describe("Stage 8 — Compliance", () => {
  it("4종 사업장 → 보조금 90%", () => {
    const r = generateCompliance({
      annual_emission_t: 5,
      // ...
    } as any, mockDesign);
    expect(r.classification.class_no).toBe("4종");
    expect(r.subsidies.some(s => s.subsidy_rate >= 0.9)).toBe(true);
  });
  
  it("목분 가공 → ATEX 권장", () => {
    const r = generateCompliance({
      dust_flammable: true, Kst: 150,
      dust26_code: 13,
      V_baghouse_m3: 30,
      // ...
    } as any, mockDesign);
    expect(r.explosion?.ST_class).toBe("ST1");
    expect(r.explosion?.ATEX_recommended).toBe(true);
    expect(r.explosion?.vent_area_m2).toBeGreaterThan(0);
  });
});
```

## 면책 자동 삽입

PDF 보고서 마지막 페이지에 다음 자동삽입:

> **Disclaimer**
> 본 컴플라이언스 평가는 사용자가 입력한 데이터를 기반으로 한 자동 추정입니다. 법적 효력이 없으며, 실제 인허가·안전검사·인증은 다음 기관을 통해 진행해야 합니다:
> - 대기방지시설 인허가: 관할 시·군·구 환경부서
> - 안전검사: 안전보건공단 또는 지정검사기관
> - 유해위험방지계획서: 안전보건공단
> - 분진폭발 인증: ATEX/IECEx 공인시험기관
> - 환경영향평가: 한국환경공단
> 
> 본 자동평가는 위 절차의 사전준비 자료로만 활용하시기 바랍니다.
