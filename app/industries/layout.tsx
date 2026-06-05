import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export default function IndustriesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      {children}
    </div>
  );
}
