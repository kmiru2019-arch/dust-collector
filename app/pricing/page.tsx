import Link from "next/link";

export const metadata = { title: "요금제 (간략) — 집진설비 설계" };

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-brand-900 mb-2 text-center">요금제 (간략)</h1>
        <p className="text-center text-gray-600 mb-8">정밀 가격은 추후 산정 — 현재는 모든 기능 무료 체험</p>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <h2 className="font-bold text-xl mb-1">Free</h2>
            <p className="text-3xl font-bold mb-4">₩0</p>
            <ul className="text-sm space-y-1 text-gray-700 mb-4">
              <li>✓ 8단 위저드 무제한</li>
              <li>✓ 단일 계산기 4종</li>
              <li>✓ 산업별 17 SEO</li>
              <li>✗ PDF 다운로드 (1건/월)</li>
            </ul>
          </div>
          <div className="p-6 bg-brand-50 border-2 border-brand-400 rounded-lg">
            <h2 className="font-bold text-xl mb-1">Pro <span className="text-xs px-2 py-0.5 bg-brand-600 text-white rounded">곧</span></h2>
            <p className="text-3xl font-bold mb-4">— /월</p>
            <ul className="text-sm space-y-1 text-gray-700 mb-4">
              <li>✓ Free 전체</li>
              <li>✓ PDF 무제한</li>
              <li>✓ BOM 엑셀</li>
              <li>✓ 회사 CI 임베드</li>
              <li>✓ 공유 링크</li>
            </ul>
          </div>
          <div className="p-6 bg-amber-50 border border-amber-300 rounded-lg">
            <h2 className="font-bold text-xl mb-1">Lifetime <span className="text-xs px-2 py-0.5 bg-amber-500 text-white rounded">v2</span></h2>
            <p className="text-3xl font-bold mb-4">— 1회</p>
            <ul className="text-sm space-y-1 text-gray-700 mb-4">
              <li>✓ Pro 전체</li>
              <li>✓ 외부 API</li>
              <li>✓ 팀 워크스페이스</li>
              <li>✓ IoT 차압 대시보드</li>
            </ul>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/designer/stage-1" className="px-6 py-3 bg-brand-600 text-white rounded font-bold">
            지금 무료로 시작 →
          </Link>
        </div>
      </div>
    </main>
  );
}
