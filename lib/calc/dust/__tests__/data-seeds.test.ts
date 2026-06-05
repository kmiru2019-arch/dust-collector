import { describe, it, expect } from "vitest";
import { DUST_TYPES, lookupDust, listDustCategories } from "@/lib/data/dust/dust-types";
import { PSD_PRESETS, rosinRammlerPSD, lookupPSD } from "@/lib/data/dust/standard-psd";
import { BUSINESS_CLASSIFICATION, EMISSION_STANDARDS, SUBSIDY_RULES } from "@/lib/data/dust/compliance-rules";

describe("Data Seeds", () => {
  describe("dust-types DB", () => {
    it("최소 30종 이상", () => {
      expect(Object.keys(DUST_TYPES).length).toBeGreaterThanOrEqual(30);
    });

    it("필수 분진 포함", () => {
      const required = ["cement_kiln", "fly_ash_coal", "wood_flour", "welding_fume_steel",
        "aluminum_dust", "fly_ash_msw", "carbon_black", "asbestos"];
      for (const code of required) {
        expect(DUST_TYPES[code]).toBeDefined();
      }
    });

    it("폭발성 분진은 Kst·MIE·MIT 모두 정의", () => {
      const flammable = Object.values(DUST_TYPES).filter(d => d.flammable);
      for (const d of flammable) {
        expect(d.Kst_bar_m_s).toBeDefined();
        expect(d.MIE_mJ).toBeDefined();
        expect(d.MIT_C).toBeDefined();
      }
    });

    it("ST 등급 자동 일치", () => {
      for (const d of Object.values(DUST_TYPES)) {
        if (d.flammable && d.Kst_bar_m_s) {
          if (d.Kst_bar_m_s <= 200) expect(d.ST_class).toBe("ST1");
          else if (d.Kst_bar_m_s <= 300) expect(d.ST_class).toBe("ST2");
          else expect(d.ST_class).toBe("ST3");
        }
      }
    });

    it("Al·Mg → ST3", () => {
      expect(DUST_TYPES.aluminum_dust.ST_class).toBe("ST3");
      expect(DUST_TYPES.magnesium_dust.ST_class).toBe("ST3");
    });

    it("발암성 표시 — 석면·결정형 실리카·납·용접흄(Cr⁶⁺)", () => {
      expect(DUST_TYPES.asbestos.carcinogen).toBe(true);
      expect(DUST_TYPES.silica_sand.carcinogen).toBe(true);
      expect(DUST_TYPES.lead_dust.carcinogen).toBe(true);
      expect(DUST_TYPES.welding_fume_stainless.carcinogen).toBe(true);
    });

    it("category 분류", () => {
      const cats = listDustCategories();
      expect(cats.has("mineral")).toBe(true);
      expect(cats.has("metal")).toBe(true);
      expect(cats.has("organic_grain")).toBe(true);
      expect(cats.has("wood")).toBe(true);
      expect(cats.has("polymer")).toBe(true);
      expect(cats.has("fume")).toBe(true);
    });
  });

  describe("PSD presets", () => {
    it("6개 프리셋", () => {
      expect(Object.keys(PSD_PRESETS).length).toBe(6);
    });

    it("각 PSD는 mass_frac 합계 ≈ 1", () => {
      for (const [code, psd] of Object.entries(PSD_PRESETS)) {
        const sum = psd.bins.reduce((s, b) => s + b.mass_frac, 0);
        expect(sum).toBeCloseTo(1.0, 1);
      }
    });

    it("Rosin-Rammler — d_R 10, n 1 → 합계 1", () => {
      const psd = rosinRammlerPSD(10, 1);
      const sum = psd.bins.reduce((s, b) => s + b.mass_frac, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });
  });

  describe("Compliance rules", () => {
    it("종별 분류 5단계", () => {
      expect(BUSINESS_CLASSIFICATION.length).toBe(5);
    });

    it("MSW 소각 배출허용기준 — PCDD 0.1", () => {
      const std = EMISSION_STANDARDS.find(s =>
        s.facility_type === "msw_incineration" && s.install_after === "2015-01-01"
      );
      expect(std?.limits.PCDD?.value).toBe(0.1);
    });

    it("보조금 룰 — 4·5종 90%", () => {
      const rule = SUBSIDY_RULES.find(s => s.id === "env_smb_install");
      expect(rule?.subsidy_rate).toBe(0.90);
    });
  });
});
