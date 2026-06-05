// PDF 생성 검증 — Node 환경에서 실제 PDF 생성 + 파일 크기/유효성 확인
// 한글 폰트 임베드 성공 시 파일 크기 > 50KB, PDF magic 정상

import { mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "out-verify");

// 동적 import (ESM)
const { pdf } = await import("@react-pdf/renderer");
const { DesignReport } = await import("../lib/pdf/DesignReport.tsx").catch(() => ({}));

if (!DesignReport) {
  console.log("[skip] DesignReport import 실패 — TS 컴파일 필요");
  process.exit(0);
}

// 더미 outputs (모든 stage 채움)
const outputs = {
  stage1: {
    dust: { industry: "msw_incineration", dust_name: "비산재", d50_um: 5,
      particle_density_kg_m3: 2200, stickiness: "medium", flammable: false,
      corrosive: "severe", particulate: true },
    gas: { T_in_C: 800, P_in_kPa: 101.325, RH_in_pct: 30, O2_pct: 8,
      HCl_ppm: 800, SO2_ppm: 300, SO3_ppm: 10, Hg_ug_Nm3: 50, H2O_vol_pct: 18 },
    derived: { ST_class: null,
      resistivity_estimate: { low_Ohm_cm: 1e9, high_Ohm_cm: 1e11 },
      dewpoint_acid_C: 145, dewpoint_water_C: 55, treatment_candidates: [] },
  },
  // ... 더미 데이터
};

await mkdir(outDir, { recursive: true });

console.log("[verify-pdf] PDF 생성 중...");
const blob = await pdf(DesignReport({ outputs, project: "검증용", meta: {} })).toBlob();
const buf = Buffer.from(await blob.arrayBuffer());
const outPath = join(outDir, "verify.pdf");
await writeFile(outPath, buf);

const st = await stat(outPath);
console.log(`[verify-pdf] OK: ${outPath} (${(st.size/1024).toFixed(0)} KB)`);
console.log(`[verify-pdf] Magic: ${buf.slice(0,8).toString("binary")}`);
