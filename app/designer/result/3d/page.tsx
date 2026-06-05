"use client";
import { Plant3DViewer } from "@/components/viewer/Plant3DViewer";
import { Card, CardTitle } from "@/components/ui/Card";
import Link from "next/link";

export default function Page3D() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">3D 미리보기 + AR (배치)</h1>
        <Link href="/designer/result" className="text-brand-700 hover:underline">← 결과</Link>
      </div>

      <Card>
        <CardTitle>등각투상 (Isometric)</CardTitle>
        <Plant3DViewer />
      </Card>

      <Card>
        <CardTitle>현장 배치 시뮬레이션</CardTitle>
        <p className="text-sm text-gray-700">
          3D 뷰어는 현장 배치 검토용. 실제 설치 시:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
          <li>장비 배치도 (Plot Plan) — KS A 0106 도면 양식</li>
          <li>이격거리: 점검 통로 800mm 이상, 정비 공간 1500mm 이상</li>
          <li>방폭구역: Zone 20 외측 1m 이상 대피 동선</li>
          <li>덕트 경로: 굴곡 최소화, 수평/수직 명확</li>
          <li>호퍼·RV 하부 분진 수거 공간 확보</li>
        </ul>
      </Card>
    </div>
  );
}
