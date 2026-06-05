// Stage 5 — 집진방식 통합 (1차/2차/3차 직렬 가능)

import type {
  Stage5Input, Stage5Output, Stage1Output, Stage2Output, Stage3Output, Stage4Output,
  PSD, BagInput, CycloneInput, EPInput, ScrubberInput,
} from "./types";
import { designBaghouse } from "./05-bag";
import { designCyclone, autoMulticyclone } from "./05-cyclone";
import { designEP } from "./05-ep";
import { designScrubber } from "./05-scrubber";

const DEFAULT_PSD: PSD = {
  bins: [
    { d_um: 0.5, mass_frac: 0.05 },
    { d_um: 1, mass_frac: 0.10 },
    { d_um: 5, mass_frac: 0.25 },
    { d_um: 10, mass_frac: 0.30 },
    { d_um: 30, mass_frac: 0.20 },
    { d_um: 100, mass_frac: 0.10 },
  ],
};

export function runStage5(
  input: Stage5Input,
  s1: Stage1Output,
  s3: Stage3Output,
  s4: Stage4Output
): Stage5Output {
  const Q_m3min = s3.total.Q_total_m3min;
  const Q_m3s = Q_m3min / 60;
  const warnings: string[] = [];
  const out: Stage5Output = {
    primary: input.primary,
    efficiency_overall: 0,
    dP_collector_Pa: 0,
    warnings,
  };

  const psd = (s1.dust as any).particle_dist ?? DEFAULT_PSD;

  // ── 처리방식 ↔ 집진방식 정합성 검증 ──
  const treatment = s4.primary_choice.type;
  const isWet = treatment === "wet" || treatment.startsWith("wet+");
  const isSemiDry = treatment.startsWith("semi-dry");
  const isDry = treatment === "dry" || treatment === "dry+explosion_protection" || treatment === "dry+precool";

  if (isWet && (input.primary === "bag_filter" || input.primary === "cartridge" || input.primary === "ep")) {
    warnings.push(`처리방식 ${treatment} 와 집진방식 ${input.primary} 비정합 — 습식에는 스크러버 권장`);
  }
  if (isSemiDry && input.primary !== "bag_filter" && input.primary !== "scrubber") {
    warnings.push(`반건식(SDA)은 백필터 후단 결합 필수 — 현재 ${input.primary} 단독은 비표준`);
  }
  if (isDry && input.primary === "scrubber") {
    warnings.push(`건식 처리에 습식 스크러버 — 물 사용 발생, 처리방식과 불일치`);
  }
  // 효율 vs 입경 적합성
  if (input.primary === "cyclone" && s1.dust.d50_um < 5) {
    warnings.push(`사이클론 단독은 d50 < 5μm에서 효율 저하 — 백필터 또는 EP 후단 결합 권장`);
  }
  // 폭발성 분진 + EP 건식 = 점화원
  if (s1.dust.flammable && input.primary === "ep" && (input.ep?.ep_type ?? "dry") === "dry") {
    warnings.push(`가연성 분진(ST ${s1.derived.ST_class}) + 건식 EP — 점화원 위험, WESP 또는 습식 권장`);
  }

  // Primary
  switch (input.primary) {
    case "bag_filter":
    case "cartridge": {
      const bagIn: BagInput = {
        Q_m3min,
        inlet_conc_g_m3: input.bag?.inlet_conc_g_m3 ?? 5,
        T_in_C: s1.gas.T_in_C,
        filter_type: input.primary === "cartridge" ? "cartridge" : input.bag?.filter_type ?? "pulse_jet",
        industry: s1.dust.industry,
        gas_chemistry: {
          HCl_ppm: s1.gas.HCl_ppm,
          SO3_ppm: s1.gas.SO3_ppm,
          NH3_ppm: s1.gas.NH3_ppm,
          H2O_vol_pct: s1.gas.H2O_vol_pct,
        },
        manual_media: input.bag?.manual_media,
        manual_AC: input.bag?.manual_AC,
      };
      const bagOut = designBaghouse(bagIn);
      out.bag = bagOut;
      out.dP_collector_Pa += bagOut.dP_design_Pa;
      out.efficiency_overall = 0.999;
      warnings.push(...bagOut.warnings);
      break;
    }
    case "cyclone": {
      const cycIn: CycloneInput = {
        Q_m3min,
        standard: input.cyclone?.standard ?? "Stairmand_HE",
        rho_p_kg_m3: s1.dust.particle_density_kg_m3,
        particle_dist: psd,
        V_target_m_s: input.cyclone?.V_target_m_s,
        count: input.cyclone?.count,
      };
      const cycOut = autoMulticyclone(cycIn);
      out.cyclone = cycOut;
      out.dP_collector_Pa += cycOut.dP_Pa;
      out.efficiency_overall = cycOut.efficiency_overall;
      warnings.push(...cycOut.warnings);
      break;
    }
    case "ep": {
      const epIn: EPInput = {
        Q_m3s,
        target_efficiency: input.ep?.target_efficiency ?? (s4.primary_choice ? 0.99 : 0.99),
        dust_resistivity_Ohm_cm: input.ep?.dust_resistivity_Ohm_cm ??
          (s1.derived.resistivity_estimate.low_Ohm_cm + s1.derived.resistivity_estimate.high_Ohm_cm) / 2,
        particle_dist: psd,
        ep_type: input.ep?.ep_type ?? "dry",
        T_in_C: s1.gas.T_in_C,
        industry: s1.dust.industry,
      };
      const epOut = designEP(epIn);
      out.ep = epOut;
      out.dP_collector_Pa += 25 * 9.81; // EP는 ΔP 작음 (10~25 mmAq)
      out.efficiency_overall = epOut.efficiency_modified;
      warnings.push(...epOut.warnings);
      break;
    }
    case "scrubber": {
      const sIn: ScrubberInput = {
        type: input.scrubber?.type ?? "venturi",
        Q_m3s,
        inlet_conc_g_m3: input.scrubber?.inlet_conc_g_m3 ?? 5,
        particle_dist: psd,
        gas_chemistry: {
          SO2_ppm: s1.gas.SO2_ppm,
          HCl_ppm: s1.gas.HCl_ppm,
          NH3_ppm: s1.gas.NH3_ppm,
          H2O_vol_pct: s1.gas.H2O_vol_pct,
        },
        target_efficiency: input.scrubber?.target_efficiency ?? 0.95,
        L_G: input.scrubber?.L_G,
      };
      const sOut = designScrubber(sIn);
      out.scrubber = sOut;
      out.dP_collector_Pa += sOut.dP_Pa;
      out.efficiency_overall = sOut.efficiency_overall;
      warnings.push(...sOut.warnings);
      break;
    }
  }

  // Series secondary (예: cyclone+bag)
  if (input.series?.secondary === "bag_filter" && input.primary === "cyclone") {
    const bagOut = designBaghouse({
      Q_m3min,
      inlet_conc_g_m3: 1, // 사이클론 후단 농도 추정
      T_in_C: s1.gas.T_in_C,
      filter_type: "pulse_jet",
      industry: s1.dust.industry,
      gas_chemistry: {
        HCl_ppm: s1.gas.HCl_ppm, SO3_ppm: s1.gas.SO3_ppm,
      },
    });
    out.bag = bagOut;
    out.dP_collector_Pa += bagOut.dP_design_Pa;
    out.efficiency_overall = 1 - (1 - out.efficiency_overall) * (1 - 0.999);
  }

  return out;
}
