"use client";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useDataSheetStore } from "@/lib/store/datasheet-store";
import { DATASHEET, validateRequired, fieldLabel, type DataSheetField } from "@/lib/datasheet/schema";
import { resolveSpec } from "@/lib/datasheet/autofill";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, NumberInput, TextInput, Select } from "@/components/ui/Input";

export default function DataSheetPage() {
  const router = useRouter();
  const values = useDataSheetStore((s) => s.values);
  const setValue = useDataSheetStore((s) => s.setValue);

  const missing = useMemo(() => validateRequired(values), [values]);
  const resolved = useMemo(() => resolveSpec(values), [values]);

  const renderField = (f: DataSheetField) => {
    const v = values[f.key] ?? "";
    const common = { value: v, onChange: (e: any) => setValue(f.key, f.type === "number" ? (e.target.value === "" ? "" : +e.target.value) : e.target.value) };
    return (
      <Field key={f.key} label={`${f.label}${f.required ? " *" : ""}${f.unit ? ` (${f.unit})` : ""}`} hint={f.required ? f.hint : f.hint ?? (f.autoFill ? `미입력 시: ${f.autoFill}` : undefined)}>
        {f.type === "select" ? (
          <Select {...common}>
            {/* 스키마에 이미 빈값(모름/자동) 옵션이 있으면 중복 추가하지 않음 */}
            {!f.required && !f.options?.some((o) => o.value === "") && <option value="">— 선택 —</option>}
            {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        ) : f.type === "number" ? (
          <NumberInput {...common} placeholder={f.placeholder} />
        ) : f.type === "date" ? (
          <input type="date" value={v} onChange={common.onChange}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        ) : (
          <TextInput {...common} placeholder={f.placeholder} />
        )}
      </Field>
    );
  };

  const onGenerate = () => {
    if (missing.length > 0) return;
    // 제안 전에 시스템 확인질의 단계로 이동 (자동채움·미입력 핵심값 확인)
    router.push("/designer/clarify");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">설계 Data Sheet</h1>
        <p className="text-gray-600 mt-1">필수(*)는 반드시 입력. 선택 항목은 모르면 비우세요 — 시스템이 자동 적용합니다.</p>
      </div>

      {DATASHEET.map((g) => (
        <Card key={g.id}>
          <CardTitle>{g.title}</CardTitle>
          {g.subgroups.map((sg) => (
            <div key={sg.id} className="mb-4">
              {g.subgroups.length > 1 && <div className="text-sm font-bold text-gray-500 mb-2">{sg.title}</div>}
              <div className="grid md:grid-cols-3 gap-3">
                {sg.fields.map(renderField)}
              </div>
            </div>
          ))}
        </Card>
      ))}

      {/* 자동 채움 미리보기 */}
      {resolved.autoFilled.length > 0 && (
        <Card>
          <CardTitle>🔧 자동 적용될 값 ({resolved.autoFilled.length}) — 빈 칸 처리</CardTitle>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            {resolved.autoFilled.map((a) => (
              <div key={a.key} className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">{a.label}</span>
                <span className="font-medium">{a.value} <span className="text-xs text-gray-400">({a.reason})</span></span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 검증 + 생성 */}
      <div className="flex items-center justify-between sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4">
        <div className="text-sm">
          {missing.length === 0
            ? <span className="text-green-700">✓ 필수 항목 완료 — 제시안 생성 가능</span>
            : <span className="text-amber-700">⚠ 필수 미입력: {missing.map(fieldLabel).join(", ")}</span>}
        </div>
        <button onClick={onGenerate} disabled={missing.length > 0}
          className="px-8 py-3 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 disabled:opacity-40">
          다음: 시스템 확인 →
        </button>
      </div>
    </div>
  );
}
