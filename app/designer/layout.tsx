import type { ReactNode } from "react";
import Link from "next/link";
import { EnsureCalc } from "@/components/designer/EnsureCalc";

export default function DesignerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnsureCalc />
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-brand-900">
            집진설비 설계
          </Link>
          <nav className="flex gap-4 text-sm text-gray-600">
            <Link href="/" className="hover:text-brand-700">홈</Link>
            <Link href="/tools" className="hover:text-brand-700">단일 계산기</Link>
            <Link href="/industries" className="hover:text-brand-700">산업별 솔루션</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
