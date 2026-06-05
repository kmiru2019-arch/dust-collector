// 표준 입도분포 (PSD) 라이브러리

import type { PSD } from "@/lib/calc/dust/types";

export const PSD_PRESETS: Record<string, PSD> = {
  fine: {  // 흄·미세 (d50 < 1 μm)
    bins: [
      { d_um: 0.1, mass_frac: 0.10 },
      { d_um: 0.5, mass_frac: 0.30 },
      { d_um: 1.0, mass_frac: 0.30 },
      { d_um: 5, mass_frac: 0.20 },
      { d_um: 30, mass_frac: 0.10 },
    ],
  },
  fine_medium: {  // 미세 + 중간 (d50 ~ 5 μm, 시멘트킬른)
    bins: [
      { d_um: 0.5, mass_frac: 0.10 },
      { d_um: 2, mass_frac: 0.20 },
      { d_um: 5, mass_frac: 0.30 },
      { d_um: 15, mass_frac: 0.25 },
      { d_um: 50, mass_frac: 0.15 },
    ],
  },
  medium: {  // 일반산업 (d50 ~ 10 μm)
    bins: [
      { d_um: 0.5, mass_frac: 0.05 },
      { d_um: 1, mass_frac: 0.10 },
      { d_um: 5, mass_frac: 0.25 },
      { d_um: 10, mass_frac: 0.30 },
      { d_um: 30, mass_frac: 0.20 },
      { d_um: 100, mass_frac: 0.10 },
    ],
  },
  coarse: {  // 곡물·목분 (d50 ~ 100 μm)
    bins: [
      { d_um: 5, mass_frac: 0.05 },
      { d_um: 30, mass_frac: 0.20 },
      { d_um: 100, mass_frac: 0.40 },
      { d_um: 300, mass_frac: 0.25 },
      { d_um: 1000, mass_frac: 0.10 },
    ],
  },
  bimodal_metal_grinding: {  // 금속연마 — 두 봉우리
    bins: [
      { d_um: 0.5, mass_frac: 0.10 },
      { d_um: 2, mass_frac: 0.25 },
      { d_um: 10, mass_frac: 0.10 },
      { d_um: 50, mass_frac: 0.30 },
      { d_um: 200, mass_frac: 0.25 },
    ],
  },
  oil_mist: {  // 유증기 미스트
    bins: [
      { d_um: 0.3, mass_frac: 0.20 },
      { d_um: 1, mass_frac: 0.40 },
      { d_um: 5, mass_frac: 0.30 },
      { d_um: 20, mass_frac: 0.10 },
    ],
  },
};

export function lookupPSD(code: string): PSD {
  return PSD_PRESETS[code] ?? PSD_PRESETS.medium;
}

/**
 * Rosin-Rammler 분포로부터 PSD bins 생성
 * F(d) = 1 - exp(-(d/d_R)^n)
 */
export function rosinRammlerPSD(d_R_um: number, n: number = 1.0): PSD {
  const sizes = [0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 300, 1000];
  const F = sizes.map((d) => 1 - Math.exp(-Math.pow(d / d_R_um, n)));
  const bins = sizes.map((d, i) => ({
    d_um: d,
    mass_frac: i === 0 ? F[0] : F[i] - F[i - 1],
  })).filter((b) => b.mass_frac > 1e-4);
  // 정규화
  const total = bins.reduce((s, b) => s + b.mass_frac, 0);
  return { bins: bins.map((b) => ({ ...b, mass_frac: b.mass_frac / total })) };
}
