import Link from "next/link";
import { INDUSTRIES } from "@/lib/data/dust/industries";

export const metadata = {
  title: "산업별 집진 솔루션 | 집진설비 설계",
  description: "시멘트·소각·제철·목재·곡물·용접·제련 — 17개 산업별 표준 집진방식 + 견적 위저드",
};

export default function IndustriesPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-brand-900 mb-2">산업별 집진 솔루션</h1>
        <p className="text-lg text-gray-600 mb-8">
          17개 산업의 표준 집진방식과 자동 견적 위저드
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(INDUSTRIES).map((p) => (
            <Link
              key={p.code}
              href={`/industries/${p.code}`}
              className="block p-5 bg-white border border-gray-200 rounded-lg hover:border-brand-400 hover:shadow-md transition"
            >
              <h2 className="font-bold text-brand-900 mb-1">{p.label_ko}</h2>
              <p className="text-xs text-gray-500 mb-2">{p.label_en}</p>
              <div className="text-sm text-gray-700 space-y-1">
                <div>• 분진: {p.typical_dust.name}</div>
                <div>• 표준 조합: {p.standard_combo.slice(0, 2).join(" + ")}</div>
                <div>• 목표: {p.target_emission_mg_Sm3} mg/Sm³</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
