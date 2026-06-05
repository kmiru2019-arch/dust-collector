// 8단 위저드 공통 타입 정의

export type STClass = "ST0" | "ST1" | "ST2" | "ST3";
export type Stickiness = "low" | "medium" | "high";
export type Corrosivity = "none" | "mild" | "severe";
export type IndustryCode =
  | "generic"
  | "cement_kiln" | "cement_mill"
  | "coal_power"
  | "msw_incineration" | "hazardous_waste_incineration"
  | "iron_eaf" | "non_ferrous_smelting"
  | "woodworking" | "grain_handling"
  | "welding_fume" | "metal_grinding"
  | "chemical_mist"
  | "fgd"
  | "asphalt_plant"
  | "glass_furnace"
  | "semiconductor_pharma"
  // 확장 (Phase A)
  | "food_processing" | "textile" | "battery"
  | "pulp_paper" | "foundry" | "mining_quarry"
  | "shipbuilding_blast" | "rubber_plastic";

// ───────── Stage 1 ─────────
export interface DustProperties {
  industry: IndustryCode;
  dust_name: string;
  d50_um: number;
  d90_um?: number;
  particle_density_kg_m3: number;
  bulk_density_kg_m3?: number;
  stickiness: Stickiness;
  flammable: boolean;
  Kst_bar_m_s?: number;
  MIE_mJ?: number;
  MIT_C?: number;
  Pmax_bar?: number;
  corrosive: Corrosivity;
  particulate?: boolean; // true=입자상, false=가스상
  carcinogen?: boolean;
  high_toxicity?: boolean;
  tar?: boolean;
}

export interface GasProperties {
  T_in_C: number;
  P_in_kPa: number;
  RH_in_pct: number;
  O2_pct: number;
  CO_ppm?: number;
  HCl_ppm?: number;
  SO2_ppm?: number;
  SO3_ppm?: number;
  NOx_ppm?: number;
  NH3_ppm?: number;
  Hg_ug_Nm3?: number;
  H2O_vol_pct?: number;
  PCDD_ng_TEQ_Nm3?: number;
  water_sensitive?: boolean;
}

export interface Stage1Input {
  dust: DustProperties;
  gas: GasProperties;
}

export interface Stage1Output {
  dust: DustProperties;
  gas: GasProperties;
  derived: {
    ST_class: STClass | null;
    resistivity_estimate: { low_Ohm_cm: number; high_Ohm_cm: number };
    dewpoint_acid_C: number;       // -999 = N/A
    dewpoint_water_C: number;
    treatment_candidates: TreatmentCandidate[];
  };
}

export type TreatmentType =
  | "dry"
  | "wet"
  | "semi-dry"
  | "dry+explosion_protection"
  | "dry+precool"
  | "wet+quench"
  | "wet+FGD"
  | "semi-dry+SDA"
  | "semi-dry+SDA+AC";

export interface TreatmentCandidate {
  type: TreatmentType;
  score: number;
  reason: string;
}

// ───────── Stage 2 ─────────
export type HoodType =
  | "enclosing"
  | "exterior_lateral"
  | "exterior_downward"
  | "exterior_upward"
  | "canopy"
  | "receiving"
  | "slot"
  | "booth";

export interface Stage2Input {
  dust26_code?: number; // 1~26
  hood_type: HoodType;
  source_area_m2?: number;        // exterior
  source_perimeter_m?: number;    // canopy
  capture_distance_X_m?: number;  // exterior
  hood_height_H_m?: number;       // canopy
  open_area_m2?: number;          // enclosing
  source_diameter_D_m?: number;   // receiving
  slot_length_m?: number;         // slot
  face_area_m2?: number;          // booth
  safety_factor?: number;         // 1.0~2.0, default 1.25
}

export interface Stage2Output {
  hood_type: HoodType;
  V_c_applied_m_s: number;
  Q_hood_m3min: number;
  dP_hood_Pa: number;
}

// ───────── Stage 3 ─────────
export type DuctMaterial = "SS400" | "SUS304" | "SUS316L" | "FRP" | "Galvanized";
export type SizingMethod = "equal_velocity" | "equal_friction" | "static_regain";

