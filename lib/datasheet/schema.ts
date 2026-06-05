// 집진설비 설계 Data Sheet 구성표 (Single Source of Truth)
// 대분류 → 중분류 → 항목. 필수/선택, 드롭다운 보기, 미입력 시 자동처리 정의.

export type FieldType = "number" | "text" | "select" | "date" | "boolean";

export interface FieldOption {
  value: string;
  label: string;
}

export interface DataSheetField {
  key: string;                       // 고유 키 (예: "flow_Nm3h")
  label: string;                     // 표시명
  unit?: string;                     // 단위
  type: FieldType;
  required: boolean;                 // 필수 여부
  options?: FieldOption[];           // select 보기 (마지막에 "모름/자동" 포함)
  placeholder?: string;
  hint?: string;
  /** 미입력(공백/모름) 시 시스템 자동 처리 설명 — 사용자에게 보여줌 */
  autoFill?: string;
  /** 미입력 시 적용할 기본값 (계산엔진 전달용) */
  defaultValue?: string | number;
}

export interface DataSheetSubGroup {
  id: string;
  title: string;
  fields: DataSheetField[];
}

export interface DataSheetGroup {
  id: string;
  title: string;                     // 대분류
  icon?: string;
  subgroups: DataSheetSubGroup[];
}

const UNKNOWN: FieldOption = { value: "", label: "모름 / 자동 적용" };

