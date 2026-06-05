import { describe, it, expect } from "vitest";
import { designEP, deutschEfficiency, modifiedDeutschMatts } from "../05-ep";
import type { PSD } from "../types";

const psd: PSD = {
  bins: [
    { d_um: 0.5, mass_frac: 0.3 },
    { d_um: 5, mass_frac: 0.4 },
    { d_um: 30, mass_frac: 0.3 },
  ],
};

describe("Stage 5-C — EP", () => {
  describe("deutschEfficiency", () => {
    it("SCA·w = 4.6 → 99% 효율", () => {
      // -ln(0.01) = 4.605
      expect(deutschEfficiency(46, 0.1)).toBeCloseTo(0.99, 2);
    });
    it("SCA·w = 0 → 0%", () => {
      expect(deutschEfficiency(0, 0.1)).toBe(0);
    });
  });

  describe("modifiedDeutschMatts", () => {
    it("k=0.5 → 일반 Deutsch보다 낮음", () => {
      const η_full = deutschEfficiency(46, 0.1);
      const η_mod = modifiedDeutschMatts(46, 0.1, 0.5);
      expect(η_mod).toBeLessThan(η_full);
      expect(η_mod).toBeGreaterThan(0.7);
    });
  });

  describe("designEP", () => {
    it("비산회 99% → SCA 50~80", () => {
      const r = designEP({
        Q_m3s: 100,
        target_efficiency: 0.99,
        dust_resistivity_Ohm_cm: 1e9,
        particle_dist: psd,
        ep_type: "dry",
        T_in_C: 150,
        industry: "coal_power",
      });
      expect(r.SCA_s_per_m).toBeGreaterThan(40);
      expect(r.SCA_s_per_m).toBeLessThan(70);
      expect(r.field_count).toBeGreaterThanOrEqual(2);
    });

    it("고비저항 10¹² → 백코로나 경고 + 컨디셔닝 권장", () => {
      const r = designEP({
        Q_m3s: 100,
        target_efficiency: 0.99,
        dust_resistivity_Ohm_cm: 1e12,
        particle_dist: psd,
        ep_type: "dry",
        T_in_C: 350,
        industry: "cement_kiln",
      });
      expect(r.warnings.some(w => w.includes("백코로나"))).toBe(true);
      expect(r.conditioning).not.toBeNull();
    });

    it("저비저항 10³ → 재비산 경고", () => {
      const r = designEP({
        Q_m3s: 100,
        target_efficiency: 0.99,
        dust_resistivity_Ohm_cm: 1e3,
        particle_dist: psd,
        ep_type: "dry",
        T_in_C: 150,
      });
      expect(r.warnings.some(w => w.includes("재비산"))).toBe(true);
    });

    it("WESP — 비저항 무관", () => {
      const r = designEP({
        Q_m3s: 100,
        target_efficiency: 0.999,
        dust_resistivity_Ohm_cm: 1e12,
        particle_dist: psd,
        ep_type: "wet",
        T_in_C: 80,
      });
      expect(r.conditioning).toBeNull();
      expect(r.voltage_kV).toBe(50);
    });

    it("저온 운전 → 노점 경고", () => {
      const r = designEP({
        Q_m3s: 100,
        target_efficiency: 0.99,
        dust_resistivity_Ohm_cm: 1e9,
        particle_dist: psd,
        ep_type: "dry",
        T_in_C: 100,
      });
      expect(r.warnings.some(w => w.includes("노점"))).toBe(true);
    });
  });
});
