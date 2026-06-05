import { describe, it, expect } from "vitest";
import { designScrubber, calvertVenturiDP, nukiyamaTanasawa, yungEfficiency } from "../05-scrubber";
import type { PSD } from "../types";

const psd_fine: PSD = {
  bins: [
    { d_um: 0.5, mass_frac: 0.4 },
    { d_um: 1, mass_frac: 0.3 },
    { d_um: 5, mass_frac: 0.3 },
  ],
};

describe("Stage 5-D — Scrubber", () => {
  describe("nukiyamaTanasawa", () => {
    it("V 90 m/s, L/G 1.0 → 액적 ~200 μm", () => {
      const d_drop_m = nukiyamaTanasawa(90, 1.0);
      const d_drop_um = d_drop_m * 1e6;
      expect(d_drop_um).toBeGreaterThan(150);
      expect(d_drop_um).toBeLessThan(300);
    });
  });

  describe("calvertVenturiDP", () => {
    it("V 90, L/G 1.0 → 약 2.0 kPa", () => {
      const dP = calvertVenturiDP(90, 1.0);
      // 0.256 × 90² × 1.0 = 2074 Pa
      expect(dP).toBeCloseTo(2074, -2);
    });
    it("V 120, L/G 1.5 → 더 큼", () => {
      const dP_low = calvertVenturiDP(90, 1.0);
      const dP_high = calvertVenturiDP(120, 1.5);
      expect(dP_high).toBeGreaterThan(dP_low * 2);
    });
  });

  describe("yungEfficiency", () => {
    it("큰 입자(10μm) → 높은 효율", () => {
      expect(yungEfficiency(10, 90, 1.5)).toBeGreaterThan(0.5);
    });
    it("작은 입자(0.1μm) → 낮은 효율", () => {
      expect(yungEfficiency(0.1, 90, 1.5)).toBeLessThan(0.5);
    });
  });

  describe("designScrubber", () => {
    it("벤추리 99% → V_throat 120, ΔP 큼", () => {
      const r = designScrubber({
        type: "venturi", Q_m3s: 5, inlet_conc_g_m3: 5,
        particle_dist: psd_fine, gas_chemistry: {}, target_efficiency: 0.99,
      });
      expect(r.V_throat_m_s).toBe(120);
      expect(r.dP_Pa).toBeGreaterThan(3000);
    });

    it("SDA — SO₂ 300ppm → 반응물 소요", () => {
      const r = designScrubber({
        type: "sda", Q_m3s: 10, inlet_conc_g_m3: 5,
        particle_dist: psd_fine,
        gas_chemistry: { SO2_ppm: 300, HCl_ppm: 0 },
        target_efficiency: 0.95,
      });
      expect(r.reagent_consumption_kg_h).toBeGreaterThan(0);
      expect(r.wastewater_m3h).toBe(0);  // 반건식 핵심
    });

    it("패킹베드 — 기본 L/G 3.0", () => {
      const r = designScrubber({
        type: "packed", Q_m3s: 5, inlet_conc_g_m3: 1,
        particle_dist: psd_fine, gas_chemistry: {}, target_efficiency: 0.85,
      });
      expect(r.L_G_L_per_m3).toBe(3.0);
    });

    it("스프레이 — 저저항·저효율", () => {
      const r = designScrubber({
        type: "spray", Q_m3s: 5, inlet_conc_g_m3: 1,
        particle_dist: psd_fine, gas_chemistry: {}, target_efficiency: 0.7,
      });
      expect(r.dP_Pa).toBeLessThan(1000);
      expect(r.efficiency_overall).toBeLessThan(0.8);
    });

    it("사이클로닉 — 미스트 분리", () => {
      const r = designScrubber({
        type: "cyclonic", Q_m3s: 5, inlet_conc_g_m3: 0,
        particle_dist: psd_fine, gas_chemistry: {}, target_efficiency: 0.95,
      });
      expect(r.efficiency_overall).toBeGreaterThan(0.9);
    });
  });
});
