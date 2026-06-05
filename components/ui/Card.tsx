import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg shadow-sm p-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-bold text-brand-900 mb-2", className)}>{children}</h3>;
}

export function KpiCard({
  label, value, unit, hint, big, color,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  big?: boolean;
  color?: "brand" | "safety" | "gray";
}) {
  const colorMap = {
    brand: "bg-brand-50 border-brand-200 text-brand-900",
    safety: "bg-amber-50 border-amber-200 text-amber-900",
    gray: "bg-gray-50 border-gray-200 text-gray-900",
  };
  return (
    <div className={cn("border rounded-lg p-4", colorMap[color ?? "brand"])}>
      <div className="text-xs uppercase tracking-wide opacity-70 mb-1">{label}</div>
      <div className={cn(big ? "text-3xl" : "text-2xl", "font-bold")}>
        {value}
        {unit && <span className="text-base font-normal ml-1 opacity-80">{unit}</span>}
      </div>
      {hint && <div className="text-xs opacity-60 mt-1">{hint}</div>}
    </div>
  );
}
