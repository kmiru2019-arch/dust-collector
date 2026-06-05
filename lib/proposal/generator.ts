// 제시안 생성 — Data Sheet 확정값(resolveSpec 결과) → 2~3 간략안

import type { Proposal, ProposalSet, EquipmentNode } from "./types";
import { estimateCapex, estimateOpex } from "@/lib/concept/rules";
import { TREATMENT_PERFORMANCE } from "@/lib/concept/rules";

const EQ = (id: string, label: string, sublabel?: string): EquipmentNode => ({ id, label, sublabel });

// 처리방식별 장비 트레인 구조도
function buildTrain(treatment: string, spec: Record<string, any>): EquipmentNode[] {
  const hot = spec.T_in_C > 300;
  const t: EquipmentNode[] = [EQ("HOOD", "후드/인입")];
  if (hot && !treatment.startsWith("wet")) t.push(EQ("HX", "열교환/냉각", `${spec.T_in_C}→${spec.T_out_C}°C`));

  switch (treatment) {
    case "dry":
      t.push(EQ("BAG", "백필터", spec.filter_media));
      break;
    case "dry+explosion_protection":
      t.push(EQ("CYCLONE", "사이클론", "조분·격리"), EQ("BAG", "백필터", "방폭벤트"));
      break;
    case "dry+precool":
      t.push(EQ("BAG", "백필터", spec.filter_media));
      break;
    case "wet":
    case "wet+quench":
      t.push(EQ("QUENCH", "Quencher", "냉각"), EQ("VENTURI", "벤추리"), EQ("CYCLONIC", "사이클로닉"), EQ("MIST", "미스트E"));
      break;
    case "semi-dry":
    case "semi-dry+SDA":
      t.push(EQ("SDA", "SDA", "Ca(OH)₂"), EQ("BAG", "백필터", spec.filter_media));
      break;
    case "semi-dry+SDA+AC":
      t.push(EQ("SDA", "SDA", "Ca(OH)₂"), EQ("AC", "활성탄", "Hg/Dioxin"), EQ("BAG", "백필터", "PTFE"));
      break;
    case "ep":
      t.push(EQ("EP", "전기집진기", `${spec.T_out_C}°C`));
      break;
  }
  t.push(EQ("FAN", "송풍기", spec.draft_type === "FDID" ? "FD+ID" : "ID"));
  t.push(EQ("STACK", "스택", "CEMS"));
  return t;
}

// 후보 처리방식 (확정값 기반)
function candidates(spec: Record<string, any>): string[] {
  const set = new Set<string>();
  const acidic = (spec.hcl_ppm ?? 0) > 50 || (spec.so2_ppm ?? 0) > 100;
  const hasHgDx = (spec.hg_ug ?? 0) > 10 || (spec.dioxin ?? 0) > 0.05;
  const flammable = spec.flammable === "yes";
  const sticky = spec.stickiness === "high";

  if (hasHgDx) set.add("semi-dry+SDA+AC");
  else if (acidic) set.add("semi-dry+SDA");
  if (flammable) set.add("dry+explosion_protection");
  if (sticky || (spec.dust_type ?? "").includes("미스트")) set.add("wet");
  if (acidic && !hasHgDx) set.add("wet");
  if (!hasHgDx && !acidic) set.add("dry");
  // EP 후보 (고온·대용량·고비저항 아님)
  if (spec.T_in_C > 250 && (spec.flow_Nm3h ?? 0) > 50000 && !flammable) set.add("ep");

  if (set.size < 2) { set.add("dry"); set.add("wet"); }
  return Array.from(set).slice(0, 3);
}

const LABELS: Record<string, string> = {
  dry: "건식 백필터",
  "dry+explosion_protection": "건식 사이클론+백필터 (방폭)",
  "dry+precool": "건식 냉각+백필터",
  wet: "습식 벤추리 스크러버",
  "wet+quench": "습식 Quench+벤추리",
  "semi-dry": "반건식 SDA+백필터",
  "semi-dry+SDA": "반건식 SDA+백필터",
  "semi-dry+SDA+AC": "반건식 SDA+활성탄+백필터",
  ep: "건식 전기집진기 (EP)",
};

