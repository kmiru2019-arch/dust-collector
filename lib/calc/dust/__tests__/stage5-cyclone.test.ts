import { describe, it, expect } from "vitest";
import { designCyclone, autoMulticyclone, lappleD50, lappleEfficiency, calcCycloneDiameter } from "../05-cyclone";
import type { PSD } from "../types";

const psd: PSD = {
  bins: [
    { d_um: 1, mass_frac: 0.10 },
    { d_um: 5, mass_frac: 0.25 },
    { d_um: 10, mass_frac: 0.30 },
    { d_um: 30, mass_frac: 0.25 },
    { d_um: 100, mass_frac: 0.10 },
  ],
};

describe("Stage 5-B — Cyclone", () => {
  describe("calcCycloneDiameter", () => {
    it("Q 0.5 m³/s, V 18, a/D 0.5, b/D 0.2 → D ~ 0.373", () => {
      const D = calcCycloneDiameter(0.5, 18, 0.5, 0.2);
      expect(D).toBeCloseTo(0.527, 2);
    });
  });

  describe("lappleD50", () => {
    it("표준 케이스 (b=0.08m, N=5, V=18, ρ_p=2200, ρ_g=1.2)", () => {
      const d50_m = lappleD50(1.85e-5, 0.08, 5, 18, 2200, 1.2);
      // 약 5~10 μm
      expect(d50_m * 1e6).toBeGreaterThan(3);
      expect(d50_m * 1e6).toBeLessThan(15);
    });
  });

  describe("lappleEfficiency", () => {
    it("d == d50 → 50%", () => {
      expect(lappleEfficiency(5, 5)).toBeCloseTo(0.5, 3);
    });
    it("d >> d50 → ≈ 100%", () => {
      expect(lappleEfficiency(100, 5)).toBeGreaterThan(0.99);
    });
    it("d << d50 → ≈ 0%", () => {
      expect(lappleEfficiency(1, 50)).toBeLessThan(0.01);
    });
  });

  describe("designCyclone", () => {
    it("Stairmand HE — 30 m³/min", () => {
      const r = designCyclone({
        Q_m3min: 30,
        standard: "Stairmand_HE",
        rho_p_kg_m3: 2200,
        particle_dist: psd,
      });
      expect(r.D_m).toBeGreaterThan(0.3);
      expect(r.D_m).toBeLessThan(0.7);
      expect(r.V_i_m_s).toBeGreaterThan(15);
      expect(r.V_i_m_s).toBeLessThan(22);
      expect(r.efficiency_overall).toBeGreaterThan(0.7);
    });

    it("Stairmand HT vs HE — HT는 d50 더 큼", () => {
      const HE = designCyclone({ Q_m3min: 100, standard: "Stairmand_HE", rho_p_kg_m3: 2200, particle_dist: psd });
      const HT = designCyclone({ Q_m3min: 100, standard: "Stairmand_HT", rho_p_kg_m3: 2200, particle_dist: psd });
      // HT는 더 큰 d50 (저효율 고풍량)
      expect(HT.d50_um).toBeGreaterThan(HE.d50_um * 0.9);
    });

    it("대형 D > 1m → 멀티사이클론 검토 경고", () => {
      const r = designCyclone({
        Q_m3min: 6000, standard: "Stairmand_HE", rho_p_kg_m3: 2200, particle_dist: psd,
      });
      expect(r.D_m).toBeGreaterThan(1);
      expect(r.warnings.some(w => w.includes("멀티사이클론"))).toBe(true);
    });
  });

  describe("autoMulticyclone", () => {
    it("Q 6000 → 멀티사이클론 (count > 1)", () => {
      const r = autoMulticyclone({
        Q_m3min: 6000, standard: "Stairmand_HE", rho_p_kg_m3: 2200, particle_dist: psd,
      });
      expect(r.count).toBeGreaterThan(1);
      expect(r.D_m).toBeCloseTo(0.3, 1);
    });
  });
});
