import { cn } from "@/lib/utils";

export function ValidationBanner({ warnings, title }: { warnings: string[]; title?: string }) {
  if (warnings.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
        ✓ {title ?? "검증 통과"} — 경고 없음
      </div>
    );
  }
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-900">
      <div className="font-medium mb-1">⚠ {title ?? "검증 경고"} ({warnings.length})</div>
      <ul className="list-disc list-inside space-y-0.5">
        {warnings.map((w, i) => <li key={i}>{w}</li>)}
      </ul>
    </div>
  );
}