export interface Fitting {
  type: "elbow_90_R1" | "elbow_90_R1.5" | "elbow_90_R2" | "elbow_45"
      | "branch_T_run" | "branch_T_branch" | "branch_Y_30" | "branch_Y_45" | "branch_Y_90"
      | "expansion_15" | "contraction_15" | "expansion_sudden" | "contraction_sudden"
      | "gate_valve_open" | "butterfly_valve_open" | "damper_open" | "blast_gate_open";
  count: number;
}

export interface DuctBranch {
  id: string;
  Q_m3min: number;
  length_m: number;
  fittings: Fitting[];
  junction?: { angle_deg: number };
}

export interface Stage3Input {
  branches: DuctBranch[];
  transport_velocity_m_s?: number;  // override
  material: DuctMaterial;
  sizing_method?: SizingMethod;
}

export interface BranchResult {
  id: string;
  D_m: number;
  V_actual_m_s: number;
  Re: number;
  f: number;
  dP_straight_Pa: number;
  dP_local_Pa: number;
  dP_combine_Pa: number;
  dP_total_Pa: number;
}

export interface Stage3Output {
  branches: BranchResult[];
  total: {
    Q_total_m3min: number;
    dP_duct_Pa: number;
    V_min_m_s: number;
    V_max_m_s: number;
  };
  warnings: string[];
}

// ───────── Stage 4 ─────────
export interface Stage4Input {
  target_efficiency_pct?: number;     // 95
  target_emission_mg_Sm3?: number;    // 30
  budget_class?: "low" | "medium" | "high";
  has_waste_heat_use?: boolean;
  water_available?: boolean;
}

export interface Stage4Output {
  treatment_ranked: TreatmentCandidate[];
  primary_choice: TreatmentCandidate;
  rationale: string;
}

// ───────── Stage 5 ─────────

// 입도분포
export interface PSDBin {
  d_um: number;
  mass_frac: number;
}
export interface PSD {
  bins: PSDBin[];
}

// 5-A 여과
export type FilterType = "pulse_jet" | "reverse_air" | "shaker" | "cartridge";
export type MediaCode =
  | "PE" | "PP" | "Acrylic" | "Nomex" | "PPS" | "P84"
  | "PTFE" | "Glass" | "Ceramic" | "Metal" | "Cellulose" | "ePTFE";

export interface BagInput {
  Q_m3min: number;
  inlet_conc_g_m3: number;
  T_in_C: number;
  filter_type: FilterType;
  industry?: IndustryCode;
  gas_chemistry?: { HCl_ppm?: number; SO3_ppm?: number; NH3_ppm?: number; H2O_vol_pct?: number };
  manual_media?: MediaCode;
  manual_AC?: number;
  bag_diameter_mm?: number;
  bag_length_m?: number;
}

export interface BagOutput {
  AC_ratio_m_min: number;
  A_total_m2: number;
  bag_count: number;
  bag_dim: { D_mm: number; L_m: number };
  media: { code: MediaCode; T_max_C: number; full_name?: string };
  dP_clean_Pa: number;
  dP_design_Pa: number;
  cleaning_interval_min: number;
  pulse_air_consumption_Nm3min?: number;
  warnings: string[];
}

// 5-B 사이클론
export type CycloneStandardCode =
  | "Stairmand_HE" | "Stairmand_HT" | "Lapple"
  | "Swift_HE" | "Swift_GP" | "Peterson";

export interface CycloneInput {
  Q_m3min: number;
  V_target_m_s?: number;
  standard: CycloneStandardCode;
  rho_g_kg_m3?: number;
  mu_g_Pa_s?: number;
  rho_p_kg_m3: number;
  particle_dist: PSD;
  count?: number;
  series?: "single" | "double" | "multi_parallel";
}

export interface CycloneDimensions {
  D_mm: number; a_mm: number; b_mm: number; De_mm: number;
  S_mm: number; h_mm: number; H_mm: number; B_mm: number;
}

export interface CycloneOutput {
  D_m: number;
  dimensions_mm: CycloneDimensions;
  V_i_m_s: number;
  dP_Pa: number;
  d50_um: number;
  efficiency_overall: number;
  efficiency_curve: Array<{ d_um: number; eta: number }>;
  count: number;
  warnings: string[];
}

// 5-C EP
export type EPType = "dry" | "wet";

