"use client";
import { useDustStore } from "@/lib/store/dust-store";
import { WizardNav } from "@/components/designer/WizardNav";
import { Card, CardTitle, KpiCard } from "@/components/ui/Card";
import { Field, NumberInput, Select, Checkbox } from "@/components/ui/Input";
import { fmt } from "@/lib/utils";
import Link from "next/link";

const REGIONS = ["seoul","busan","incheon","daegu","daejeon","gwangju","ulsan","sejong",
  "gyeonggi","gangwon","chungbuk","chungnam","jeonbuk","jeonnam","gyeongbuk","gyeongnam","jeju"] as const;

export default function Stage8Page() {
  const inputs = useDustStore((s) => s.inputs.stage8);
  const outputs = useDustStore((s) => s.outputs.stage8);
  const setInput = useDustStore((s) => s.setStage8Input);

  return (
    <>
      <WizardNav currentStage={8} />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Stage 8 — 안전·법규</CardTitle>
          <div className="space-y-4">
            <Field label="사업장 소재지">
              <Select
                value={inputs?.region ?? "gyeonggi"}
                onChange={(e) => setInput({ region: e.target.value as any })}
              >
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </Field>
            <Field label="시설 형식">
              <Select
                value={inputs?.facility_type ?? "general"}
                onChange={(e) => setInput({ facility_type: e.target.value as any })}
              >
                <option value="general">일반산업</option>
                <option value="boiler">보일러</option>
                <option value="cement_kiln">시멘트 킬른</option>
                <option value="cement_mill">시멘트 밀</option>
                <option value="coal_power">석탄화력</option>
                <option value="msw_incineration">MSW 소각</option>
                <option value="hazardous_waste_incineration">위험폐기물 소각</option>
                <option value="iron_eaf">제철 EAF</option>
                <option value="non_ferrous">비철 제련</option>
              </Select>
            </Field>
            <Field label="연간 발생량 (t/yr)">
              <NumberInput
                value={inputs?.annual_emission_t ?? 5}
                onChange={(e) => setInput({ annual_emission_t: +e.target.value })}
                step="0.5"
              />
            </Field>
            <Field label="시설 신·증설일">
              <input type="date"
                value={inputs?.install_date ?? "2024-01-01"}
                onChange={(e) => setInput({ install_date: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="시설 면적 (m²)">
              <NumberInput
                value={inputs?.facility_size_m2 ?? 5000}
                onChange={(e) => setInput({ facility_size_m2: +e.target.value })}
              />
            </Field>
            <Field label="VOC 사용량 (t/yr)">
              <NumberInput
                value={inputs?.VOC_use_t_yr ?? 0}
                onChange={(e) => setInput({ VOC_use_t_yr: +e.target.value })}
              />
            </Field>
            <div className="space-y-2">
              <Checkbox
                label="발암성 분진"
                checked={inputs?.is_carcinogen ?? false}
                onChange={(e) => setInput({ is_carcinogen: e.target.checked })}
              />
              <Checkbox
                label="유해화학물질 취급 (화관법)"
                checked={inputs?.handles_hazardous_chemicals ?? false}
                onChange={(e) => setInput({ handles_hazardous_chemicals: e.target.checked })}
              />
              <Checkbox
                label="위험물 취급 (위험물법)"
                checked={inputs?.handles_hazardous_substances ?? false}
                onChange={(e) => setInput({ handles_hazardous_substances: e.target.checked })}
              />
              <Checkbox
                label="산업단지 내"
                checked={inputs?.is_industrial_complex ?? false}
                onChange={(e) => setInput({ is_industrial_complex: e.target.checked })}
              />
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>컴플라이언스 12항목 (자동판정)</CardTitle>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <KpiCard label="사업장 종별" value={outputs?.classification ?? "—"} big color="brand" />
              <KpiCard
                label="TMS 의무"
                value={outputs?.TMS_required ? "의무" : "면제"}
                color={outputs?.TMS_required ? "safety" : "brand"}
              />
              <KpiCard
                label="비산먼지 신고"
                value={outputs?.fugitive_dust_obligation ? "의무" : "면제"}
                color={outputs?.fugitive_dust_obligation ? "safety" : "brand"}
              />
              <KpiCard
                label="VOC 시설 적용"
                value={outputs?.VOC_obligation ? "의무" : "면제"}
              />
              <KpiCard
                label="유해위험방지계획서"
                value={outputs?.prevention_plan.required ? "필요" : "면제"}
                color={outputs?.prevention_plan.required ? "safety" : "brand"}
              />
              <KpiCard
                label="환경영향평가"
                value={outputs?.eia_required ? "필요" : "면제"}
              />
              <KpiCard
                label="작업환경측정"
                value={outputs?.measurement.freq === "quarterly" ? "분기 1회" : "반기 1회"}
                hint={`보존 ${outputs?.measurement.retention_yr}년`}
              />
              <KpiCard
                label="제어풍속 (m/s)"
                value={fmt(outputs?.control_velocity_m_s, 2)}
                hint="별표13"
              />
            </div>

            {outputs?.explosion && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm">
                <div className="font-bold text-amber-800 mb-1">⚠ 분진폭발 위험성</div>
                <div>ST 등급: <span className="font-mono font-bold">{outputs.explosion.ST_class}</span></div>
                <div>NFPA 68 폭발벤트 면적: {fmt(outputs.explosion.vent_area_m2, 2)} m²</div>
                <div>ATEX/IECEx 인증 권장 — 격리밸브 + 폭발벤트 의무</div>
                <div className="mt-1 text-xs">Zone 20: {outputs.explosion.zone20_areas.join(", ")}</div>
              </div>
            )}

            <div className="mt-3">
              <div className="font-bold text-sm mb-1">안전검사 도래일 (5건)</div>
              <div className="text-xs text-gray-700 grid grid-cols-2 gap-1">
                {outputs?.inspection_schedule.slice(0, 5).map((d) => (
                  <div key={d} className="font-mono">• {d}</div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>적용 가능 보조금 ({outputs?.subsidies.length ?? 0}건)</CardTitle>
            <div className="space-y-2">
              {outputs?.subsidies.map((s) => (
                <div key={s.id} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="font-bold">{s.name}</div>
                  <div className="text-xs text-gray-600">
                    {s.type === "loan"
                      ? `융자 (이자 ${((s.interest_rate ?? 0) * 100).toFixed(1)}%)`
                      : `${((s.subsidy_rate ?? 0) * 100).toFixed(0)}% 지원`}
                    {s.max_amount_won && ` · 한도 ${(s.max_amount_won / 1e8).toFixed(1)}억원`}
                    {` · ${s.agency}`}
                  </div>
                  {s.link && (
                    <a href={s.link} target="_blank" className="text-xs text-brand-600 hover:underline">
                      공고 페이지 →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-between">
            <Link href="/designer/stage-7" className="px-4 py-2 text-brand-700 hover:underline">← Stage 7</Link>
            <Link href="/designer/result" className="px-6 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600">
              최종 산출물 →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
