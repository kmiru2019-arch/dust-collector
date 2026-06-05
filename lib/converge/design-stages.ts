// 확정안의 설비 구성(train)에서 "필요한 상세설계 단계"만 동적으로 도출.
// 고정 8단이 아니라, 선택된 설비에 따라 3~8단으로 달라진다.

import type { Proposal } from "@/lib/proposal/types";

export interface DesignStage {
  no: number;            // 동적 번호 (1..N)
  key: string;
  title: string;
  desc: string;
  stagePage: string;     // 기존 단계 페이지(수동 미세조정 진입)
  group: "성상" | "포집" | "이송" | "냉각" | "집진" | "이송동력" | "안전법규";
}

// 집진설비 노드 → 상세설계 모듈
const COLLECTOR_MODULE: Record<string, { title: string; desc: string }> = {
  CYCLONE: { title: "원심집진(사이클론) 사이징", desc: "분리입경 d50·차압·치수 산정" },
  CYCLONIC: { title: "사이클로닉 세정", desc: "원심+세정 복합 차압·효율" },
  BAG: { title: "여과집진(백필터) 사이징", desc: "여과면적·여재·차압·탈진주기" },
  EP: { title: "전기집진(EP) 사이징", desc: "SCA·집진면적·인가전압" },
  VENTURI: { title: "벤추리 스크러버", desc: "목throat 속도·L/G·차압·효율" },
  MIST: { title: "미스트 엘리미네이터", desc: "비말 제거·압력손실" },
  SDA: { title: "반건식 반응탑(SDA)", desc: "소석회 정량·체류시간·노점 마진" },
  AC: { title: "활성탄 흡착", desc: "다이옥신·수은 주입량 산정" },
};

export function deriveDesignStages(proposal: Proposal): DesignStage[] {
  const ids = proposal.train.map((n) => n.id);
  const has = (id: string) => ids.includes(id);
  const stages: Omit<DesignStage, "no">[] = [];

  // 1) 분진·가스 성상 (항상)
  stages.push({ key: "props", title: "분진·가스 성상 분석", desc: "입경·밀도·점착·부식·노점·ST등급", stagePage: "/designer/stage-1", group: "성상" });

  // 2) 후드·포집 (HOOD)
  if (has("HOOD")) stages.push({ key: "hood", title: "후드·포집 설계", desc: "제어풍속·후드풍량·포집효율", stagePage: "/designer/stage-2", group: "포집" });

  // 3) 덕트 계통 (항상)
  stages.push({ key: "duct", title: "덕트 계통 설계", desc: "반송속도·관경·마찰·국부손실", stagePage: "/designer/stage-3", group: "이송" });

  // 4) 가스 냉각·열교환 (HX/QUENCH 있을 때만)
  if (has("HX") || has("QUENCH")) stages.push({ key: "cool", title: "가스 냉각·열교환", desc: "목표온도·응축수·폐열·재질", stagePage: "/designer/stage-6", group: "냉각" });

  // 5) 집진설비 — train 순서대로, 해당 모듈만
  for (const id of ids) {
    const mod = COLLECTOR_MODULE[id];
    if (mod) stages.push({ key: `col_${id}`, title: mod.title, desc: mod.desc, stagePage: "/designer/stage-5", group: "집진" });
  }

  // 6) 송풍기 (FAN)
  if (has("FAN")) stages.push({ key: "fan", title: "송풍기 선정", desc: "전압·축동력·배치·VFD", stagePage: "/designer/stage-7", group: "이송동력" });

  // 7) 안전·법규 (항상)
  stages.push({ key: "reg", title: "안전·법규 검토", desc: "배출기준·TMS·방폭·인허가", stagePage: "/designer/stage-8", group: "안전법규" });

  return stages.map((s, i) => ({ ...s, no: i + 1 }));
}