export interface EPInput {
  Q_m3s: number;
  target_efficiency: number;     // 0~1
  dust_resistivity_Ohm_cm: number;
  particle_dist: PSD;
  ep_type: EPType;
  T_in_C: number;
  area_per_field_m2?: number;
  industry?: IndustryCode;
}

export interface EPOutput {
  SCA_s_per_m: number;
  A_total_m2: number;
  field_count: number;
  drift_velocity_m_s: number;
  voltage_kV: number;
  current_density_mA_m2: number;
  conditioning: { type: string; recommendation: string; SO3_ppm?: number } | null;
  efficiency_modified: number;
  warnings: string[];
}

// 5-D 스크러버
export type ScrubberSubtype = "venturi" | "packed" | "spray" | "cyclonic" | "sda";

export interface ScrubberInput {
  type: ScrubberSubtype;
  Q_m3s: number;
  inlet_conc_g_m3: number;
  particle_dist: PSD;
  gas_chemistry: { SO2_ppm?: number; HCl_ppm?: number; NH3_ppm?: number; H2O_vol_pct?: number };
  target_efficiency: number;
  L_G?: number;
}

export interface ScrubberOutput {
  type: ScrubberSubtype;
  L_G_L_per_m3: number;
  V_throat_m_s?: number;
  dP_Pa: number;
  efficiency_overall: number;
  water_consumption_m3h: number;
  wastewater_m3h: number;
  reagent_consumption_kg_h?: number;
  approach_to_saturation_K?: number;
  retention_time_s?: number;
  material_recommendation: string;
  warnings: string[];
}

// Stage 5 통합
export type CollectorPrimary = "cyclone" | "bag_filter" | "cartridge" | "ep" | "scrubber";

export interface Stage5Input {
  primary: CollectorPrimary;
  bag?: Partial<BagInput>;
  cyclone?: Partial<CycloneInput>;
  ep?: Partial<EPInput>;
  scrubber?: Partial<ScrubberInput>;
  series?: { secondary?: CollectorPrimary; tertiary?: CollectorPrimary };
}

export interface Stage5Output {
  primary: CollectorPrimary;
  bag?: BagOutput;
  cyclone?: CycloneOutput;
  ep?: EPOutput;
  scrubber?: ScrubberOutput;
  efficiency_overall: number;
  dP_collector_Pa: number;
  warnings: string[];
}

// ───────── Stage 6 ─────────
export type CondenserType =
  | "plate_PHE" | "shell_tube_WHB" | "finned_tube_APH"
  | "air_cooled" | "direct_quench" | "GGH_regenerative";

export interface Stage6Input {
  skip?: boolean;                  // true = 가스 냉각·응축기 사용 안 함 (강제 None)
  Q_m3h_at_T?: number;             // 미입력 시 Stage 3에서 추론
  T_target_C?: number;             // 미입력 시 자동
  has_waste_heat_use?: boolean;
  fuel_type?: "coal" | "oil" | "gas" | "msw" | "other";
  capex_budget_won?: number;
  R_kWh_won?: number;
  op_hours_yr?: number;
  // 후단 집진기 형식은 Stage 5에서 자동 상속 (UI에서 재입력 불필요).
  // 값이 주어지면 우선 적용하나, 기본은 s5 결과에서 도출.
  downstream_collector_type?: "bag" | "cartridge" | "ep_dry" | "ep_wet" | "scrubber";
  downstream_media?: MediaCode;
}

export interface Stage6Output {
  type: CondenserType | null;
  T_target_C: number;
  T_dewpoint_acid_C: number;
  T_dewpoint_water_C: number;
  margin_K: number;
  m_condensate_kg_h: number;
  waste_heat_kW: number;
  ROI_yr?: number;
  material_recommendation: string;
  insulation_thickness_mm: number;
  startup_heating_required: boolean;
  warnings: string[];
}

// ───────── Stage 7 ─────────
export type FanArrangement = "1_ID" | "FD+ID_balanced" | "Nplus1_parallel";
export type FanType = "Radial" | "Turbo_BC" | "Airfoil" | "Sirocco" | "Axial";

