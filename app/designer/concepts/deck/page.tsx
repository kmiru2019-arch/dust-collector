"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useConceptStore } from "@/lib/store/concept-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, TextInput } from "@/components/ui/Input";
import { conceptSetToMarkdown } from "@/lib/concept/notebooklm-export";
import Link from "next/link";

const DeckPreview = dynamic(
  () => import("@/components/pdf/DeckPreview").then((m) => ({ default: m.DeckPreview })),
  { ssr: false, loading: () => <div className="p-8 text-center bg-gray-100 rounded">슬라이드 모듈 로딩 중...</div> }
);

export default function DeckPage() {
  const conceptSet = useConceptStore((s) => s.conceptSet);
  const [company, setCompany] = useState("주식회사 ___");
  const [project, setProject] = useState("집진설비 설계");
  const [pptxBusy, setPptxBusy] = useState(false);

  if (!conceptSet) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <div className="text-gray-600">설계안이 없습니다.</div>
        <Link href="/designer/brief" className="inline-block px-6 py-2.5 bg-brand-600 text-white rounded-lg font-bold">Brief 입력하기 →</Link>
      </div>
    );
  }

  const downloadMarkdown = () => {
    const md = conceptSetToMarkdown(conceptSet, project);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `설계안비교_${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPptx = async () => {
    setPptxBusy(true);
    try {
      const { buildConceptPptx } = await import("@/lib/pptx/concept-pptx");
      const blob = await buildConceptPptx(conceptSet, { company, project });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `설계안비교_${Date.now()}.pptx`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("PowerPoint 생성 실패: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setPptxBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">설계안 비교 — 슬라이드 / 보고서</h1>
        <Link href="/designer/concepts" className="text-brand-700 hover:underline text-sm">← 안 비교로</Link>
      </div>

      <Card>
        <CardTitle>문서 정보</CardTitle>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="프로젝트명"><TextInput value={project} onChange={(e) => setProject(e.target.value)} /></Field>
          <Field label="회사명"><TextInput value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
        </div>
      </Card>

      <Card>
        <CardTitle>📑 슬라이드 데크 (임원·구매·발주자용, 6장)</CardTitle>
        <p className="text-xs text-gray-500 mb-3">표지 · 요약 · 조건 · 3안 비교표 · 1순위 상세 · 다음 단계</p>
        <div className="mb-3">
          <button onClick={downloadPptx} disabled={pptxBusy}
            className="px-4 py-2 bg-amber-500 text-white rounded text-sm font-bold hover:bg-amber-600 disabled:opacity-50">
            {pptxBusy ? "PowerPoint 생성 중..." : "📊 PowerPoint(.pptx) 다운로드 — 편집 가능"}
          </button>
          <span className="text-xs text-gray-500 ml-2">발표·수정용. 아래는 PDF 미리보기</span>
        </div>
        <DeckPreview conceptSet={conceptSet} company={company} project={project} />
      </Card>

      <Card>
        <CardTitle>🎙 NotebookLM 연동 (Markdown)</CardTitle>
        <p className="text-sm text-gray-600 mb-2">
          Markdown을 다운로드 후 <a href="https://notebooklm.google.com" target="_blank" className="text-brand-600 underline">NotebookLM</a>에 업로드하면
          Audio Overview(팟캐스트형 요약)·FAQ·Study Guide를 자동 생성할 수 있습니다.
        </p>
        <button onClick={downloadMarkdown}
          className="px-4 py-2 bg-brand-600 text-white rounded text-sm font-bold hover:bg-brand-700">
          📥 Markdown 다운로드
        </button>
      </Card>
    </div>
  );
}
