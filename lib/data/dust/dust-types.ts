// 분진 40종 DB — 산업·물성·폭발성·비저항
// 출처: NFPA 660, KOSHA Guide D-43, EPA AP-42, NIOSH

import type { PSD, STClass } from "@/lib/calc/dust/types";

export interface DustType {
  code: string;
  name_ko: string;
  name_en: string;
  category: "mineral" | "metal" | "organic_grain" | "wood" | "polymer" | "chemical" | "fume" | "biological";
  d50_um: number;
  d90_um?: number;
  particle_density_kg_m3: number;
  bulk_density_kg_m3: number;
  resistivity_Ohm_cm: [number, number];   // [low, high] — 온도 보정 전
  flammable: boolean;
  Kst_bar_m_s?: number;
  MIE_mJ?: number;
  MIT_C?: number;
  Pmax_bar?: number;
  ST_class?: STClass;
  stickiness: "low" | "medium" | "high";
  corrosive: "none" | "mild" | "severe";
  carcinogen?: boolean;
  default_PSD?: PSD;
  notes?: string;
}

const psd_fine: PSD = {  // 금속흄·미세
  bins: [
    { d_um: 0.1, mass_frac: 0.10 },
    { d_um: 0.5, mass_frac: 0.30 },
    { d_um: 1.0, mass_frac: 0.30 },
    { d_um: 5, mass_frac: 0.20 },
    { d_um: 30, mass_frac: 0.10 },
  ],
};
const psd_medium: PSD = {  // 일반산업
  bins: [
    { d_um: 0.5, mass_frac: 0.05 },
    { d_um: 1, mass_frac: 0.10 },
    { d_um: 5, mass_frac: 0.25 },
    { d_um: 10, mass_frac: 0.30 },
    { d_um: 30, mass_frac: 0.20 },
    { d_um: 100, mass_frac: 0.10 },
  ],
};
const psd_coarse: PSD = {  // 곡물·목분
  bins: [
    { d_um: 5, mass_frac: 0.05 },
    { d_um: 30, mass_frac: 0.20 },
    { d_um: 100, mass_frac: 0.40 },
    { d_um: 300, mass_frac: 0.25 },
    { d_um: 1000, mass_frac: 0.10 },
  ],
};