export interface Stage7Input {
  load_variation_pct?: number;
  op_hours_yr?: number;
  R_kWh_won?: number;
  redundancy_required?: boolean;
  conc_in_fan_g_m3?: number;       // 집진기 후 농도
  abrasive_dust?: boolean;
  hood_branches?: number;
  duct_length_m?: number;
}

export interface FanSpec {
  id: string;
  role: "FD" | "ID";
  type: FanType;
  Q_m3min: number;
  dP_Pa: number;
  BHP_kW: number;
  motor_kW: number;
  VFD: boolean;
}

export interface Stage7Output {
  arrangement: FanArrangement;
  fan_count: number;
  fans: FanSpec[];
  total_kW: number;
  annual_kWh: number;
  annual_cost_won: number;
  VFD_payback_yr?: number;
  fan_material: string;
  warnings: string[];
}

// ───────── Stage 8 ─────────
export type ClassNo = "1종" | "2종" | "3종" | "4종" | "5종";
export type FacilityType =
  | "boiler" | "incineration" | "kiln" | "smelter" | "general"
  | "msw_incineration" | "hazardous_waste_incineration"
  | "cement_kiln" | "cement_mill" | "coal_power"
  | "iron_eaf" | "non_ferrous";
export type KoreaRegion =
  | "seoul" | "busan" | "incheon" | "daegu" | "daejeon" | "gwangju" | "ulsan" | "sejong"
  | "gyeonggi" | "gangwon" | "chungbuk" | "chungnam" | "jeonbuk" | "jeonnam"
  | "gyeongbuk" | "gyeongnam" | "jeju";

export interface Stage8Input {
  region: KoreaRegion;
  industry_KSIC?: string;
  annual_emission_t: number;
  hourly_emission_Sm3h?: number;
  install_date: string;            // ISO YYYY-MM-DD
  is_industrial_complex?: boolean;
  facility_size_m2?: number;
  facility_type: FacilityType;
  facility_capacity?: number;
  is_carcinogen?: boolean;
  handles_hazardous_chemicals?: boolean;
  handles_hazardous_substances?: boolean;
  worker_count?: number;
  daily_exposure_h?: number;
  VOC_use_t_yr?: number;
  work_start_date?: string;
}

export interface ObligationItem {
  category: "air" | "osh" | "kosha" | "waste" | "chemical" | "hazardous" | "eia" | "subsidy";
  item: string;
  required: boolean;
  deadline?: string;
  citation: string;
}

export interface ExplosionAnalysis {
  ST_class: STClass | null;
  zone20_areas: string[];
  zone21_areas: string[];
  zone22_areas: string[];
  vent_area_m2: number;
  isolation_required: boolean;
  ATEX_recommended: boolean;
}

export interface SubsidyMatch {
  id: string;
  name: string;
  type?: "grant" | "loan";
  subsidy_rate?: number;
  interest_rate?: number;
  max_amount_won?: number;
  deadline?: string;
  agency: string;
  link?: string;
}

export interface Stage8Output {
  classification: ClassNo;
  emission_standards: Record<string, { value: number; unit: string }>;
  TMS_required: boolean;
  fugitive_dust_obligation: boolean;
  VOC_obligation: boolean;
  dust26_obligations: ObligationItem[];
  control_velocity_m_s: number;
  inspection_schedule: string[];
  prevention_plan: { required: boolean; deadline?: string };
  measurement: { freq: "biannual" | "quarterly"; retention_yr: number };
  explosion: ExplosionAnalysis | null;
  waste_obligations: ObligationItem[];
  chemical_obligations: ObligationItem[];
  eia_required: boolean;
  subsidies: SubsidyMatch[];
  citations: string[];
  disclaimer: string;
}

// ───────── 통합 ─────────
export interface AllStageInputs {
  stage1: Stage1Input;
  stage2: Stage2Input;
  stage3: Stage3Input;
  stage4: Stage4Input;
  stage5?: Stage5Input;
  stage6?: Stage6Input;
  stage7?: Stage7Input;
  stage8?: Stage8Input;
}

export interface AllStageOutputs {
  stage1?: Stage1Output;
  stage2?: Stage2Output;
  stage3?: Stage3Output;
  stage4?: Stage4Output;
  stage5?: Stage5Output;
  stage6?: Stage6Output;
  stage7?: Stage7Output;
  stage8?: Stage8Output;
}
