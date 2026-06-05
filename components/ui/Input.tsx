import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

export function Field({
  label, hint, children, error,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
      {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
    </label>
  );
}

export function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      {...props}
      className={cn(
        "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm",
        "focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none",
        props.className
      )}
    />
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      {...props}
      className={cn(
        "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm",
        "focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none",
        props.className
      )}
    />
  );
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      {...props}
      className={cn(
        "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white",
        "focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none",
        props.className
      )}
    >
      {children}
    </select>
  );
}

export function Checkbox({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" {...props} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
