// 시스템 추가질문 → 최종 1안 수렴.
// 원칙: 사용자가 먼저 자유 질의 → 끝나면 시스템이 아래 질문으로 마무리 → 1안 도출.

import type { Proposal, ProposalSet } from "@/lib/proposal/types";

export interface FollowupOption {
  label: string;
  value: string;
  hint?: string;
}
export interface Followup {
  id: string;            // prefs 키
  q: string;
  options: FollowupOption[];
}

export type Prefs = Record<string, string>;

// 확정 사양·제시안에 따라 필요한 추가질문만 동적으로 노출
export function systemFollowups(set: ProposalSet): Followup[] {
  const { spec, proposals } = set;
  const fs: Followup[] = [];

  // 1) 우선순위 (항상)
  fs.push({
    id: "priority",
    q: "최종안 선정에서 가장 중요하게 볼 기준은 무엇인가요?",
    options: [
      { value: "balanced", label: "균형 (성능·비용 절충)" },
      { value: "performance", label: "성능 우선 (배출·제거율 최우선)" },
      { value: "cost", label: "비용 우선 (TCO 최소)" },
    ],
  });

  // 2) 폐수 처리 가능 여부 — 습식안이 후보에 있을 때만
  if (proposals.some((p) => p.treatment.includes("wet"))) {
    fs.push({
      id: "wastewater",
      q: "현장에서 폐수 처리·방류가 가능합니까? (습식안 채택 여부에 직결)",
      options: [
        { value: "ok", label: "가능 (폐수처리장 보유/방류 허가)" },
        { value: "no", label: "불가 (무방류 필요)", hint: "선택 시 습식안 제외" },
      ],
    });
  }

  // 3) 약품 운전 가능 여부 — SDA안이 후보에 있을 때
  if (proposals.some((p) => p.treatment.includes("SDA"))) {
    fs.push({
      id: "reagent",
      q: "소석회·활성탄 등 약품 저장·정량공급 운전이 가능합니까?",
      options: [
        { value: "ok", label: "가능 (사일로·정량공급 설치 가능)" },
        { value: "limited", label: "제한적 (가급적 무약품 선호)", hint: "건식·EP 가점" },
      ],
    });
  }

  // 4) 배출 엄격도 — 목표가 명시 안 됐거나 느슨할 때
  if ((Number(spec.target_emission) || 30) > 10) {
    fs.push({
      id: "emission",
      q: "배출 규제 수준은 어느 정도입니까?",
      options: [
        { value: "normal", label: "일반 (≤30 mg/Nm³)" },
        { value: "strict", label: "엄격 (≤10 mg/Nm³ 또는 강화지역)", hint: "고효율안 가점" },
      ],
    });
  }

  // 5) 부지 여유
  fs.push({
    id: "space",
    q: "설치 부지에 여유가 있습니까?",
    options: [
      { value: "ok", label: "여유 있음" },
      { value: "tight", label: "협소", hint: "콤팩트 구성 가점, SDA탑 감점" },
    ],
  });

  return fs;
}

// 답변(prefs) 반영 → 최종 1안 재선정
export interface FinalResult {
  finalId: string;
  ranked: { id: string; title: string; adjScore: number; note: string }[];
  rationale: string;
}

export function pickFinal(set: ProposalSet, prefs: Prefs): FinalResult {
  const ranked = set.proposals.map((p) => {
    let s = p.score;
    const notes: string[] = [];

    if (!p.feasible) { s = -1; notes.push("기본 제약 위배"); }

    // 폐수 불가 → 습식 제외
    if (prefs.wastewater === "no" && p.treatment.includes("wet")) { s = -1; notes.push("폐수 불가 → 제외"); }

    // 약품 제한 → 무약품 가점, SDA 감점
    if (prefs.reagent === "limited") {
      if (p.treatment.includes("SDA")) { s -= 15; notes.push("약품 제한 −15"); }
      if (p.treatment === "dry" || p.treatment === "ep" || p.treatment.includes("explosion")) { s += 8; notes.push("무약품 +8"); }
    }

    // 우선순위
    if (prefs.priority === "cost") {
      const tcoEok = p.tco5_won / 1e8;
      const adj = Math.max(0, 20 - tcoEok / 5); // TCO 낮을수록 가점
      s += adj; notes.push(`비용우선 +${adj.toFixed(0)}`);
    } else if (prefs.priority === "performance") {
      s += p.efficiency_PM * 15; notes.push(`성능우선 +${(p.efficiency_PM * 15).toFixed(0)}`);
    }

    // 엄격 배출
    if (prefs.emission === "strict") {
      if (p.efficiency_PM >= 0.999) { s += 12; notes.push("엄격배출 적합 +12"); }
      else { s -= 15; notes.push("엄격배출 미흡 −15"); }
    }

    // 부지 협소
    if (prefs.space === "tight") {
      if (p.treatment.includes("SDA")) { s -= 8; notes.push("협소 SDA탑 −8"); }
      if (p.treatment === "dry" || p.treatment === "ep") { s += 5; notes.push("콤팩트 +5"); }
    }

    return { id: p.id, title: p.title, adjScore: Math.round(s), note: notes.join(", ") || "조정 없음" };
  });

  ranked.sort((a, b) => b.adjScore - a.adjScore);
  const top = ranked[0];
  const rationale = top.adjScore < 0
    ? "선택 가능한 안이 없습니다 — 제약을 완화하거나 Data Sheet를 재검토하세요."
    : `질의 결과를 반영해 「${top.title}」을(를) 최종안으로 도출했습니다. (조정점수 ${top.adjScore} — ${top.note})`;

  return { finalId: top.id, ranked, rationale };
}