export const DATASHEET: DataSheetGroup[] = [
  // ───────── A. 프로젝트 ─────────
  {
    id: "project", title: "A. 프로젝트 정보",
    subgroups: [{
      id: "project_basic", title: "기본",
      fields: [
        { key: "project_name", label: "프로젝트/설비명", type: "text", required: true, placeholder: "예: ○○공장 소각로 후처리" },
        { key: "process_source", label: "공정/발생원", type: "text", required: true, placeholder: "예: MSW 소각로, 시멘트 킬른" },
        { key: "region", label: "설치 지역(시·도)", type: "select", required: true,
          options: [
            { value: "seoul", label: "서울" }, { value: "busan", label: "부산" }, { value: "incheon", label: "인천" },
            { value: "daegu", label: "대구" }, { value: "daejeon", label: "대전" }, { value: "gwangju", label: "광주" },
            { value: "ulsan", label: "울산" }, { value: "sejong", label: "세종" }, { value: "gyeonggi", label: "경기" },
            { value: "gangwon", label: "강원" }, { value: "chungbuk", label: "충북" }, { value: "chungnam", label: "충남" },
            { value: "jeonbuk", label: "전북" }, { value: "jeonnam", label: "전남" }, { value: "gyeongbuk", label: "경북" },
            { value: "gyeongnam", label: "경남" }, { value: "jeju", label: "제주" },
          ],
          hint: "법규·보조금 판정용" },
        { key: "install_date", label: "신·증설 일자", type: "date", required: true, hint: "배출허용기준 시점 적용" },
      ],
    }],
  },

  // ───────── B. 가스 조건 ─────────
  {
    id: "gas", title: "B. 가스 조건 (Process Gas)",
    subgroups: [
      {
        id: "gas_main", title: "주요 조건",
        fields: [
          { key: "flow_Nm3h", label: "처리 풍량", unit: "Nm³/h", type: "number", required: true, placeholder: "50000" },
          { key: "T_in_C", label: "인입 온도", unit: "°C", type: "number", required: true, placeholder: "800" },
          { key: "T_out_C", label: "토출(목표) 온도", unit: "°C", type: "number", required: true, placeholder: "150" },
        ],
      },
      {
        id: "gas_detail", title: "상세 (선택)",
        fields: [
          { key: "pressure_mmAq", label: "가스 정압", unit: "mmAq", type: "number", required: false, autoFill: "표준 대기압 가정" },
          { key: "h2o_vol", label: "함습률 H₂O", unit: "%v", type: "number", required: false, autoFill: "공정별 표준값 적용 (고온 12%, 일반 8%)" },
          { key: "o2_vol", label: "O₂ 농도", unit: "%v", type: "number", required: false, autoFill: "연소공정 8% / 일반 21% 가정" },
          { key: "draft_type", label: "흡인/가압 방식", type: "select", required: false,
            options: [
              { value: "ID", label: "흡인식 (ID, 표준)" },
              { value: "FD", label: "가압식 (FD)" },
              { value: "FDID", label: "FD+ID 균압" },
              UNKNOWN,
            ],
            autoFill: "흡인식(ID) 기본 권장" },
        ],
      },
    ],
  },

  // ───────── C. 분진 성상 ─────────
  {
    id: "dust", title: "C. 분진 성상 (Dust)",
    subgroups: [
      {
        id: "dust_main", title: "주요",
        fields: [
          { key: "dust_type", label: "분진 종류", type: "select", required: true,
            options: [
              { value: "비산재", label: "비산재 (소각·MSW)" },
              { value: "석탄재", label: "석탄재 (비산회)" },
              { value: "시멘트분진", label: "시멘트 분진" },
              { value: "석회석분진", label: "석회석 분진" },
              { value: "목분", label: "목분 (목재 가공)" },
              { value: "곡물분진", label: "곡물·밀가루 분진" },
              { value: "용접흄", label: "용접 흄" },
              { value: "금속분진", label: "금속 연마·분진" },
              { value: "알루미늄분진", label: "알루미늄 분진" },
              { value: "납분진", label: "납(Pb) 분진" },
              { value: "아연분진", label: "아연(ZnO) 분진" },
              { value: "카본블랙", label: "카본블랙" },
              { value: "설탕분진", label: "설탕 분진" },
              { value: "전분", label: "전분 분진" },
              { value: "유황분진", label: "유황 분진" },
              { value: "미스트", label: "오일/화학 미스트" },
              { value: "일반분진", label: "일반 분진 (기타)" },
            ],
            hint: "DB와 매칭해 물성·여재·법규 자동 적용" },
          { key: "inlet_conc_g", label: "입구 분진농도", unit: "g/Nm³", type: "number", required: true, placeholder: "5" },
          { key: "target_emission", label: "목표 배출농도", unit: "mg/Sm³", type: "number", required: true, autoFill: "미입력 시 법규 배출허용기준 자동 적용", placeholder: "10" },
        ],
      },
      {
        id: "dust_phys", title: "물성 (선택)",
        fields: [
          { key: "d50_um", label: "입경 d50", unit: "μm", type: "number", required: false, autoFill: "분진 DB 표준값 제시" },
          { key: "particle_density", label: "입자 밀도", unit: "kg/m³", type: "number", required: false, autoFill: "분진 DB값 적용" },
          { key: "resistivity", label: "비저항", unit: "Ω·cm", type: "number", required: false, autoFill: "DB 추정 (EP 선정 시)" },
          { key: "stickiness", label: "점착성", type: "select", required: false,
            options: [{ value: "low", label: "하 (낮음)" }, { value: "medium", label: "중" }, { value: "high", label: "상 (높음)" }, UNKNOWN],
            autoFill: "분진 DB값" },
          { key: "corrosive", label: "부식성", type: "select", required: false,
            options: [{ value: "none", label: "무" }, { value: "mild", label: "약" }, { value: "severe", label: "강" }, UNKNOWN],
            autoFill: "분진 DB값 → 재질 결정" },
        ],
      },
    ],
  },

  // ───────── D. 안전 (가연성/폭발) ─────────
  {
    id: "safety", title: "D. 안전 (가연성/폭발)",
    subgroups: [{
      id: "safety_main", title: "폭발성",
      fields: [
        { key: "flammable", label: "가연성 여부", type: "select", required: true,
          options: [{ value: "no", label: "비가연성" }, { value: "yes", label: "가연성 (폭발성)" }] },
        { key: "kst", label: "Kst", unit: "bar·m/s", type: "number", required: false, autoFill: "분진 DB값 → ST등급 자동 (미상 시 보수적 ST1)" },
        { key: "mie", label: "MIE", unit: "mJ", type: "number", required: false, autoFill: "DB값" },
        { key: "mit", label: "MIT", unit: "°C", type: "number", required: false, autoFill: "DB값" },
      ],
    }],
  },

  // ───────── E. 가스 화학조성 ─────────
  {
    id: "chem", title: "E. 가스 화학조성",
    subgroups: [
      {
        id: "chem_acid", title: "E-1. 산성가스",
        fields: [
          { key: "hcl_ppm", label: "HCl", unit: "ppm", type: "number", required: false, autoFill: "공정 표준값 제시" },
          { key: "so2_ppm", label: "SO₂", unit: "ppm", type: "number", required: false, autoFill: "공정 표준값 제시" },
          { key: "so3_ppm", label: "SO₃", unit: "ppm", type: "number", required: false, autoFill: "SO₂의 ~2% 추정 (황산노점 계산용)" },
        ],
      },
      {
        id: "chem_metal", title: "E-2. 중금속",
        fields: [
          { key: "hg_ug", label: "Hg", unit: "μg/Nm³", type: "number", required: false, autoFill: "해당 공정만 (소각 등)" },
          { key: "pb_mg", label: "Pb", unit: "mg/Sm³", type: "number", required: false, autoFill: "해당 공정만" },
          { key: "cd_mg", label: "Cd", unit: "mg/Sm³", type: "number", required: false, autoFill: "해당 공정만" },
        ],
      },
      {
        id: "chem_other", title: "E-3. 기타 유해",
        fields: [
          { key: "nox_ppm", label: "NOx", unit: "ppm", type: "number", required: false, autoFill: "해당 공정만" },
          { key: "dioxin", label: "다이옥신", unit: "ng-TEQ/Sm³", type: "number", required: false, autoFill: "소각 공정만 (활성탄 주입 판정)" },
        ],
      },
    ],
  },

  // ───────── F. 재질·기계 ─────────
  {
    id: "material", title: "F. 재질·기계 요구",
    subgroups: [{
      id: "material_main", title: "재질",
      fields: [
        { key: "body_material", label: "본체/덕트 재질", type: "select", required: false,
          options: [
            { value: "SS400", label: "SS400 (탄소강)" },
            { value: "SUS304", label: "SUS304" },
            { value: "SUS316L", label: "SUS316L (내산)" },
            { value: "FRP", label: "FRP" },
            { value: "Hastelloy", label: "Hastelloy (고내식)" },
            UNKNOWN,
          ],
          autoFill: "인입온도·부식성 기반 자동 권장 (예: 800°C·강부식 → SUS316L)" },
        { key: "filter_media", label: "여재 (백필터 시)", type: "select", required: false,
          options: [
            { value: "PE", label: "폴리에스터 (≤130°C)" },
            { value: "Nomex", label: "노멕스 (≤200°C)" },
            { value: "PPS", label: "PPS (≤190°C, 내산)" },
            { value: "P84", label: "P84 (≤240°C)" },
            { value: "PTFE", label: "PTFE (≤260°C, 내산·다이옥신)" },
            { value: "Glass", label: "유리섬유 (≤260°C)" },
            UNKNOWN,
          ],
          autoFill: "온도·산성 기반 자동 (예: 180°C·산성 → PTFE)" },
      ],
    }],
  },

  // ───────── G. 운전·설치 ─────────
  {
    id: "operation", title: "G. 운전·설치 환경",
    subgroups: [
      {
        id: "op_main", title: "운전",
        fields: [
          { key: "op_hours_yr", label: "연간 운전시간", unit: "h/yr", type: "number", required: true, placeholder: "8000", hint: "TCO·VFD 판정" },
          { key: "wastewater", label: "폐수 처리", type: "select", required: true,
            options: [{ value: "ok", label: "가능" }, { value: "no", label: "불가" }],
            hint: "습식/반건식 분기 결정" },
        ],
      },
      {
        id: "op_site", title: "설치 환경 (선택)",
        fields: [
          { key: "space", label: "부지 제약", type: "select", required: false,
            options: [{ value: "ample", label: "충분" }, { value: "tight", label: "협소" }, UNKNOWN],
            autoFill: "표준 배치 가정" },
          { key: "height_limit_m", label: "설치 높이제한", unit: "m", type: "number", required: false, autoFill: "제한 없음 가정" },
          { key: "utility", label: "유틸리티", type: "select", required: false,
            options: [{ value: "full", label: "전력·압축공기·용수 모두" }, { value: "power_air", label: "전력·압축공기만" }, UNKNOWN],
            autoFill: "표준 가정" },
        ],
      },
    ],
  },

  // ───────── H. 법규·인증 ─────────
  {
    id: "regulatory", title: "H. 법규·인증",
    subgroups: [{
      id: "reg_main", title: "법규",
      fields: [
        { key: "annual_emission_t", label: "연간 배출량", unit: "t/yr", type: "number", required: false, autoFill: "풍량·농도·운전시간으로 자동 추정 → 사업장 종별 판정" },
        { key: "atex", label: "ATEX/IECEx 필요", type: "select", required: false,
          options: [{ value: "yes", label: "필요" }, { value: "no", label: "불필요" }, UNKNOWN],
          autoFill: "가연성 분진이면 자동 권장" },
      ],
    }],
  },
];

// ───────── 유틸 ─────────

/** 모든 필드 평탄화 */
export function allFields(): DataSheetField[] {
  return DATASHEET.flatMap((g) => g.subgroups.flatMap((sg) => sg.fields));
}

/** 필수 필드 목록 */
export function requiredFields(): DataSheetField[] {
  return allFields().filter((f) => f.required);
}

/** 필수 항목 모두 채워졌는지 검증 → 누락 키 배열 반환 */
export function validateRequired(values: Record<string, any>): string[] {
  return requiredFields()
    .filter((f) => {
      const v = values[f.key];
      return v === undefined || v === null || v === "";
    })
    .map((f) => f.key);
}

/** 필드 키 → 라벨 */
export function fieldLabel(key: string): string {
  return allFields().find((f) => f.key === key)?.label ?? key;
}
