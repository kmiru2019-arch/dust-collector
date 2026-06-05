import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number | undefined, digits: number = 1, unit?: string): string {
  if (n == null || isNaN(n)) return "-";
  const s = n.toLocaleString("ko-KR", { maximumFractionDigits: digits });
  return unit ? `${s} ${unit}` : s;
}

export function fmtPa_to_mmAq(Pa: number): string {
  return fmt(Pa / 9.81, 0, "mmAq");
}

export function fmtKWh(kWh: number): string {
  if (kWh >= 1e6) return fmt(kWh / 1e6, 2, "GWh/yr");
  if (kWh >= 1e3) return fmt(kWh / 1e3, 1, "MWh/yr");
  return fmt(kWh, 0, "kWh/yr");
}
