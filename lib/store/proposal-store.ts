// 제시안·수렴 상태관리

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ProposalSet } from "@/lib/proposal/types";

export interface QALogEntry {
  q: string;
  a: string;
  delta?: { label: string; before: string; after: string }[];
}

interface ProposalState {
  proposalSet: ProposalSet | null;
  selectedId: string | null;
  qaLog: QALogEntry[];
  finalId: string | null;          // 수렴 후 최종 1안
  setProposalSet: (ps: ProposalSet) => void;
  select: (id: string) => void;
  addQA: (entry: QALogEntry) => void;
  setFinal: (id: string) => void;
  reset: () => void;
}

export const useProposalStore = create<ProposalState>()(
  persist(
    (set) => ({
      proposalSet: null,
      selectedId: null,
      qaLog: [],
      finalId: null,
      setProposalSet: (ps) => set({ proposalSet: ps, selectedId: ps.recommendedId, finalId: null, qaLog: [] }),
      select: (id) => set({ selectedId: id }),
      addQA: (entry) => set((s) => ({ qaLog: [...s.qaLog, entry] })),
      setFinal: (id) => set({ finalId: id, selectedId: id }),
      reset: () => set({ proposalSet: null, selectedId: null, qaLog: [], finalId: null }),
    }),
    {
      name: "dust-proposal",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as any))),
    }
  )
);
