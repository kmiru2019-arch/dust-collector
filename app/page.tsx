import Link from "next/link";
import { ProcessFlow } from "@/components/home/ProcessFlow";
import { ClipboardList, GitCompareArrows, Settings2, Ruler, BarChart3, ShieldCheck, Wind, Tornado, Droplet } from "lucide-react";

export const metadata = {
  title: "집진설비 자동설계 — KOSHA·대기환경보전법 엔지니어링 컨설팅",
  description: "Data Sheet 한 장으로 최적 집진설비를 제안받고, 설비 구성에 맞춘 상세설계·P&ID·BOM·5년 TCO·법규 컴플라이언스까지 자동생성.",
};

const FEATURES = [
  { Icon: ClipboardList, title: "Data Sheet 컨설팅", desc: "기본 사양만 입력하면 시스템이 핵심값을 확인하고 최적안을 제안합니다." },
  { Icon: GitCompareArrows, title: "2~3안 비교 제시", desc: "건식·습식·반건식을 구조도·장단점·TCO로 비교해 한눈에 선택." },
  { Icon: Settings2, title: "설비별 동적 상세설계", desc: "선택한 구성에 필요한 단계만 (3~8단) 자동 구성해 정밀 사이징." },
  { Icon: Ruler, title: "검증된 엔지니어링 식", desc: "KOSHA W-1·Swamee-Jain·Lapple·Deutsch·Verhoff-Banchero 동시계산." },
  { Icon: BarChart3, title: "P&ID · BOM · 5년 TCO", desc: "계통도·자재명세·총소유비용·슬라이드·PDF 보고서 자동생성." },
  { Icon: ShieldCheck, title: "법규 컴플라이언스", desc: "대기환경보전법·산안법·KOSHA·폐기물·화관법 12항목 자동 판정." },
];

const STATS = [
  { v: "38종", l: "분진 물성 DB" },
  { v: "8단", l: "정밀 설계 엔진" },
  { v: "12항목", l: "법규 자동 판정" },
  { v: "5년", l: "TCO 시뮬레이션" },
];

const STEPS = [
  { n: "01", t: "Data Sheet 작성", d: "풍량·온도·분진·목표배출 등 기본 사양 입력" },
  { n: "02", t: "시스템 확인", d: "누락·자동채움 핵심값을 짚어 확정" },
  { n: "03", t: "제안 2~3안", d: "구조도·장단점·비용으로 비교 제시" },
  { n: "04", t: "질의 수렴", d: "자유 질의 → 마무리 질문 → 최종 1안" },
  { n: "05", t: "상세설계·산출물", d: "설비별 단계 사이징 → 도면·보고서" },
];

const TOOLS = [
  { code: "airflow", title: "풍량 계산기", Icon: Wind },
  { code: "hood", title: "후드 정압", Icon: Tornado },
  { code: "pressure-loss", title: "덕트 손실", Icon: Ruler },
  { code: "dewpoint", title: "노점 계산기", Icon: Droplet },
];

