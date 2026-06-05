"use client";
import { useRouter } from "next/navigation";
import { useConceptStore } from "@/lib/store/concept-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, NumberInput, Select, Checkbox, TextInput } from "@/components/ui/Input";
import { INDUSTRIES } from "@/lib/data/dust/industries";
import { generateConcepts } from "@/lib/concept/generator";

const REGIONS = ["seoul","busan","incheon","daegu","daejeon","gwangju","ulsan","sejong",
  "gyeonggi","gangwon","chungbuk","chungnam","jeonbuk","jeonnam","gyeongbuk","gyeongnam","jeju"] as const;

export default function BriefPage() {
  const router = useRouter();
  const brief = useConceptStore((s) => s.brief);
  const setBrief = useConceptStore((s) => s.setBrief);
  const setConstraint = useConceptStore((s) => s.setConstraint);
  const setConceptSet = useConceptStore((s) => s.setConceptSet);

  const onIndustry = (code: string) => {
    const p = INDUSTRIES[code as keyof typeof INDUSTRIES];
    setBrief({
      industry: code as any,
      T_in_C: p?.typical_gas.T_in_C ?? brief.T_in_C,
      inlet_conc_g_Nm3: p?.typical_conc_g_m3,
      target_emission_mg_Sm3: p?.target_emission_mg_Sm3,
    });
  };

  const onGenerate = () => {
    const cs = generateConcepts(brief);
    setConceptSet(cs);
    router.push("/designer/concepts");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">설계 요구사항 (Brief)</h1>
        <p className="text-gray-600 mt-1">5분 입력 → 시스템이 2~3가지 설계안을 비교 제시합니다</p>
      </div>

      <Card>
        <CardTitle>1. 공정 정보</CardTitle>
        <div className="space-y-4">
          <Field label="산업 / 공정" hint="선택 시 분진·가스 성상 자동 입력">
            <Select value={brief.industry} onChange={(e) => onIndustry(e.target.value)}>
              {Object.values(INDUSTRIES).map((p) => (
                <option key={p.code} value={p.code}>{p.label_ko}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="처리 풍량 (Nm³/h)">
              <NumberInput value={brief.flowrate_Nm3h}
                onChange={(e) => setBrief({ flowrate_Nm3h: +e.target.value })} />
            </Field>
            <Field label="가스 입구 온도 (°C)">
              <NumberInput value={brief.T_in_C}
                onChange={(e) => setBrief({ T_in_C: +e.target.value })} />
            </Field>
            <Field label="분진 농도 (g/Nm³)" hint="모르면 산업 평균 자동">
              <NumberInput value={brief.inlet_conc_g_Nm3 ?? ""}
                onChange={(e) => setBrief({ inlet_conc_g_Nm3: +e.target.value || undefined })} />
            </Field>
            <Field label="목표 배출농도 (mg/Sm³)" hint="비우면 법규 자동">
              <NumberInput value={brief.target_emission_mg_Sm3 ?? ""}
                onChange={(e) => setBrief({ target_emission_mg_Sm3: +e.target.value || undefined })} />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>2. 제약 조건</CardTitle>
        <div className="space-y-2">
          <Checkbox label="폐수 처리 불가 (습식 제외 검토)"
            checked={brief.constraints.no_wastewater ?? false}
            onChange={(e) => setConstraint("no_wastewater", e.target.checked)} />
          <Checkbox label="부지 협소 (배치 압축)"
            checked={brief.constraints.tight_space ?? false}
            onChange={(e) => setConstraint("tight_space", e.target.checked)} />
          <Checkbox label="ATEX / 방폭 인증 필요"
            checked={brief.constraints.atex_required ?? false}
            onChange={(e) => setConstraint("atex_required", e.target.checked)} />
        </div>
        <div className="mt-3">
          <Field label="예산 등급">
            <Select value={brief.budget_class ?? "medium"}
              onChange={(e) => setBrief({ budget_class: e.target.value as any })}>
              <option value="low">저예산</option>
              <option value="medium">중간</option>
              <option value="high">고예산</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card>
        <CardTitle>3. 시설·운전</CardTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="소재지">
            <Select value={brief.region} onChange={(e) => setBrief({ region: e.target.value })}>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="신·증설일">
            <input type="date" value={brief.install_date}
              onChange={(e) => setBrief({ install_date: e.target.value })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </Field>
          <Field label="운전 시간 (h/yr)">
            <NumberInput value={brief.op_hours_yr}
              onChange={(e) => setBrief({ op_hours_yr: +e.target.value })} />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <button onClick={onGenerate}
          className="px-8 py-3 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700">
          설계안 비교 생성 →
        </button>
      </div>
    </div>
  );
}
