"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useDustStore } from "@/lib/store/dust-store";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, TextInput } from "@/components/ui/Input";

// PDFPreview는 클라이언트 전용 (pdf() 호출 + URL.createObjectURL)
const PDFPreview = dynamic(
  () => import("@/components/pdf/PDFPreview").then((m) => ({ default: m.PDFPreview })),
  { ssr: false, loading: () => <div className="p-8 text-center bg-gray-100 rounded">PDF 모듈 로딩 중...</div> }
);

export default function PDFPage() {
  const o = useDustStore((s) => s.outputs);
  const [project, setProject] = useState("집진설비 설계");
  const [company, setCompany] = useState("주식회사 ___");
  const [drawingNo, setDrawingNo] = useState("DC-2026-001");
  const [designer, setDesigner] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [approver, setApprover] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PDF 설계 보고서 (13 페이지)</h1>
        <Link href="/designer/result" className="text-brand-700 hover:underline">← 결과</Link>
      </div>

      <Card>
        <CardTitle>표제란 정보 (KS A 0904)</CardTitle>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="프로젝트명"><TextInput value={project} onChange={(e) => setProject(e.target.value)} /></Field>
          <Field label="회사명"><TextInput value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
          <Field label="도면번호"><TextInput value={drawingNo} onChange={(e) => setDrawingNo(e.target.value)} /></Field>
          <Field label="설계"><TextInput value={designer} onChange={(e) => setDesigner(e.target.value)} placeholder="홍길동" /></Field>
          <Field label="검토"><TextInput value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="이순신" /></Field>
          <Field label="승인"><TextInput value={approver} onChange={(e) => setApprover(e.target.value)} placeholder="세종대왕" /></Field>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          입력값은 PDF 모든 페이지 표제란에 자동 반영됩니다. 각 페이지: 표지 · 분진성상 · 후드 · 덕트 · 처리방식 · 집진기 · 응축기 · 송풍기 · P&amp;ID블록도 · 3D등각투상 · 안전 · 법규 · BOM
        </p>
      </Card>

      <PDFPreview
        outputs={o}
        project={project}
        meta={{ company, drawingNo, designer, reviewer, approver }}
      />
    </div>
  );
}
