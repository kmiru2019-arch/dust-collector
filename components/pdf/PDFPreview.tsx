"use client";
import { useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { DesignReport } from "@/lib/pdf/DesignReport";
import type { AllStageOutputs } from "@/lib/calc/dust/types";

interface Props {
  outputs: AllStageOutputs;
  project?: string;
  meta?: {
    company?: string;
    drawingNo?: string;
    designer?: string;
    reviewer?: string;
    approver?: string;
  };
}

/**
 * React 19 + @react-pdf/renderer 4.x reconciler 호환 우회:
 *  - <PDFViewer> 직접 임베드 시 "Ro is not a function" 발생
 *  - 대신 pdf()로 Blob 생성 → object URL → <iframe> 임베드
 *  - 다운로드 버튼 별도 제공
 */
export function PDFPreview({ outputs, project, meta }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [building, setBuilding] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    async function build() {
      setBuilding(true);
      setError(null);
      for (let attempt = 0; attempt < 4 && !cancelled; attempt++) {
        try {
          const blob = await pdf(
            <DesignReport outputs={outputs} project={project} meta={meta} />
          ).toBlob();
          if (cancelled) return;
          createdUrl = URL.createObjectURL(blob);
          setUrl(createdUrl); setError(null);
          break;
        } catch (e) {
          if (attempt === 3) {
            if (!cancelled) { console.error("[PDFPreview] build failed", e); setError(e instanceof Error ? e.message : String(e)); }
          } else {
            await new Promise((r) => setTimeout(r, 1200)); // 폰트 로딩 대기 후 재시도
          }
        }
      }
      if (!cancelled) setBuilding(false);
    }
    build();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [outputs, project, meta]);

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-300 rounded text-sm text-red-900">
        <div className="font-bold mb-1">PDF 생성 실패</div>
        <div className="font-mono text-xs">{error}</div>
      </div>
    );
  }

  if (building || !url) {
    return (
      <div className="p-12 text-center bg-gray-100 border border-gray-300 rounded">
        <div className="text-2xl mb-2">📄</div>
        <div className="text-sm text-gray-700">PDF 생성 중... (Pretendard 폰트 임베드 중)</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <a
          href={url}
          download={`설계보고서_${meta?.drawingNo ?? Date.now()}.pdf`}
          className="px-4 py-2 bg-brand-600 text-white rounded text-sm font-bold hover:bg-brand-700"
        >
          📥 PDF 다운로드
        </a>
        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
        >
          새 탭에서 열기
        </a>
      </div>
      <iframe
        src={url}
        title="설계 보고서"
        className="w-full h-[820px] border border-gray-300 rounded bg-white"
      />
    </div>
  );
}
