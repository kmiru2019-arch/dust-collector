// 질의 응답 엔진 — Claude API 미사용.
// 사용자가 자유롭게 질문 → 키워드 매칭 → 확정 사양(spec) + 계산엔진 재실행으로 답변.

import type { Proposal } from "@/lib/proposal/types";
import { TREATMENT_PERFORMANCE, estimateCapex, estimateOpex } from "@/lib/concept/rules";

export interface QAResult {
  answer: string;
  detail?: string[];      // 계산 근거 (수식·중간값)
  matched: string;        // 매칭된 토픽 라벨
}

const num = (v: any, d = 0) => (typeof v === "number" && !isNaN(v) ? v : Number(v) || d);
const won2eok = (won: number) => (won / 1e8).toFixed(2) + "억원";

// ΔP 표준값 (mmAq) — rules.ts와 동일 근거
const DP_TYP: Record<string, number> = {
  dry: 150, "dry+explosion_protection": 160, "dry+precool": 180,
  wet: 400, "wet+quench": 450, "wet+FGD": 500,
  "semi-dry": 250, "semi-dry+SDA": 280, "semi-dry+SDA+AC": 300,
};

interface Topic {
  label: string;
  keywords: string[];
  compute: (spec: Record<string, any>, p: Proposal) => { answer: string; detail?: string[] };
}

