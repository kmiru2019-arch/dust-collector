// Concept Workflow 상태관리

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Brief, ConceptSet } from "@/lib/concept/types";

interface ConceptStoreState {
  brief: Brief;
  conceptSet: ConceptSet | null;
  selectedConceptId: string | null;
}

interface ConceptStoreActions {
  setBrief: (patch: Partial<Brief>) => void;
  setConstraint: (key: keyof Brief["constraints"], value: boolean | number) => void;
  setConceptSet: (cs: ConceptSet) => void;
  selectConcept: (id: string) => void;
  reset: () => void;
}

const DEFAULT_BRIEF: Brief = {
  industry: "generic",
  flowrate_Nm3h: 30000,
  T_in_C: 25,
  constraints: {},
  region: "gyeonggi",
  install_date: "2024-01-01",
  op_hours_yr: 6000,
  budget_class: "medium",
};

export const useConceptStore = create<ConceptStoreState & ConceptStoreActions>()(
  persist(
    (set) => ({
      brief: DEFAULT_BRIEF,
      conceptSet: null,
      selectedConceptId: null,

      setBrief: (patch) =>
        set((s) => ({ brief: { ...s.brief, ...patch } })),
      setConstraint: (key, value) =>
        set((s) => ({ brief: { ...s.brief, constraints: { ...s.brief.constraints, [key]: value } } })),
      setConceptSet: (cs) =>
        set({ conceptSet: cs, selectedConceptId: cs.recommended_id }),
      selectConcept: (id) => set({ selectedConceptId: id }),
      reset: () => set({ brief: DEFAULT_BRIEF, conceptSet: null, selectedConceptId: null }),
    }),
    {
      name: "dust-concept",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as any))),
    }
  )
);
