import Link from "next/link";

export const metadata = {
  title: "단일 계산기 | 집진설비 설계",
  description: "풍량·후드·정압손실·노점 4개 무료 계산기. KOSHA W-1 + ACGIH 기준.",
};

const TOOLS = [
  { code: "airflow", title: "풍량 계산기", desc: "후드 풍량 (KOSHA W-1)", icon: "💨" },
  { code: "hood", title: "후드 정압손실", desc: "(1+K)·ρ·V²/2", icon: "🌪️" },
  { code: "pressure-loss", title: "덕트 정압손실", desc: "Darcy + 손실계수", icon: "📐" },
  { code: "dewpoint", title: "노점 계산기", desc: "Verhoff-Banchero 황산", icon: "💧" },
  { code: "lottery", title: "로또 6/45 추출기", desc: "통계 분석 + 구조 제약 추출", icon: "🎰" },
];

export default function ToolsHome() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-brand-900 mb-2">단일 계산기</h1>
        <p className="text-lg text-gray-600 mb-8">회원가입 없이 즉시 계산. KOSHA W-1 + ACGIH 표준 적용.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {TOOLS.map((t) => (
            <Link
              key={t.code}
              href={`/tools/${t.code}`}
              className="block p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-brand-400 hover:shadow-md transition"
            >
              <div className="text-4xl mb-2">{t.icon}</div>
              <h2 className="font-bold text-lg text-brand-900">{t.title}</h2>
              <p className="text-sm text-gray-600">{t.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
