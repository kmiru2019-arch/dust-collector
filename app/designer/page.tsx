import Link from "next/link";

export default function DesignerHome() {
  return (
    <div className="max-w-3xl mx-auto py-12 text-center">
      <h1 className="text-4xl font-bold text-brand-900 mb-4">집진설비 설계</h1>
      <p className="text-lg text-gray-600 mb-8">
        Data Sheet 작성 → 간략 제시안 → 질의 수렴 → 상세설계 → 도면·보고서
      </p>
      <div className="mb-6">
        <Link
          href="/designer/datasheet"
          className="block p-8 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
        >
          <div className="text-3xl font-bold mb-1">📋 Data Sheet 작성 시작</div>
          <div className="text-sm opacity-90 mt-1">
            필수·선택 사양 입력 → 시스템 확인 → 2~3안 비교 제시 → 질의 수렴 → 설비별 상세설계
          </div>
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 text-left">
        <h2 className="font-bold mb-3">Data Sheet 컨설팅 흐름</h2>
        <ol className="space-y-2 text-sm text-gray-700">
          <li><strong>1. Data Sheet</strong> — 필수 항목 기재, 선택 항목은 드롭다운 또는 공백(자동 적용)</li>
          <li><strong>2. 시스템 확인</strong> — 누락·모호·자동채움 핵심값을 짚어 확인</li>
          <li><strong>3. 간략 제시안</strong> — 확정 사양으로 건식/습식/반건식 2~3안 + 구조도·장단점</li>
          <li><strong>4. 질의 수렴</strong> — 사용자가 먼저 자유 질의 → 시스템이 마무리 질문 → 최종 1안</li>
          <li><strong>5. 상세설계</strong> — 확정안의 설비 구성에 맞춰 필요한 단계만 (3~8단)</li>
          <li><strong>6. 산출물</strong> — P&ID · BOM · TCO · 법규 · PDF 보고서 · 슬라이드</li>
        </ol>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        전문가용 8단 수동 위저드는 <Link href="/designer/stage-1" className="underline hover:text-brand-600">여기</Link>에서 직접 진입할 수 있습니다.
      </div>
    </div>
  );
}
