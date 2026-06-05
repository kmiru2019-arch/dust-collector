// 8단 위저드 상태관리 — Zustand

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AllStageInputs, AllStageOutputs } from "@/lib/calc/dust/types";
import { runFromStage } from "@/lib/calc/dust/engine";

interface DustStoreState {
  // 입력
  inputs: AllStageInputs;
  // 출력
  outputs: AllStageOutputs;
  // 진행상태
  meta: {
    current_stage: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    completed_stages: number[];
    is_calculating: boolean;
    last_changed_stage: number;
    last_calculated_at?: string;
  };
}

interface DustStoreActions {
  setStage1Input: (patch: Partial<AllStageInputs["stage1"]>) => void;
  setStage2Input: (patch: Partial<AllStageInputs["stage2"]>) => void;
  setStage3Input: (patch: Partial<AllStageInputs["stage3"]>) => void;
  setStage4Input: (patch: Partial<AllStageInputs["stage4"]>) => void;
  setStage5Input: (patch: Partial<AllStageInputs["stage5"]>) => void;
  setStage6Input: (patch: Partial<AllStageInputs["stage6"]>) => void;
  setStage7Input: (patch: Partial<AllStageInputs["stage7"]>) => void;
  setStage8Input: (patch: Partial<AllStageInputs["stage8"]>) => void;
  goToStage: (n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) => void;
  recalculate: (fromStage?: number) => void;
  reset: () => void;
}

type DustStore = DustStoreState & DustStoreActions;

const DEFAULT_INPUTS: AllStageInputs = {
  stage1: {
    dust: {
      industry: "generic",
      dust_name: "일반 분진",
      d50_um: 10,
      particle_density_kg_m3: 2200,
      stickiness: "low",
      flammable: false,
      corrosive: "none",
      particulate: true,
    },
    gas: {
      T_in_C: 25,
      P_in_kPa: 101.325,
      RH_in_pct: 50,
      O2_pct: 21,
    },
  },
  stage2: {
    hood_type: "enclosing",
    open_area_m2: 1.0,
    safety_factor: 1.25,
  },
  stage3: {
    branches: [
      { id: "B1", Q_m3min: 100, length_m: 30, fittings: [{ type: "elbow_90_R1.5", count: 2 }] },
    ],
    material: "SS400",
  },
  stage4: {
    target_efficiency_pct: 99,
    target_emission_mg_Sm3: 30,
    budget_class: "medium",
    has_waste_heat_use: false,
    water_available: true,
  },
  stage5: { primary: "bag_filter" },
  stage6: { has_waste_heat_use: false },
  stage7: { hood_branches: 1, op_hours_yr: 6000, R_kWh_won: 100, load_variation_pct: 15 },
  stage8: {
    region: "gyeonggi",
    annual_emission_t: 5,
    install_date: "2024-01-01",
    facility_type: "general",
  },
};

export const useDustStore = create<DustStore>()(
  persist(
    (set, get) => ({
      inputs: DEFAULT_INPUTS,
      outputs: {},
      meta: {
        current_stage: 1,
        completed_stages: [],
        is_calculating: false,
        last_changed_stage: 1,
      },

      setStage1Input: (patch) => {
        set((s) => ({
          inputs: { ...s.inputs, stage1: { ...s.inputs.stage1, ...patch } as any },
          meta: { ...s.meta, last_changed_stage: 1 },
        }));
        get().recalculate(1);
      },
      setStage2Input: (patch) => {
        set((s) => ({
          inputs: { ...s.inputs, stage2: { ...s.inputs.stage2, ...patch } },
          meta: { ...s.meta, last_changed_stage: 2 },
        }));
        get().recalculate(2);
      },
      setStage3Input: (patch) => {
        set((s) => ({
          inputs: { ...s.inputs, stage3: { ...s.inputs.stage3, ...patch } },
          meta: { ...s.meta, last_changed_stage: 3 },
        }));
        get().recalculate(3);
      },
      setStage4Input: (patch) => {
        set((s) => ({
          inputs: { ...s.inputs, stage4: { ...s.inputs.stage4, ...patch } },
          meta: { ...s.meta, last_changed_stage: 4 },
        }));
        get().recalculate(4);
      },
      setStage5Input: (patch) => {
        set((s) => ({
          inputs: { ...s.inputs, stage5: { ...(s.inputs.stage5 ?? {}), ...patch } as any },
          meta: { ...s.meta, last_changed_stage: 5 },
        }));
        get().recalculate(5);
      },
      setStage6Input: (patch) => {
        set((s) => ({
          inputs: { ...s.inputs, stage6: { ...(s.inputs.stage6 ?? {}), ...patch } as any },
          meta: { ...s.meta, last_changed_stage: 6 },
        }));
        get().recalculate(6);
      },
      setStage7Input: (patch) => {
        set((s) => ({
          inputs: { ...s.inputs, stage7: { ...(s.inputs.stage7 ?? {}), ...patch } as any },
          meta: { ...s.meta, last_changed_stage: 7 },
        }));
        get().recalculate(7);
      },
      setStage8Input: (patch) => {
        set((s) => ({
          inputs: { ...s.inputs, stage8: { ...(s.inputs.stage8 ?? {}), ...patch } as any },
          meta: { ...s.meta, last_changed_stage: 8 },
        }));
        get().recalculate(8);
      },
      goToStage: (n) => {
        set((s) => ({
          meta: { ...s.meta, current_stage: n },
        }));
      },
      recalculate: (fromStage = 1) => {
        const { inputs, outputs } = get();
        set((s) => ({ meta: { ...s.meta, is_calculating: true } }));
        try {
          const newOutputs = runFromStage(fromStage, inputs, outputs);
          set((s) => ({
            outputs: newOutputs,
            meta: {
              ...s.meta,
              is_calculating: false,
              last_calculated_at: new Date().toISOString(),
            },
          }));
        } catch (err) {
          console.error("Calc failed:", err);
          set((s) => ({ meta: { ...s.meta, is_calculating: false } }));
        }
      },
      reset: () => {
        set({
          inputs: DEFAULT_INPUTS,
          outputs: {},
          meta: {
            current_stage: 1,
            completed_stages: [],
            is_calculating: false,
            last_changed_stage: 1,
          },
        });
      },
    }),
    {
      name: "dust-collector-design",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : undefined as any)),
      partialize: (s) => ({ inputs: s.inputs, meta: { current_stage: s.meta.current_stage } }),
      onRehydrateStorage: () => (state) => {
        // hydrate 직후 outputs가 비었으므로 1단부터 자동 재계산
        if (state) {
          // 비동기로 호출 (hydrate 사이클 완료 후)
          setTimeout(() => {
            try { state.recalculate(1); } catch (e) { console.error("[dust-store] initial recalc failed", e); }
          }, 0);
        }
      },
    }
  )
);

/**
 * SSR-safe hydration helper.
 * 클라이언트 컴포넌트의 첫 렌더 시 outputs가 비었으면 즉시 1단부터 재계산.
 * persist의 onRehydrateStorage가 동작 안 한 경우 (첫 방문)의 안전망.
 */
export function useEnsureCalculated() {
  if (typeof window === "undefined") return;
  const { outputs, recalculate } = useDustStore.getState();
  if (!outputs.stage1) {
    recalculate(1);
  }
}
