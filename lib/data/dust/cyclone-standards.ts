// 사이클론 6종 표준비율
// 출처: Stairmand 1951, Lapple 1950, Swift 1969, Peterson-Whitby

import type { CycloneStandardCode } from "@/lib/calc/dust/types";

export interface CycloneRatios {
  a_D: number;
  b_D: number;
  De_D: number;
  S_D: number;
  h_D: number;
  H_D: number;
  B_D: number;
  K_NH: number;       // ΔP NH 계수
  N_e: number;        // 유효회전수
  label: string;
  use: string;
}

export const CYCLONE_STANDARDS: Record<CycloneStandardCode, CycloneRatios> = {
  Stairmand_HE: {
    a_D: 0.50, b_D: 0.20, De_D: 0.50, S_D: 0.50,
    h_D: 1.50, H_D: 4.00, B_D: 0.375,
    K_NH: 6.4, N_e: 5,
    label: "Stairmand High-Efficiency",
    use: "정밀집진 (d50 작음)",
  },
  Stairmand_HT: {
    a_D: 0.75, b_D: 0.375, De_D: 0.75, S_D: 0.875,
    h_D: 1.50, H_D: 4.00, B_D: 0.375,
    K_NH: 7.5, N_e: 4,
    label: "Stairmand High-Throughput",
    use: "대용량 전처리",
  },
  Lapple: {
    a_D: 0.50, b_D: 0.25, De_D: 0.50, S_D: 0.625,
    h_D: 2.00, H_D: 4.00, B_D: 0.25,
    K_NH: 8.0, N_e: 5,
    label: "Lapple GP",
    use: "일반산업 균형",
  },
  Swift_HE: {
    a_D: 0.44, b_D: 0.21, De_D: 0.40, S_D: 0.50,
    h_D: 1.40, H_D: 3.90, B_D: 0.40,
    K_NH: 9.24, N_e: 6,
    label: "Swift High-Efficiency",
    use: "미세분진",
  },
  Swift_GP: {
    a_D: 0.50, b_D: 0.25, De_D: 0.50, S_D: 0.60,
    h_D: 1.75, H_D: 3.75, B_D: 0.40,
    K_NH: 8.0, N_e: 5,
    label: "Swift GP",
    use: "균형형",
  },
  Peterson: {
    a_D: 0.583, b_D: 0.208, De_D: 0.50, S_D: 0.583,
    h_D: 1.333, H_D: 3.917, B_D: 0.50,
    K_NH: 7.0, N_e: 5,
    label: "Peterson-Whitby",
    use: "특수",
  },
};
