"use client";
import { useDustStore } from "@/lib/store/dust-store";
import { WizardNav } from "@/components/designer/WizardNav";
import { Card, CardTitle, KpiCard } from "@/components/ui/Card";
import { Field, Select, Checkbox, NumberInput } from "@/components/ui/Input";
import { ValidationBanner } from "@/components/designer/ValidationBanner";
import { fmt } from "@/lib/utils";
import Link from "next/link";

// Stage 5에서 선정된 1차 집진방식 → 후단 집진기 라벨/코드
const COLLECTOR_LABEL: Record<string, { label: string; code: string }> = {
  bag_filter: { label: "백필터", code: "bag" },
  cartridge: { label: "카트리지", code: "cartridge" },
  ep: { label: "전기집진기(EP)", code: "ep_dry" },
  scrubber: { label: "스크러버", code: "scrubber" },
  cyclone: { label: "사이클론", code: "bag" },
};

export default function Stage6Page() {
  const inputs = useDustStore((s) => s.inputs.stage6);
  const outputs = useDustStore((s) => s.outputs.stage6);
  const stage5Out = useDustStore((s) => s.outputs.stage5);
  const setInput = useDustStore((s) => s.setStage6Input);

  const primary = stage5Out?.primary ?? "bag_filter";
  const inherited = COLLECTOR_LABEL[primary] ?? COLLECTOR_LABEL.bag_filter;
  const skipped = inputs?.skip ?? false;
  const noCondenser = skipped || outputs?.type == null;

  return (
    <>
      <WizardNav currentStage={6} />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Stage 6 — 가스 냉각 / 응축기(HX)</CardTitle>
          <div className="space-y-4">
            {/* 응축기 사용 여부 토글 */}
            <div className="p-3 rounded-md border border-gray-200 bg-gray-50">
              <Checkbox
                label="가스 냉각·응축기 사용 안 함 (인입온도가 충분히 낮음 / 별도 냉각 불필요)"
                checked={skipped}
                onChange={(e) => setInput({ skip: e.target.checked })}
              />
              <p className="text-xs text-gray-500 mt-1">
                체크 시 이 단계를 건너뜁니다. 미체크라도 인입온도가 목표온도에 근접하면 시스템이 자동으로 '불필요'로 판정합니다.
              </p>
            </div>

            {/* 후단 집진기 — Stage 5에서 자동 상속 (읽기전용) */}
            <Field label="후단 집진기 형식 (Stage 5에서 자동 상속)">
              <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                <span className="text-sm font-medium text-gray-800">{inherited.label}</span>
                <Link href="/designer/stage-5" className="text-xs text-brand-600 hover:underline">Stage 5에서 변경 →</Link>
              </div>
            </Field>

            <fieldset disabled={skipped} className={skipped ? "opacity-40 pointer-events-none space-y-4" : "space-y-4"}>
            <Field label="연료 종류">
              <Select
                value={inputs?.fuel_type ?? "other"}
                onChange={(e) => setInput({ fuel_type: e.target.value as any })}
              >
                <option value="other">기타</option>
                <option value="coal">석탄</option>
                <option value="oil">중유</option>
                <option value="gas">가스</option>
                <option value="msw">폐기물 (MSW)</option>
              </Select>
            </Field>
            <Field label="목표 출구온도 (°C, 비우면 자동)">
              <NumberInput
                value={inputs?.T_target_C ?? ""}
                onChange={(e) => setInput({ T_target_C: +e.target.value || undefined })}
              />
            </Field>
            <Checkbox
              label="폐열 활용처 있음 (WHB·APH·ROI 평가)"
              checked={inputs?.has_waste_heat_use ?? false}
              onChange={(e) => setInput({ has_waste_heat_use: e.target.checked })}
            />
            <Field label="연간 운전시간 (h/yr)">
              <NumberInput
                value={inputs?.op_hours_yr ?? 6000}
                onChange={(e) => setInput({ op_hours_yr: +e.target.value })}
              />
            </Field>
            <Field label="전력단가 (원/kWh)">
              <NumberInput
                value={inputs?.R_kWh_won ?? 100}
                onChange={(e) => setInput({ R_kWh_won: +e.target.value })}
              />
            </Field>
            </fieldset>
          </div>
        </Card>

        <div className="space-y-4">
          {noCondenser && (
            <div className="p-4 rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-sm">
              <b>가스 냉각·응축기 불필요</b> — {skipped
                ? "사용 안 함으로 설정되었습니다."
                : "인입온도가 목표온도에 근접해 별도 냉각이 필요하지 않습니다."} 이 단계는 설계에서 생략됩니다.
            </div>
          )}
          <Card>
            <CardTitle>응축기 결정</CardTitle>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard
                label="형식"
                value={outputs?.type ?? "불필요"}
                big color="brand"
                hint="자동 선정"
              />
              <KpiCard
                label="목표 출구온도"
                value={fmt(outputs?.T_target_C, 0)}
                unit="°C"
                big color="brand"
              />
              <KpiCard
                label="황산 노점"
                value={outputs && outputs.T_dewpoint_acid_C > 0 ? fmt(outputs.T_dewpoint_acid_C, 0) : "—"}
                unit="°C"
                hint="Verhoff"
              />
              <KpiCard
                label="노점 마진"
                value={fmt(outputs?.margin_K, 0)}
                unit="K"
                color={outputs && outputs.margin_K < 20 ? "safety" : "brand"}
              />
              <KpiCard
                label="응축수량"
                value={fmt(outputs?.m_condensate_kg_h, 0)}
                unit="kg/h"
              />
              <KpiCard
                label="폐열 회수"
                value={fmt(outputs?.waste_heat_kW, 0)}
                unit="kW"
              />
              {outputs?.ROI_yr && (
                <KpiCard
                  label="ROI (회수 기간)"
                  value={fmt(outputs.ROI_yr, 1)}
                  unit="년"
                  color={outputs.ROI_yr < 3 ? "brand" : "safety"}
                />
              )}
              <KpiCard
                label="재질 권장"
                value={outputs?.material_recommendation ?? "—"}
              />
            </div>
          </Card>

          <ValidationBanner warnings={outputs?.warnings ?? []} title="응축기 검증" />

          <div className="flex justify-between">
            <Link href="/designer/stage-5" className="px-4 py-2 text-brand-700 hover:underline">← Stage 5</Link>
            <Link href="/designer/stage-7" className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700">
              Stage 7 →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
