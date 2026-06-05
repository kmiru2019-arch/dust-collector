"use client";
import { useMemo } from "react";
import { useDustStore } from "@/lib/store/dust-store";
import { Card, CardTitle } from "@/components/ui/Card";
import { generateBOM, bomToCSV } from "@/lib/bom";
import Link from "next/link";

export default function BOMPage() {
  const o = useDustStore((s) => s.outputs);
  const items = useMemo(() => generateBOM(o), [o]);

  const downloadCSV = () => {
    const csv = bomToCSV(items);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BOM_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">BOM (자재명세서)</h1>
        <div className="flex gap-2">
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 text-sm"
          >
            CSV 다운로드
          </button>
          <Link href="/designer/result" className="px-4 py-2 text-brand-700 hover:underline">
            ← 결과
          </Link>
        </div>
      </div>

      <Card>
        <CardTitle>장비·자재·계장 자동생성 ({items.length}건)</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2">No</th>
                <th className="text-left p-2">분류</th>
                <th className="text-left p-2">Tag</th>
                <th className="text-left p-2">품명</th>
                <th className="text-right p-2">수량</th>
                <th className="text-left p-2">규격</th>
                <th className="text-left p-2">재질</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.no} className="border-t hover:bg-gray-50">
                  <td className="p-2">{i.no}</td>
                  <td className="p-2 text-xs text-gray-600">{i.category}</td>
                  <td className="p-2 font-mono">{i.tag}</td>
                  <td className="p-2 font-medium">{i.description}</td>
                  <td className="p-2 text-right">{i.qty} {i.unit}</td>
                  <td className="p-2 text-xs">{i.spec}</td>
                  <td className="p-2 text-xs">{i.material}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
