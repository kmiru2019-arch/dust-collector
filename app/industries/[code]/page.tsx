import { INDUSTRIES } from "@/lib/data/dust/industries";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return Object.keys(INDUSTRIES).map((code) => ({ code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = INDUSTRIES[code as keyof typeof INDUSTRIES];
  if (!profile) return {};
  return {
    title: `${profile.label_ko} 집진설비 — 표준 설계 + 자동 견적`,
    description: `${profile.label_ko} 집진처리: ${profile.standard_combo.join(", ")}. KOSHA·대기환경보전법 적용. 무료 자동 사이징.`,
  };
}

export default async function IndustryDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = INDUSTRIES[code as keyof typeof INDUSTRIES];
  if (!profile) notFound();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/industries" className="text-sm text-brand-700 hover:underline">← 산업 목록</Link>
        <h1 className="text-4xl font-bold text-brand-900 mt-2 mb-1">{profile.label_ko}</h1>
        <p className="text-lg text-gray-600 mb-8">{profile.label_en} — 집진설비 표준 설계</p>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="p-5 bg-white border border-gray-200 rounded-lg">
            <h2 className="font-bold mb-2">분진 특성</h2>
            <ul className="text-sm space-y-1">
              <li>• 분진명: {profile.typical_dust.name}</li>
              <li>• d50: {profile.typical_dust.d50_um} μm</li>
              <li>• 입자밀도: {profile.typical_dust.particle_density_kg_m3} kg/m³</li>
              {profile.typical_dust.flammable && (
                <li className="text-amber-700">• ⚠ 폭발성 (Kst {profile.typical_dust.Kst_bar_m_s})</li>
              )}
              {profile.typical_dust.resistivity_Ohm_cm && (
                <li>• 비저항: {profile.typical_dust.resistivity_Ohm_cm.toExponential(0)} Ω·cm</li>
              )}
            </ul>
          </div>

          <div className="p-5 bg-white border border-gray-200 rounded-lg">
            <h2 className="font-bold mb-2">가스 조건</h2>
            <ul className="text-sm space-y-1">
              <li>• 운전 온도: {profile.typical_gas.T_in_C}°C</li>
              {profile.typical_gas.SO2_ppm && <li>• SO₂: {profile.typical_gas.SO2_ppm} ppm</li>}
              {profile.typical_gas.NOx_ppm && <li>• NOx: {profile.typical_gas.NOx_ppm} ppm</li>}
              {profile.typical_gas.HCl_ppm && <li>• HCl: {profile.typical_gas.HCl_ppm} ppm</li>}
              {profile.typical_gas.Hg_ug_Nm3 && <li>• Hg: {profile.typical_gas.Hg_ug_Nm3} μg/Nm³</li>}
              <li>• 일반 분진농도: {profile.typical_conc_g_m3} g/Nm³</li>
            </ul>
          </div>
        </div>

        <div className="p-5 bg-brand-50 border-2 border-brand-300 rounded-lg mb-6">
          <h2 className="font-bold text-brand-900 mb-2">표준 집진 조합</h2>
          <div className="text-lg font-mono text-brand-800">
            {profile.standard_combo.join(" → ")}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            목표 배출농도: {profile.target_emission_mg_Sm3} mg/Sm³
          </div>
          <div className="mt-2 text-xs text-gray-500">프리셋: {profile.preset}</div>
        </div>

        {profile.notes && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900 mb-6">
            <strong>주의:</strong> {profile.notes}
          </div>
        )}

        {profile.references.length > 0 && (
          <div className="p-4 bg-white border border-gray-200 rounded mb-6">
            <h3 className="font-bold text-sm mb-1">참고 표준</h3>
            <ul className="text-xs text-gray-600 space-y-0.5">
              {profile.references.map((r) => <li key={r}>• {r}</li>)}
            </ul>
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            href="/designer/stage-1"
            className="inline-block px-8 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold"
          >
            이 산업의 자동 설계 시작 →
          </Link>
        </div>
      </div>
    </main>
  );
}