const TOPICS: Topic[] = [
  {
    label: "여과면적·백필터 개수",
    keywords: ["여과", "면적", "백", "필터", "여포", "bag", "포대", "여과속도", "a/c"],
    compute: (spec, p) => {
      const Qmin = num(spec.flow_Nm3h, 30000) / 60;            // m³/min
      const Vface = p.treatment.startsWith("dry") ? 1.2 : p.treatment.startsWith("semi") ? 1.0 : 1.0; // m/min (펄스젯)
      const A = Qmin / Vface;                                   // m²
      const bagDia = 0.15, bagLen = 6;                          // 표준 백 Ø150 × L6m
      const aPerBag = Math.PI * bagDia * bagLen;                // ≈ 2.83 m²
      const nBags = Math.ceil(A / aPerBag);
      return {
        answer: `여과면적 약 ${A.toFixed(0)} m² 필요, 표준 백(Ø150×6m, ${aPerBag.toFixed(1)} m²/본) 기준 약 ${nBags.toLocaleString()}본입니다.`,
        detail: [
          `여과속도(A/C) ${Vface} m/min 적용 (펄스젯 ${p.treatment.startsWith("dry") ? "건식" : "반건식"})`,
          `A = Q/V = ${Qmin.toFixed(0)} ÷ ${Vface} = ${A.toFixed(0)} m²`,
          `본수 = A ÷ (π·0.15·6) = ${A.toFixed(0)} ÷ ${aPerBag.toFixed(2)} ≈ ${nBags}본`,
        ],
      };
    },
  },
  {
    label: "압력손실·송풍기 동력",
    keywords: ["압력", "손실", "정압", "δp", "dp", "송풍", "팬", "fan", "동력", "kw", "전력", "모터", "마력"],
    compute: (spec, p) => {
      const Qmin = num(spec.flow_Nm3h, 30000) / 60;
      const dP_mmAq = DP_TYP[p.treatment] ?? 150;
      const dP_Pa = dP_mmAq * 9.81;
      const kW = (Qmin / 60) * dP_Pa / (1000 * 0.75 * 0.94);    // η_fan 0.75, η_motor 0.94
      const motor = Math.ceil((kW / 0.7) / 5) * 5;              // 부하율 0.7 → 정격, 5kW 라운드업
      return {
        answer: `계통 압력손실 약 ${dP_mmAq} mmAq, 송풍기 축동력 약 ${kW.toFixed(1)} kW (권장 모터 ${motor} kW급)입니다.`,
        detail: [
          `ΔP(표준) = ${dP_mmAq} mmAq = ${dP_Pa.toFixed(0)} Pa`,
          `축동력 = Q·ΔP/(η_fan·η_motor) = (${(Qmin / 60).toFixed(1)} m³/s)·${dP_Pa.toFixed(0)} / (0.75·0.94) = ${kW.toFixed(1)} kW`,
          `정격 모터 = 축동력/부하율 0.7 ≈ ${motor} kW`,
        ],
      };
    },
  },
  {
    label: "배출농도·효율",
    keywords: ["배출", "효율", "농도", "outlet", "emission", "mg", "정화", "성능", "제거율", "달성"],
    compute: (spec, p) => {
      const inlet_g = num(spec.inlet_conc_g, 5);               // g/Nm³
      const eff = p.efficiency_PM;
      const outlet_mg = inlet_g * 1000 * (1 - eff);            // mg/Nm³
      const target = num(spec.target_emission, 10);
      const ok = outlet_mg <= target;
      return {
        answer: `입구 ${inlet_g} g/Nm³ → 출구 약 ${outlet_mg.toFixed(1)} mg/Nm³ (PM 효율 ${(eff * 100).toFixed(2)}%). 목표 ${target} mg/Nm³ ${ok ? "달성 ✓" : "미달 — 후단 보강 검토"}.`,
        detail: [
          `출구 = 입구 × (1−η) = ${inlet_g * 1000} mg × (1−${eff.toFixed(3)}) = ${outlet_mg.toFixed(1)} mg/Nm³`,
          `목표(법규/입력) = ${target} mg/Nm³ → ${ok ? "여유 있음" : "초과"}`,
        ],
      };
    },
  },
  {
    label: "산성가스·약품 소모",
    keywords: ["산성", "hcl", "so2", "약품", "소석회", "ca(oh)", "중화", "흡수", "reagent", "소모", "lime"],
    compute: (spec, p) => {
      const hcl = num(spec.hcl_ppm), so2 = num(spec.so2_ppm);
      if (!p.treatment.includes("SDA") && !p.treatment.includes("wet")) {
        return { answer: `선택안(${p.title})은 산성가스 처리 설비가 없습니다. HCl ${hcl}/SO₂ ${so2} ppm가 규제 대상이면 반건식(SDA) 또는 습식 안을 검토하세요.` };
      }
      const Qmin = num(spec.flow_Nm3h, 30000) / 60;
      // HCl 36.5 g/mol, SO2 64 g/mol, Ca(OH)2 74 g/mol, 화학양론 + 과잉 1.8
      const Nm3h = Qmin * 60;
      const mol_hcl = (hcl * 1e-6) * Nm3h / 22.4;              // mol/h
      const mol_so2 = (so2 * 1e-6) * Nm3h / 22.4;
      const ca = (mol_hcl / 2 + mol_so2) * 74 / 1000 * 1.8;     // kg/h (Ca:HCl=1:2, SO2=1:1, SR 1.8)
      return {
        answer: `소석회 Ca(OH)₂ 약 ${ca.toFixed(1)} kg/h 소모 예상 (화학양론비 SR 1.8 적용).`,
        detail: [
          `HCl ${hcl} ppm → ${mol_hcl.toFixed(2)} mol/h, SO₂ ${so2} ppm → ${mol_so2.toFixed(2)} mol/h`,
          `Ca(OH)₂ = (HCl/2 + SO₂)×74×SR1.8 = ${ca.toFixed(1)} kg/h`,
          `연간 ≈ ${(ca * num(spec.op_hours_yr, 8000) / 1000).toFixed(1)} ton/yr`,
        ],
      };
    },
  },
  {
    label: "폐수 발생량",
    keywords: ["폐수", "물", "수질", "방류", "waste water", "wastewater", "스크러버 물", "순환수"],
    compute: (spec, p) => {
      if (!p.treatment.includes("wet")) {
        return { answer: `선택안(${p.title})은 ${p.treatment.startsWith("semi") ? "반건식으로 폐수가 발생하지 않습니다 (잔수 즉시 증발)" : "건식으로 폐수가 없습니다"}.` };
      }
      const Qmin = num(spec.flow_Nm3h, 30000) / 60;
      const blowdown = Qmin * 0.0008 * 60;                     // 대략 0.8 L/min per 1000 m³/min → m³/h 환산 근사
      return {
        answer: `습식 안은 블로다운 폐수가 발생합니다. 개략 ${blowdown.toFixed(1)} m³/h 수준이며 중화·침전 후 방류(물환경보전법)해야 합니다.`,
        detail: [`풍량 ${Qmin.toFixed(0)} m³/min 기준 순환수 블로다운 근사값`, "정확값은 가스 온·습도, SO₂ 부하에 따라 변동"],
      };
    },
  },
  {
    label: "다이옥신·수은 제거",
    keywords: ["다이옥신", "dioxin", "수은", "hg", "활성탄", "ac", "중금속", "잔류성"],
    compute: (spec, p) => {
      const perf = TREATMENT_PERFORMANCE[p.treatment] ?? TREATMENT_PERFORMANCE.dry;
      const dx = (perf.dioxin * 100).toFixed(0), hg = (perf.Hg * 100).toFixed(0);
      const hasAC = p.treatment.includes("AC");
      return {
        answer: `선택안(${p.title})의 다이옥신 제거율 약 ${dx}%, 수은 약 ${hg}%입니다. ${hasAC ? "활성탄 분사로 0.1 ng-TEQ 기준 대응 가능." : "다이옥신·Hg 규제가 있으면 활성탄(AC) 추가 안을 권장합니다."}`,
        detail: [`처리방식 표준 성능표 기준`, hasAC ? "활성탄 주입량은 후속 상세설계에서 결정" : "AC 미적용 안"],
      };
    },
  },
  {
    label: "사이클론 분리입경",
    keywords: ["사이클론", "cyclone", "조분", "분리", "d50", "원심", "전처리"],
    compute: (spec, p) => {
      const has = p.train.some((n) => n.id === "CYCLONE" || n.id === "CYCLONIC");
      if (!has) return { answer: `선택안(${p.title})에는 사이클론이 포함되어 있지 않습니다. 조분(>10㎛)이 많거나 폭발성 분진 격리가 필요하면 전단 사이클론을 추가할 수 있습니다.` };
      const d50 = num(spec.d50_um, 20);
      return {
        answer: `전단 사이클론은 조대입자를 1차 제거해 후단 백필터 부하를 낮춥니다. 입력 d50 ${d50}㎛ 기준 약 10㎛ 이상 입자를 주로 포집합니다.`,
        detail: ["Lapple d50 식 기준 — 정확값은 입경분포·유입속도로 상세설계에서 산출"],
      };
    },
  },
  {
    label: "재질·부식",
    keywords: ["재질", "본체", "덕트", "부식", "재료", "sus", "ss400", "스테인", "frp", "material"],
    compute: (spec) => {
      const body = spec.body_material ?? "SS400";
      const corr = spec.corrosive ?? "none";
      return {
        answer: `본체/덕트 추천 재질은 ${body}입니다 (가스온도 ${spec.T_in_C}°C, 부식성 ${corr} 기준 자동 적용).`,
        detail: [
          "T>400°C 또는 강부식 → SUS316L",
          "약부식 또는 T>150°C → SUS304",
          "그 외 → SS400(내부 라이닝 검토)",
        ],
      };
    },
  },
  {
    label: "비용(CAPEX/OPEX)",
    keywords: ["비용", "가격", "capex", "opex", "투자", "운영비", "tco", "견적", "원가", "얼마"],
    compute: (spec, p) => {
      const Qmin = num(spec.flow_Nm3h, 30000) / 60;
      const capex = estimateCapex(Qmin, p.treatment as any);
      const opex = estimateOpex(Qmin, p.treatment as any, num(spec.op_hours_yr, 8000), capex);
      return {
        answer: `선택안(${p.title}) 개략 CAPEX ${won2eok(capex)}, 연 OPEX ${won2eok(opex)}, 5년 TCO ${won2eok(capex + opex * 5)}입니다. (시장가 ±30%)`,
        detail: [
          `CAPEX = 5억×(Q/1000)^0.7 × 처리방식배율 (Q=${Qmin.toFixed(0)} m³/min)`,
          `OPEX = 전력 + 소모품 + 폐기물 (운전 ${num(spec.op_hours_yr, 8000).toLocaleString()} h/yr)`,
        ],
      };
    },
  },
  {
    label: "폭발·안전",
    keywords: ["폭발", "방폭", "kst", "분진폭발", "atex", "벤트", "가연", "안전", "화재"],
    compute: (spec, p) => {
      const flam = spec.flammable === "yes";
      const kst = num(spec.kst);
      if (!flam) return { answer: "입력상 가연성 분진이 아니어서 방폭 설계는 필수가 아닙니다. 단, 유기분진이면 KOSHA D-43 검토를 권장합니다." };
      return {
        answer: `가연성 분진(Kst ${kst || "?"} bar·m/s)으로 방폭 설계가 필요합니다. 전단 사이클론 격리 + 백필터 방폭벤트 + 역화방지 구성을 권장합니다.`,
        detail: ["KOSHA D-43 / ATEX·IECEx 인증 권장", "벤트면적은 St등급·용기체적으로 상세설계에서 산정"],
      };
    },
  },
];

