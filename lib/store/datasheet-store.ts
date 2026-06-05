// Data Sheet 상태관리

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface DataSheetState {
  values: Record<string, any>;
  setValue: (key: string, value: any) => void;
  setMany: (patch: Record<string, any>) => void;
  reset: () => void;
}

export const useDataSheetStore = create<DataSheetState>()(
  persist(
    (set) => ({
      values: {
        // 데모 편의 기본값 (필수 일부 미리 채움 — 사용자 수정)
        op_hours_yr: 8000,
        flammable: "no",
        wastewater: "ok",
      },
      setValue: (key, value) => set((s) => ({ values: { ...s.values, [key]: value } })),
      setMany: (patch) => set((s) => ({ values: { ...s.values, ...patch } })),
      reset: () => set({ values: { op_hours_yr: 8000, flammable: "no", wastewater: "ok" } }),
    }),
    {
      name: "dust-datasheet",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as any))),
    }
  )
);