function buildProsCons(treatment: string, spec: Record<string, any>) {
  const pros: string[] = [], cons: string[] = [], reg: string[] = [];
  let feasible = true, reject: string | undefined;

  if (treatment.startsWith("dry")) {
    pros.push("운영비 최저 (폐수·약품 無)", "구조 단순·유지보수 용이");
    if (treatment.includes("explosion")) {
      pros.push("폭발성 분진 1차 격리 (사이클론) + 방폭벤트");
      reg.push("KOSHA D-43 + ATEX/IECEx 권장");
    } else {
      cons.push("산성가스 처리 불가 (해당 시 별도 후단)");
    }
  }
  if (treatment.startsWith("wet")) {
    pros.push("산성가스·미스트 동시 처리", "점착성·고온 대응");
    cons.push("폐수 발생 → 처리비", "부식 → FRP/SUS316L");
    reg.push("폐수 방류 시 물환경보전법");
    if (spec.wastewater === "no") { feasible = false; reject = "폐수 발생 — '폐수 불가' 제약 위배"; }
  }
  if (treatment.startsWith("semi-dry")) {
    pros.push("폐수 無 (반건식)", "산성가스+다이옥신+Hg 동시 처리");
    cons.push("SDA 슬러지 발생", "소석회·활성탄 소모품비", "노점 회피 설계 필수");
    if (treatment.includes("AC")) reg.push("활성탄으로 다이옥신·Hg 제거 (잔류성유기오염물질관리법)");
  }
  if (treatment === "ep") {
    pros.push("ΔP 작아 전력비 최저", "대용량·고온 적합");
    cons.push("고비저항 분진 시 백코로나", "산성가스 미처리");
  }

  // 소각 법규
  if ((spec.dioxin ?? 0) > 0.05 || (spec.dust_type ?? "").includes("비산재")) {
    reg.push("폐기물관리법: 다이옥신 0.1 ng-TEQ, TMS 의무");
    if (treatment.startsWith("dry") && !treatment.includes("SDA")) {
      feasible = false; reject = "소각 — 건식 단독은 산성가스·다이옥신 미처리 (법규 위배)";
    }
  }
  return { pros, cons, reg, feasible, reject };
}

function scoreProposal(p: Proposal, spec: Record<string, any>): number {
  if (!p.feasible) return 0;
  let s = 50;
  const acidic = (spec.hcl_ppm ?? 0) > 50;
  const hasDx = (spec.dioxin ?? 0) > 0.05;
  if (hasDx && (TREATMENT_PERFORMANCE[p.treatment]?.dioxin ?? 0) < 0.9) s -= 30;
  else if (hasDx) s += 15;
  if (acidic && (TREATMENT_PERFORMANCE[p.treatment]?.HCl ?? 0) < 0.9) s -= 20;
  else if (acidic) s += 10;
  if (spec.wastewater === "no" && !p.treatment.includes("wet")) s += 10;
  s += Math.min(12, p.pros.length * 4);
  s -= Math.min(8, p.cons.length * 1.5);
  return Math.max(0, Math.min(100, s));
}

export function generateProposals(spec: Record<string, any>): ProposalSet {
  const Q = (spec.flow_Nm3h ?? 30000) / 60;
  const treatments = candidates(spec);

  const proposals: Proposal[] = treatments.map((treatment) => {
    const perf = TREATMENT_PERFORMANCE[treatment] ?? TREATMENT_PERFORMANCE.dry;
    const capex = estimateCapex(Q, treatment as any);
    const opex = estimateOpex(Q, treatment as any, spec.op_hours_yr ?? 6000, capex);
    const pc = buildProsCons(treatment, spec);
    const p: Proposal = {
      id: `prop_${treatment.replace(/[+]/g, "_")}`,
      treatment,
      title: LABELS[treatment] ?? treatment,
      train: buildTrain(treatment, spec),
      pros: pc.pros, cons: pc.cons, regulatory: pc.reg,
      efficiency_PM: perf.PM,
      capex_won: capex, opex_won_yr: opex, tco5_won: capex + opex * 5,
      feasible: pc.feasible, reject_reason: pc.reject,
      score: 0,
    };
    p.score = scoreProposal(p, spec);
    return p;
  });

  proposals.sort((a, b) => b.score - a.score);
  proposals.forEach((p, i) => { p.rank = i + 1; });
  const rec = proposals.find((p) => p.feasible) ?? proposals[0];

  return {
    spec,
    proposals,
    recommendedId: rec.id,
    rationale: rec.feasible
      ? `${rec.title} — ${rec.pros[0] ?? ""}. PM ${(rec.efficiency_PM * 100).toFixed(1)}%, 5년 TCO ${(rec.tco5_won / 1e8).toFixed(0)}억.`
      : "모든 안이 제약 위배 — 전문가 검토 필요",
  };
}
