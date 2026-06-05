// 제시안(Proposal) 타입 — Data Sheet 확정값 → 2~3 간략안 → 수렴 → 최종 1안

export interface EquipmentNode {
  id: string;            // "HOOD" | "CYCLONE" | "BAG" ...
  label: string;         // "사이클론"
  sublabel?: string;     // "조분 제거"
}

export interface Proposal {
  id: string;
  treatment: string;     // dry / wet / semi-dry ...
  title: string;         // "건식 사이클론+백필터"
  train: EquipmentNode[];// 구조도 (좌→우 흐름)
  pros: string[];
  cons: string[];
  regulatory: string[];
  // 개략 수치
  efficiency_PM: number; // 0~1
  capex_won: number;
  opex_won_yr: number;
  tco5_won: number;
  feasible: boolean;
  reject_reason?: string;
  score: number;
  rank?: number;
}

export interface ProposalSet {
  spec: Record<string, any>;          // resolveSpec 결과 (확정 사양)
  proposals: Proposal[];              // 2~3안
  recommendedId: string;
  rationale: string;
}
