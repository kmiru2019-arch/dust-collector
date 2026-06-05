"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDataSheetStore } from "@/lib/store/datasheet-store";
import { useProposalStore } from "@/lib/store/proposal-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { buildClarifications } from "@/lib/converge/clarify";
import { resolveSpec } from "@/lib/datasheet/autofill";
import { generateProposals } from "@/lib/proposal/generator";
import type { DataSheetField } from "@/lib/datasheet/schema";

export default function ClarifyPage() {
  const router = useRouter();
  const values = useDataSheetStore((s) => s.values);
  const setValue = useDataSheetStore((s) => s.setValue);
  const setProposalSet = useProposalStore((s) => s.setProposalSet);

  // 데이터시트가 비어있으면 안내
  const hasData = values.flow_Nm3h !== undefined && values.flow_Nm3h !== "";

  const { clarifications } = useMemo(() => buildClarifications(values), [values]);

  // 사용자가 이 화면에서 조정한 값 (key→value). 미조정이면 자동값 유지
  const [overrides, setOverrides] = useState<Record<string, any>>({});

  if (!hasData) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <h1 className="text-xl font-bold mb-2">먼저 Data Sheet를 작성하세요</h1>
        <a href="/designer/datasheet" className="inline-block px-4 py-2 bg-brand-600 text-white rounded font-bold">Data Sheet 작성하러 가기</a>
      </div>
    );
  }

  const renderInput = (c: ReturnType<typeof buildClarifications>["clarifications"][number]) => {
    const f: DataSheetField = c.field;
    const cur = overrides[c.key] ?? (c.effectiveValue === "(없음)" ? "" : c.effectiveValue);
    const onChange = (val: any) => setOverrides((o) => ({ ...o, [c.key]: val }));

    if (f.type === "select") {
      return (
        <select value={String(cur)} onChange={(e) => onChange(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm">
          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    return (
      <input type="number" value={cur} onChange={(e) => onChange(e.target.value === "" ? "" : +e.target.value)}
        className="border border-gray-300 rounded px-3 py-1.5 text-sm w-36" placeholder="값 입력" />
    );
  };

  const onConfirm = () => {
    // 조정값을 datasheet 스토어에 반영
    Object.entries(overrides).forEach(([k, v]) => {
      if (v !== "" && v !== undefined && v !== null) setValue(k, v);
    });
    // 반영된 최신 값으로 제안 생성
    const merged = { ...values, ...Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== "" && v != null)) };
    const resolved = resolveSpec(merged);
    const ps = generateProposals(resolved.values);
    setProposalSet(ps);
    router.push("/designer/proposals");
  };

  return (
    <div className="max-w-3xl mx-auto p-6 pb-12">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-brand-900">시스템 확인</h1>
        <p className="text-gray-600 text-sm mt-1">
          제안을 만들기 전에, 제안 선정에 영향을 주는 핵심값을 확인합니다.
          {clarifications.length === 0
            ? " 확인할 항목이 없어 바로 제안을 생성할 수 있습니다."
            : " 자동 적용된 값이 맞는지 보고, 다르면 바로 수정하세요."}
        </p>
      </div>

      {clarifications.length > 0 ? (
        <div className="space-y-3">
          {clarifications.map((c) => (
            <Card key={c.key} className={c.source === "missing" ? "border-amber-300" : ""}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{c.label}{c.unit ? ` (${c.unit})` : ""}</span>
                    <span className={[
                      "text-[10px] px-1.5 py-0.5 rounded font-bold",
                      c.source === "auto" ? "bg-brand-50 text-brand-700" : "bg-amber-100 text-amber-700",
                    ].join(" ")}>{c.source === "auto" ? "자동 적용" : "미입력"}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{c.question}</div>
                  {c.reason && <div className="text-[11px] text-gray-400 mt-0.5">근거: {c.reason}</div>}
                  <div className="text-[11px] text-brand-600 mt-0.5">영향: {c.impact}</div>
                </div>
                <div className="shrink-0 pt-1">{renderInput(c)}</div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><div className="text-sm text-gray-600">모든 핵심값이 직접 입력되어 추가 확인이 필요 없습니다.</div></Card>
      )}

      <div className="flex gap-2 mt-6">
        <button onClick={() => router.push("/designer/datasheet")}
          className="px-4 py-2 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">← Data Sheet 수정</button>
        <button onClick={onConfirm}
          className="px-5 py-2 rounded bg-brand-600 text-white text-sm font-bold hover:bg-brand-700">
          확인 완료 — 제안 생성 →
        </button>
      </div>
    </div>
  );
}
