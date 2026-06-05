"use client";
import { ComplianceReport } from "@/components/compliance/ComplianceReport";
import Link from "next/link";

export default function ComplianceResultPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">법규 컴플라이언스 리포트 (12항목)</h1>
        <Link href="/designer/result" className="text-brand-700 hover:underline">← 결과</Link>
      </div>
      <ComplianceReport />
    </div>
  );
}
