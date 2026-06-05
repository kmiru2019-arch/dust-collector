import { describe, it, expect } from "vitest";
import { designBaghouse } from "../05-bag";
import { recommendMedia, recommendAC } from "@/lib/data/dust/filter-media";

describe("Stage 5-A — Bag/Cartridge", () => {
  describe("recommendMedia", () => {
    it("80°C 일반 → PE", () => {
      expect(recommendMedia(80, {})).toBe("PE");
    });
    it("180°C → Nomex", () => {
      expect(recommendMedia(180, {})).toBe("Nomex");
    });
    it("180°C + 산성 → PPS", () => {
      expect(recommendMedia(180, { SO3_ppm: 10 })).toBe("PPS");
    });
    it("250°C → PTFE", () => {
      expect(recommendMedia(250, {})).toBe("PTFE");
    });
    it("220°C → P84", () => {
      expect(recommendMedia(220, {})).toBe("P84");
    });
  });

  describe("recommendAC", () => {
    it("펄스제트 일반 → 1.2", () => {
      expect(recommendAC("pulse_jet", "generic")).toBe(1.2);
    });
    it("펄스제트 시멘트밀 → 0.8", () => {
      expect(recommendAC("pulse_jet", "cement_mill")).toBe(0.8);
    });
    it("펄스제트 용접흄 → 0.6", () => {
      expect(recommendAC("pulse_jet", "welding_fume")).toBe(0.6);
    });
    it("manual override", () => {
      expect(recommendAC("pulse_jet", "generic", 0.9)).toBe(0.9);
    });
  });

  describe("designBaghouse", () => {
    it("일반 1000 m³/min — A_total ~ 833 m²", () => {
      const r = designBaghouse({
        Q_m3min: 1000, inlet_conc_g_m3: 5, T_in_C: 80,
        filter_type: "pulse_jet",
      });
      expect(r.AC_ratio_m_min).toBe(1.2);
      expect(r.A_total_m2).toBeCloseTo(833.33, 0);
      expect(r.bag_count).toBeGreaterThan(270);
      expect(r.media.code).toBe("PE");
    });

    it("MSW 180°C 산성 → PTFE", () => {
      const r = designBaghouse({
        Q_m3min: 5000, inlet_conc_g_m3: 5, T_in_C: 180,
        filter_type: "pulse_jet",
        industry: "msw_incineration",
        gas_chemistry: { HCl_ppm: 100, SO3_ppm: 10 },
      });
      expect(r.media.code).toBe("PTFE");
      expect(r.AC_ratio_m_min).toBe(0.9);
    });

    it("ΔP 과다 → 경고", () => {
      const r = designBaghouse({
        Q_m3min: 100, inlet_conc_g_m3: 200, T_in_C: 80,  // 매우 높은 농도
        filter_type: "pulse_jet",
      });
      expect(r.warnings.some(w => w.includes("ΔP"))).toBe(true);
    });

    it("온도 한계 초과 → 경고", () => {
      const r = designBaghouse({
        Q_m3min: 100, inlet_conc_g_m3: 5, T_in_C: 280,
        filter_type: "pulse_jet",
        manual_media: "Nomex",   // T_max 200
      });
      expect(r.warnings.some(w => w.includes("한계"))).toBe(true);
    });
  });
});