const FALLBACK_LABEL = "일반 안내";

export function answerQuestion(question: string, spec: Record<string, any>, proposal: Proposal): QAResult {
  const q = question.toLowerCase();
  let best: Topic | null = null;
  let bestHits = 0;
  for (const t of TOPICS) {
    const hits = t.keywords.reduce((n, k) => (q.includes(k.toLowerCase()) ? n + 1 : n), 0);
    if (hits > bestHits) { bestHits = hits; best = t; }
  }
  if (!best || bestHits === 0) {
    return {
      matched: FALLBACK_LABEL,
      answer:
        "해당 질문은 확정 사양만으로 정량 답변하기 어렵습니다. 여과면적·압력손실·배출농도·약품소모·폐수·다이옥신/Hg·재질·비용·방폭 등 키워드로 다시 질문해 주세요. 아래 추천 질문 칩도 활용할 수 있습니다.",
    };
  }
  const r = best.compute(spec, proposal);
  return { matched: best.label, answer: r.answer, detail: r.detail };
}

// 추천 질문 칩 (선택형)
export function suggestedQuestions(proposal: Proposal): string[] {
  const base = [
    "필요 여과면적과 백필터 본수는?",
    "계통 압력손실과 송풍기 동력은?",
    "목표 배출농도를 달성하나요?",
    "본체·덕트 재질은 무엇으로?",
    "CAPEX와 5년 TCO는 얼마인가요?",
  ];
  if (proposal.treatment.includes("SDA") || proposal.treatment.includes("wet")) base.push("소석회 약품 소모량은?");
  if (proposal.treatment.includes("wet")) base.push("폐수 발생량은 얼마인가요?");
  if (proposal.treatment.includes("AC")) base.push("다이옥신·수은 제거율은?");
  if (proposal.train.some((n) => n.id.startsWith("CYCLON"))) base.push("사이클론 분리입경은?");
  return base;
}