export const DUST_TYPES: Record<string, DustType> = {
  // ── 광물·시멘트
  cement_kiln: {
    code: "cement_kiln", name_ko: "시멘트 킬른분진", name_en: "Cement kiln dust",
    category: "mineral", d50_um: 10, d90_um: 50,
    particle_density_kg_m3: 3100, bulk_density_kg_m3: 1100,
    resistivity_Ohm_cm: [1e10, 1e12], flammable: false,
    stickiness: "high", corrosive: "mild",
    default_PSD: psd_medium,
    notes: "고비저항 — EP 컨디셔닝 필요 또는 EP+백 하이브리드",
  },
  cement_mill: {
    code: "cement_mill", name_ko: "시멘트 밀분진", name_en: "Cement mill dust",
    category: "mineral", d50_um: 15,
    particle_density_kg_m3: 3100, bulk_density_kg_m3: 1300,
    resistivity_Ohm_cm: [1e9, 1e11], flammable: false,
    stickiness: "medium", corrosive: "none",
    default_PSD: psd_medium,
  },
  limestone: {
    code: "limestone", name_ko: "석회석 분진", name_en: "Limestone",
    category: "mineral", d50_um: 30,
    particle_density_kg_m3: 2700, bulk_density_kg_m3: 1500,
    resistivity_Ohm_cm: [1e8, 1e10], flammable: false,
    stickiness: "low", corrosive: "none",
    default_PSD: psd_medium,
  },
  silica_sand: {
    code: "silica_sand", name_ko: "규사·실리카", name_en: "Silica sand",
    category: "mineral", d50_um: 100,
    particle_density_kg_m3: 2650, bulk_density_kg_m3: 1500,
    resistivity_Ohm_cm: [1e10, 1e13], flammable: false,
    stickiness: "low", corrosive: "none",
    carcinogen: true,  // 결정형 실리카 1군 발암
    default_PSD: psd_coarse,
    notes: "결정형 실리카 — 1군 발암물질, 밀폐 의무",
  },
  fly_ash_coal: {
    code: "fly_ash_coal", name_ko: "석탄 비산회", name_en: "Coal fly ash",
    category: "mineral", d50_um: 8, d90_um: 30,
    particle_density_kg_m3: 2400, bulk_density_kg_m3: 900,
    resistivity_Ohm_cm: [1e8, 1e11], flammable: false,
    stickiness: "low", corrosive: "mild",
    default_PSD: psd_medium,
    notes: "황 함량별 비저항 변동 큼",
  },
  fly_ash_msw: {
    code: "fly_ash_msw", name_ko: "MSW 비산재", name_en: "MSW fly ash",
    category: "mineral", d50_um: 5,
    particle_density_kg_m3: 2200, bulk_density_kg_m3: 800,
    resistivity_Ohm_cm: [1e9, 1e11], flammable: false,
    stickiness: "medium", corrosive: "severe",
    default_PSD: psd_fine,
    notes: "Hg, Cd, Pb 휘발성 중금속 함유 — 활성탄 흡착 필수",
  },

  // ── 금속·흄
  iron_oxide_eaf: {
    code: "iron_oxide_eaf", name_ko: "EAF 산화철 흄", name_en: "EAF iron oxide fume",
    category: "fume", d50_um: 0.5,
    particle_density_kg_m3: 5000, bulk_density_kg_m3: 1500,
    resistivity_Ohm_cm: [1e6, 1e9], flammable: false,
    stickiness: "low", corrosive: "mild",
    default_PSD: psd_fine,
  },
  welding_fume_steel: {
    code: "welding_fume_steel", name_ko: "탄소강 용접흄", name_en: "Carbon steel welding fume",
    category: "fume", d50_um: 0.5,
    particle_density_kg_m3: 5000, bulk_density_kg_m3: 1000,
    resistivity_Ohm_cm: [1e2, 1e5], flammable: false,
    stickiness: "low", corrosive: "none",
    carcinogen: true,  // Mn, Ni 일부 1A군
    default_PSD: psd_fine,
    notes: "Mn 함유 — 신경독성, 발암 가능",
  },
  welding_fume_stainless: {
    code: "welding_fume_stainless", name_ko: "스테인리스 용접흄", name_en: "Stainless welding fume",
    category: "fume", d50_um: 0.4,
    particle_density_kg_m3: 5000, bulk_density_kg_m3: 1000,
    resistivity_Ohm_cm: [1e2, 1e5], flammable: false,
    stickiness: "low", corrosive: "mild",
    carcinogen: true,
    default_PSD: psd_fine,
    notes: "Cr⁶⁺ 함유 가능 — 1군 발암",
  },
  aluminum_dust: {
    code: "aluminum_dust", name_ko: "알루미늄 분말", name_en: "Aluminum powder",
    category: "metal", d50_um: 50, d90_um: 200,
    particle_density_kg_m3: 2700, bulk_density_kg_m3: 1100,
    resistivity_Ohm_cm: [1e3, 1e6],
    flammable: true, Kst_bar_m_s: 415, MIE_mJ: 10, MIT_C: 590, Pmax_bar: 11,
    ST_class: "ST3",
    stickiness: "low", corrosive: "none",
    default_PSD: psd_medium,
    notes: "Kst 매우 높음 (ST3) — 절대 습식 + N₂ 퍼지 필수",
  },
  magnesium_dust: {
    code: "magnesium_dust", name_ko: "마그네슘 분말", name_en: "Magnesium powder",
    category: "metal", d50_um: 40,
    particle_density_kg_m3: 1740, bulk_density_kg_m3: 900,
    resistivity_Ohm_cm: [1e3, 1e6],
    flammable: true, Kst_bar_m_s: 508, MIE_mJ: 25, MIT_C: 470, Pmax_bar: 17,
    ST_class: "ST3",
    stickiness: "low", corrosive: "none",
    default_PSD: psd_medium,
    notes: "수분 접촉 시 H₂ 발생 — 건식 + N₂",
  },
  titanium_dust: {
    code: "titanium_dust", name_ko: "티타늄 분말", name_en: "Titanium powder",
    category: "metal", d50_um: 30,
    particle_density_kg_m3: 4500, bulk_density_kg_m3: 2400,
    resistivity_Ohm_cm: [1e3, 1e6],
    flammable: true, Kst_bar_m_s: 240, MIE_mJ: 25, MIT_C: 460, Pmax_bar: 9,
    ST_class: "ST2",
    stickiness: "low", corrosive: "none",
    default_PSD: psd_medium,
  },

  // ── 비철 (Cu/Pb/Zn)
  zinc_oxide: {
    code: "zinc_oxide", name_ko: "산화아연 흄", name_en: "Zinc oxide fume",
    category: "fume", d50_um: 0.3,
    particle_density_kg_m3: 5600, bulk_density_kg_m3: 1500,
    resistivity_Ohm_cm: [1e4, 1e7], flammable: false,
    stickiness: "medium", corrosive: "mild",
    default_PSD: psd_fine,
  },
  lead_dust: {
    code: "lead_dust", name_ko: "납 분진", name_en: "Lead dust",
    category: "metal", d50_um: 5,
    particle_density_kg_m3: 11340, bulk_density_kg_m3: 4000,
    resistivity_Ohm_cm: [1e3, 1e6], flammable: false,
    stickiness: "low", corrosive: "mild",
    carcinogen: true,
    default_PSD: psd_fine,
    notes: "1군 발암 — 밀폐+HEPA 필수",
  },
  copper_oxide: {
    code: "copper_oxide", name_ko: "산화구리 흄", name_en: "Copper oxide fume",
    category: "fume", d50_um: 0.5,
    particle_density_kg_m3: 6000, bulk_density_kg_m3: 1800,
    resistivity_Ohm_cm: [1e4, 1e7], flammable: false,
    stickiness: "low", corrosive: "mild",
    default_PSD: psd_fine,
  },

  // ── 곡물·목재 (폭발성)
  wood_flour: {
    code: "wood_flour", name_ko: "목분 (소나무)", name_en: "Wood flour (pine)",
    category: "wood", d50_um: 50, d90_um: 200,
    particle_density_kg_m3: 600, bulk_density_kg_m3: 200,
    resistivity_Ohm_cm: [1e3, 1e6],
    flammable: true, Kst_bar_m_s: 150, MIE_mJ: 30, MIT_C: 410, Pmax_bar: 8.5,
    ST_class: "ST1",
    stickiness: "low", corrosive: "none",
    default_PSD: psd_coarse,
  },
  wood_flour_oak: {
    code: "wood_flour_oak", name_ko: "목분 (참나무)", name_en: "Wood flour (oak)",
    category: "wood", d50_um: 60,
    particle_density_kg_m3: 700, bulk_density_kg_m3: 250,
    resistivity_Ohm_cm: [1e3, 1e6],
    flammable: true, Kst_bar_m_s: 110, MIE_mJ: 50, MIT_C: 430, Pmax_bar: 8.0,
    ST_class: "ST1",
    stickiness: "low", corrosive: "none",
    default_PSD: psd_coarse,
  },
  grain_wheat: {
    code: "grain_wheat", name_ko: "밀가루", name_en: "Wheat flour",
    category: "organic_grain", d50_um: 100,
    particle_density_kg_m3: 1500, bulk_density_kg_m3: 500,
    resistivity_Ohm_cm: [1e7, 1e10],
    flammable: true, Kst_bar_m_s: 130, MIE_mJ: 50, MIT_C: 380, Pmax_bar: 7.5,
    ST_class: "ST1",
    stickiness: "medium", corrosive: "none",
    default_PSD: psd_coarse,
  },
  grain_corn: {
    code: "grain_corn", name_ko: "옥수수 분말", name_en: "Corn starch",
    category: "organic_grain", d50_um: 15,
    particle_density_kg_m3: 1500, bulk_density_kg_m3: 600,
    resistivity_Ohm_cm: [1e8, 1e10],
    flammable: true, Kst_bar_m_s: 200, MIE_mJ: 30, MIT_C: 410, Pmax_bar: 8.5,
    ST_class: "ST1",
    stickiness: "medium", corrosive: "none",
    default_PSD: psd_medium,
  },
  sugar: {
    code: "sugar", name_ko: "설탕", name_en: "Sugar (sucrose)",
    category: "organic_grain", d50_um: 200,
    particle_density_kg_m3: 1590, bulk_density_kg_m3: 800,
    resistivity_Ohm_cm: [1e10, 1e13],
    flammable: true, Kst_bar_m_s: 138, MIE_mJ: 30, MIT_C: 360, Pmax_bar: 8.5,
    ST_class: "ST1",
    stickiness: "high", corrosive: "none",
    default_PSD: psd_coarse,
    notes: "조해성 → 고습 시 응집",
  },

  // ── 화학·polymer
  carbon_black: {
    code: "carbon_black", name_ko: "카본블랙", name_en: "Carbon black",
    category: "chemical", d50_um: 0.1, d90_um: 1,
    particle_density_kg_m3: 1800, bulk_density_kg_m3: 350,
    resistivity_Ohm_cm: [1e1, 1e4],
    flammable: true, Kst_bar_m_s: 80, MIE_mJ: 50, MIT_C: 510, Pmax_bar: 7,
    ST_class: "ST1",
    stickiness: "low", corrosive: "none",
    default_PSD: psd_fine,
    notes: "저비저항 — EP 재비산 위험",
  },
  pvc_powder: {
    code: "pvc_powder", name_ko: "PVC 분말", name_en: "PVC powder",
    category: "polymer", d50_um: 80,
    particle_density_kg_m3: 1400, bulk_density_kg_m3: 500,
    resistivity_Ohm_cm: [1e10, 1e13],
    flammable: true, Kst_bar_m_s: 100, MIE_mJ: 100, MIT_C: 530, Pmax_bar: 7,
    ST_class: "ST1",
    stickiness: "medium", corrosive: "mild",
    default_PSD: psd_coarse,
    notes: "연소 시 HCl 발생 — 산성 대응 여재",
  },
  polyethylene: {
    code: "polyethylene", name_ko: "폴리에틸렌 분말", name_en: "Polyethylene powder",
    category: "polymer", d50_um: 100,
    particle_density_kg_m3: 950, bulk_density_kg_m3: 350,
    resistivity_Ohm_cm: [1e12, 1e16],
    flammable: true, Kst_bar_m_s: 150, MIE_mJ: 30, MIT_C: 420, Pmax_bar: 8,
    ST_class: "ST1",
    stickiness: "medium", corrosive: "none",
    default_PSD: psd_coarse,
    notes: "초고비저항 — 정전기 위험",
  },
  sulfur: {
    code: "sulfur", name_ko: "유황 분말", name_en: "Sulfur",
    category: "chemical", d50_um: 30,
    particle_density_kg_m3: 2070, bulk_density_kg_m3: 1100,
    resistivity_Ohm_cm: [1e10, 1e13],
    flammable: true, Kst_bar_m_s: 151, MIE_mJ: 3, MIT_C: 280, Pmax_bar: 6.8,
    ST_class: "ST1",
    stickiness: "low", corrosive: "mild",
    default_PSD: psd_medium,
    notes: "MIE 매우 낮음 (3 mJ) — 정전기 점화 위험 극도로 높음",
  },

  // ── 의약·식품
  pharma_lactose: {
    code: "pharma_lactose", name_ko: "유당 (Lactose)", name_en: "Lactose",
    category: "organic_grain", d50_um: 100,
    particle_density_kg_m3: 1530, bulk_density_kg_m3: 700,
    resistivity_Ohm_cm: [1e9, 1e12],
    flammable: true, Kst_bar_m_s: 81, MIE_mJ: 50, MIT_C: 450, Pmax_bar: 7.7,
    ST_class: "ST1",
    stickiness: "high", corrosive: "none",
    default_PSD: psd_coarse,
  },
  starch: {
    code: "starch", name_ko: "전분", name_en: "Starch",
    category: "organic_grain", d50_um: 30,
    particle_density_kg_m3: 1500, bulk_density_kg_m3: 600,
    resistivity_Ohm_cm: [1e9, 1e11],
    flammable: true, Kst_bar_m_s: 190, MIE_mJ: 30, MIT_C: 430, Pmax_bar: 8.6,
    ST_class: "ST1",
    stickiness: "medium", corrosive: "none",
    default_PSD: psd_medium,
  },

  // ── 광물·세라믹
  alumina: {
    code: "alumina", name_ko: "알루미나 (Al₂O₃)", name_en: "Alumina",
    category: "mineral", d50_um: 5,
    particle_density_kg_m3: 3950, bulk_density_kg_m3: 1500,
    resistivity_Ohm_cm: [1e7, 1e10], flammable: false,
    stickiness: "low", corrosive: "none",
    default_PSD: psd_medium,
  },
  fly_ash_oil: {
    code: "fly_ash_oil", name_ko: "중유 비산회", name_en: "Oil fly ash",
    category: "mineral", d50_um: 5,
    particle_density_kg_m3: 2300, bulk_density_kg_m3: 800,
    resistivity_Ohm_cm: [1e7, 1e10], flammable: false,
    stickiness: "medium", corrosive: "severe",
    default_PSD: psd_medium,
    notes: "V·Ni 함유 — SO₃ 다량 → 황산노점 회피 필수",
  },
  glass_dust: {
    code: "glass_dust", name_ko: "유리 분진", name_en: "Glass furnace dust",
    category: "mineral", d50_um: 1,
    particle_density_kg_m3: 2500, bulk_density_kg_m3: 1100,
    resistivity_Ohm_cm: [1e9, 1e11], flammable: false,
    stickiness: "medium", corrosive: "mild",
    default_PSD: psd_fine,
    notes: "알칼리 분진 — SeO₂, B₂O₃ 함유",
  },

  // ── 기타
  gypsum: {
    code: "gypsum", name_ko: "석고", name_en: "Gypsum",
    category: "mineral", d50_um: 50,
    particle_density_kg_m3: 2300, bulk_density_kg_m3: 900,
    resistivity_Ohm_cm: [1e7, 1e10], flammable: false,
    stickiness: "high", corrosive: "none",
    default_PSD: psd_medium,
  },
  tobacco_dust: {
    code: "tobacco_dust", name_ko: "담배 분진", name_en: "Tobacco dust",
    category: "biological", d50_um: 200,
    particle_density_kg_m3: 700, bulk_density_kg_m3: 250,
    resistivity_Ohm_cm: [1e8, 1e11],
    flammable: true, Kst_bar_m_s: 100, MIE_mJ: 100, MIT_C: 470, Pmax_bar: 7,
    ST_class: "ST1",
    stickiness: "medium", corrosive: "none",
    default_PSD: psd_coarse,
  },
  paper_dust: {
    code: "paper_dust", name_ko: "종이 분진", name_en: "Paper dust",
    category: "wood", d50_um: 100,
    particle_density_kg_m3: 800, bulk_density_kg_m3: 250,
    resistivity_Ohm_cm: [1e9, 1e12],
    flammable: true, Kst_bar_m_s: 90, MIE_mJ: 200, MIT_C: 380, Pmax_bar: 7,
    ST_class: "ST1",
    stickiness: "low", corrosive: "none",
    default_PSD: psd_coarse,
  },
  carbon_fiber: {
    code: "carbon_fiber", name_ko: "탄소섬유 분진", name_en: "Carbon fiber dust",
    category: "fume", d50_um: 7,
    particle_density_kg_m3: 1800, bulk_density_kg_m3: 350,
    resistivity_Ohm_cm: [1e1, 1e4], flammable: false,
    stickiness: "low", corrosive: "none",
    default_PSD: psd_fine,
    notes: "전도성 분진 — 전기설비 단락 위험",
  },
  asphalt_dust: {
    code: "asphalt_dust", name_ko: "아스팔트 + 광물분진", name_en: "Asphalt mineral dust",
    category: "mineral", d50_um: 30,
    particle_density_kg_m3: 2700, bulk_density_kg_m3: 1500,
    resistivity_Ohm_cm: [1e8, 1e10], flammable: false,
    stickiness: "high", corrosive: "mild",
    default_PSD: psd_medium,
    notes: "오일 흄 동반 — 점착성, 노멕스 권장",
  },
  rubber_dust: {
    code: "rubber_dust", name_ko: "고무 분진", name_en: "Rubber crumb",
    category: "polymer", d50_um: 200,
    particle_density_kg_m3: 1100, bulk_density_kg_m3: 350,
    resistivity_Ohm_cm: [1e10, 1e13],
    flammable: true, Kst_bar_m_s: 150, MIE_mJ: 100, MIT_C: 320, Pmax_bar: 8,
    ST_class: "ST1",
    stickiness: "medium", corrosive: "mild",
    default_PSD: psd_coarse,
  },
  fertilizer_urea: {
    code: "fertilizer_urea", name_ko: "요소 비료", name_en: "Urea fertilizer",
    category: "chemical", d50_um: 500,
    particle_density_kg_m3: 1320, bulk_density_kg_m3: 700,
    resistivity_Ohm_cm: [1e6, 1e9], flammable: false,
    stickiness: "high", corrosive: "mild",
    default_PSD: psd_coarse,
    notes: "조해성 — 고습 시 용해",
  },
  pulp_blackliquor: {
    code: "pulp_blackliquor", name_ko: "펄프 블랙리큐어 잔재", name_en: "Pulp black liquor",
    category: "chemical", d50_um: 1,
    particle_density_kg_m3: 1500, bulk_density_kg_m3: 700,
    resistivity_Ohm_cm: [1e7, 1e10], flammable: false,
    stickiness: "high", corrosive: "severe",
    default_PSD: psd_fine,
  },
  asbestos: {
    code: "asbestos", name_ko: "석면", name_en: "Asbestos",
    category: "mineral", d50_um: 5,
    particle_density_kg_m3: 2500, bulk_density_kg_m3: 700,
    resistivity_Ohm_cm: [1e10, 1e13], flammable: false,
    stickiness: "low", corrosive: "none",
    carcinogen: true,
    default_PSD: psd_fine,
    notes: "1군 발암 — 밀폐 절대의무, HEPA + 이중 백",
  },
};

export function lookupDust(code: string): DustType | undefined {
  return DUST_TYPES[code];
}

export function listDustCategories() {
  const result = new Map<string, DustType[]>();
  for (const dust of Object.values(DUST_TYPES)) {
    if (!result.has(dust.category)) result.set(dust.category, []);
    result.get(dust.category)!.push(dust);
  }
  return result;
}
