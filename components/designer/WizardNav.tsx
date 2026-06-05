"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDustStore } from "@/lib/store/dust-store";

const STAGES = [
  { n: 1, label: "분진/가스 성상", short: "Stage 1" },
  { n: 2, label: "후드 설계", short: "Stage 2" },
  { n: 3, label: "덕트 사이징", short: "Stage 3" },
  { n: 4, label: "처리방식", short: "Stage 4" },
  { n: 5, label: "집진방식", short: "Stage 5" },
  { n: 6, label: "응축기/HX", short: "Stage 6" },
  { n: 7, label: "송풍기", short: "Stage 7" },
  { n: 8, label: "안전·법규", short: "Stage 8" },
] as const;

export function WizardNav({ currentStage }: { currentStage: number }) {
  const outputs = useDustStore((s) => s.outputs);

  return (
    <nav className="flex flex-wrap gap-2 mb-6 p-4 bg-white border border-gray-200 rounded-lg">
      {STAGES.map((s) => {
        const active = s.n === currentStage;
        const completed = !!(outputs as any)[`stage${s.n}`];
        return (
          <Link
            key={s.n}
            href={`/designer/stage-${s.n}`}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border transition",
              active && "bg-brand-600 text-white border-brand-600",
              !active && completed && "bg-brand-50 text-brand-700 border-brand-200",
              !active && !completed && "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
            )}
          >
            <span className={cn(
              "w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold",
              active && "bg-white text-brand-600",
              !active && completed && "bg-brand-600 text-white",
              !active && !completed && "bg-gray-300 text-gray-600"
            )}>
              {completed && !active ? "✓" : s.n}
            </span>
            <span className="hidden md:inline">{s.label}</span>
            <span className="md:hidden">{s.short}</span>
          </Link>
        );
      })}
      <Link
        href="/designer/result"
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border transition ml-auto",
          currentStage === 9
            ? "bg-amber-500 text-white border-amber-500"
            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
        )}
      >
        <span className="font-bold">→</span>
        <span>최종 산출물</span>
      </Link>
    </nav>
  );
}
