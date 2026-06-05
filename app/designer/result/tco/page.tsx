"use client";
import { TCOChart } from "@/components/tco/TCOChart";
import Link from "next/link";

export default function TCOPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">5년 TCO (Total Cost of Ownership)</h1>
        <Link href="/designer/result" className="text-brand-700 hover:underline">← 결과</Link>
      </div>
      <TCOChart />
    </div>
  );
}