export default function Home() {
  return (
    <main className="bg-white">
      {/* ───── 헤더 ───── */}
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-white tracking-tight">집진설비 설계</Link>
          <nav className="flex gap-6 text-sm text-white/80">
            <Link href="/industries" className="hover:text-white transition">산업별 솔루션</Link>
            <Link href="/tools" className="hover:text-white transition">단일 계산기</Link>
            <Link href="/designer" className="px-3 py-1.5 rounded-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition">설계 시작</Link>
          </nav>
        </div>
      </header>

      {/* ───── 히어로 ───── */}
      <section className="relative overflow-hidden bg-[#06343d] text-white">
        <div className="absolute inset-0 bg-blueprint opacity-60" />
        <div className="absolute inset-0 hero-glow" />
        <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-teal-200 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
                엔지니어링 컨설팅 · 무설치 웹앱
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] tracking-tight">
                집진설비 설계를<br />
                <span className="text-gradient-brand">데이터 한 장</span>으로.
              </h1>
              <p className="mt-6 text-lg text-teal-100/80 max-w-xl leading-relaxed">
                풍량·온도·분진 사양만 입력하면 최적 처리방식을 제안하고,
                선택한 설비 구성에 맞춰 정밀 상세설계·P&amp;ID·견적·법규 검토까지 자동으로 완성합니다.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/designer/datasheet"
                  className="px-7 py-3.5 rounded-lg bg-gradient-to-r from-teal-500 to-brand-500 text-white font-bold shadow-lg shadow-teal-900/40 hover:from-teal-400 hover:to-brand-500 transition">
                  Data Sheet 작성 시작 →
                </Link>
                <Link href="/designer"
                  className="px-7 py-3.5 rounded-lg glass text-white font-semibold hover:bg-white/15 transition">
                  설계 흐름 보기
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-teal-200/70">
                <span>KOSHA W-1</span><span>·</span>
                <span>대기환경보전법</span><span>·</span>
                <span>ACGIH</span><span>·</span>
                <span>EN 13779</span><span>·</span>
                <span>NFPA 68</span>
              </div>
            </div>

            {/* 공정 흐름 다이어그램 */}
            <div className="glass rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-teal-200">자동 생성 공정 흐름</span>
                <span className="text-[10px] text-teal-300/60">P&amp;ID PREVIEW</span>
              </div>
              <ProcessFlow />
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[["PM 효율", "99.9%"], ["목표배출", "≤10㎎"], ["5년 TCO", "자동산출"]].map(([l, v]) => (
                  <div key={l} className="rounded-lg bg-white/5 py-2">
                    <div className="text-base font-bold text-white">{v}</div>
                    <div className="text-[10px] text-teal-200/70">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* 하단 페이드 */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ───── 신뢰 지표 ───── */}
      <section className="relative -mt-4 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.l} className="rounded-xl border border-gray-200 bg-white shadow-sm px-5 py-6 text-center">
              <div className="text-3xl font-extrabold text-brand-700">{s.v}</div>
              <div className="text-sm text-gray-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── 기능 ───── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-900">설계사무소 한 팀을, 한 화면에</h2>
          <p className="mt-3 text-gray-600">제안부터 상세설계, 도면·견적·법규까지. 엔지니어링 워크플로우 전 과정을 자동화합니다.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title}
              className="group rounded-2xl border border-gray-200 bg-white p-6 hover:border-brand-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4 group-hover:scale-110 transition"><f.Icon className="w-6 h-6 text-brand-600" strokeWidth={1.8} aria-hidden="true" /></div>
              <h3 className="font-bold text-lg text-brand-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── 흐름 ───── */}
      <section className="relative bg-[#06343d] text-white overflow-hidden">
        <div className="absolute inset-0 bg-blueprint opacity-40" />
        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold">5단계 컨설팅 흐름</h2>
            <p className="mt-3 text-teal-100/70">고정된 위저드가 아니라, 당신의 설비 구성에 맞춰 흐릅니다.</p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                <div className="glass rounded-xl p-5 h-full">
                  <div className="text-2xl font-extrabold text-teal-300/90">{s.n}</div>
                  <div className="font-bold mt-2">{s.t}</div>
                  <div className="text-xs text-teal-100/70 mt-1 leading-relaxed">{s.d}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 text-teal-400/50">›</div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/designer/datasheet"
              className="inline-block px-8 py-3.5 rounded-lg bg-gradient-to-r from-teal-500 to-brand-500 text-white font-bold shadow-lg hover:from-teal-400 transition">
              지금 설계 시작하기 →
            </Link>
          </div>
        </div>
      </section>

      {/* ───── 단일 계산기 ───── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-brand-900">빠른 단일 계산기</h2>
            <p className="text-gray-600 mt-1">회원가입 없이 즉시. 표준식 기반 검증 계산.</p>
          </div>
          <Link href="/tools" className="text-sm font-semibold text-brand-700 hover:underline">전체 보기 →</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map((t) => (
            <Link key={t.code} href={`/tools/${t.code}`}
              className="group rounded-xl border border-gray-200 bg-white p-6 text-center hover:border-brand-400 hover:shadow-lg transition">
              <div className="mb-2 flex justify-center group-hover:scale-110 transition"><t.Icon className="w-7 h-7 text-brand-600" strokeWidth={1.8} aria-hidden="true" /></div>
              <div className="font-bold text-brand-900">{t.title}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ───── 푸터 ───── */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <div className="font-bold text-brand-900">집진설비 설계</div>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                엔지니어링 컨설팅 웹앱 — 본 도구는 설계 참고용이며 법적 인증을 대체하지 않습니다.
              </p>
            </div>
            <nav className="flex gap-6 text-sm text-gray-600">
              <Link href="/designer" className="hover:text-brand-700">설계 컨설팅</Link>
              <Link href="/tools" className="hover:text-brand-700">단일 계산기</Link>
              <Link href="/industries" className="hover:text-brand-700">산업별 솔루션</Link>
            </nav>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-400 space-y-2">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Link href="/terms" className="hover:text-brand-700">이용약관</Link>
              <span>·</span>
              <Link href="/privacy" className="font-semibold hover:text-brand-700">개인정보처리방침</Link>
            </div>
            <div className="leading-relaxed">
              상호 메카 마인드 · 대표 김형민 · 사업자등록번호 455-45-01423 · 경기도 고양시 덕양구 충경로 138 (행신동) · 이메일 dustcollector@mechamindlab.com
            </div>
            <div>© 2026 Dust Collector Designer · 메카 마인드</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
