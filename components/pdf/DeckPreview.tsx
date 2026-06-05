"use client";
import { useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { ConceptDeck } from "@/lib/pdf/ConceptDeck";
import type { ConceptSet } from "@/lib/concept/types";

export function DeckPreview({ conceptSet, company, project }: {
  conceptSet: ConceptSet; company?: string; project?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [building, setBuilding] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let created: string | null = null;
    (async () => {
      setBuilding(true); setErr(null);
      for (let attempt = 0; attempt < 4 && !cancelled; attempt++) {
        try {
          const blob = await pdf(<ConceptDeck conceptSet={conceptSet} company={company} project={project} />).toBlob();
          if (cancelled) return;
          created = URL.createObjectURL(blob);
          setUrl(created); setErr(null);
          break;
        } catch (e) {
          if (attempt === 3) { if (!cancelled) setErr(e instanceof Error ? e.message : String(e)); }
          else await new Promise((r) => setTimeout(r, 1200)); // 폰트 로딩 대기
        }
      }
      if (!cancelled) setBuilding(false);
    })();
    return () => { cancelled = true; if (created) URL.revokeObjectURL(created); };
  }, [conceptSet, company, project]);

  if (err) return <div className="p-6 bg-red-50 border border-red-300 rounded text-sm text-red-900"><b>슬라이드 생성 실패</b><br/>{err}</div>;
  if (building || !url) return <div className="p-12 text-center bg-gray-100 rounded">📊 슬라이드 생성 중...</div>;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <a href={url} download={`설계안비교_${Date.now()}.pdf`}
          className="px-4 py-2 bg-brand-600 text-white rounded text-sm font-bold hover:bg-brand-700">📥 슬라이드 다운로드</a>
        <a href={url} target="_blank" rel="noopener"
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">새 탭에서 열기</a>
      </div>
      <iframe src={url} title="설계안 비교 슬라이드" className="w-full h-[700px] border border-gray-300 rounded bg-white" />
    </div>
  );
}
