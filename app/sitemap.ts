import type { MetadataRoute } from "next";
import { INDUSTRIES } from "@/lib/data/dust/industries";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://example.com";  // 배포 시 도메인 교체
  const today = new Date();

  const staticPages = [
    "", "/designer", "/designer/stage-1", "/designer/stage-2", "/designer/stage-3",
    "/designer/stage-4", "/designer/stage-5", "/designer/stage-6", "/designer/stage-7", "/designer/stage-8",
    "/designer/result", "/tools", "/tools/airflow", "/tools/hood", "/tools/pressure-loss", "/tools/dewpoint",
    "/industries",
  ].map((p) => ({ url: `${base}${p}`, lastModified: today, changeFrequency: "monthly" as const, priority: p === "" ? 1.0 : 0.8 }));

  const industryPages = Object.keys(INDUSTRIES).map((code) => ({
    url: `${base}/industries/${code}`,
    lastModified: today,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...industryPages];
}
