# 데이터 흐름 — Stage → Stage 전달

## 핵심 원칙

1. **단방향 파이프라인**: Stage N의 출력은 Stage N+1의 입력. 역방향 의존 금지.
2. **단일 진실원천**: 모든 8단 데이터는 Zustand `dust-store.ts`에 보관. 컴포넌트는 select 만.
3. **자동 재계산**: Stage N 입력 변경 시 N+1~8 자동 재계산. 영향받지 않는 상위는 보존.
4. **단계별 검증**: 각 Stage 출력은 zod 스키마로 검증. 실패 시 다음 단계 잠금.

## Zustand Store 구조

```typescript
// lib/store/dust-store.ts
type DustStore = {
  // 입력 (사용자가 채움)
  inputs: {
    stage1: Stage1Input;
    stage2: Stage2Input;
    // ... stage8
  };
  // 출력 (엔진이 계산)
  outputs: {
    stage1?: Stage1Output;
    stage2?: Stage2Output;
    // ... stage8
  };
  // 진행상태
  meta: {
    current_stage: 1 | 2 | ... | 8;
    completed_stages: Set<number>;
    is_calculating: boolean;
    last_changed_stage: number;
  };
  // 액션
  setInput: <S>(stage: S, patch: Partial<Inputs[S]>) => void;
  recalculate: (from_stage?: number) => Promise<void>;
  reset: (from_stage?: number) => void;
}
```

## 재계산 트리거

```typescript
// setInput 시 자동으로 recalculate(stage) 호출
setInput("stage2", { hood_type: "canopy" })
  → meta.last_changed_stage = 2
  → recalculate(from_stage = 2)
  → engine.runFromStage(2, store.inputs)
  → outputs.stage2~8 갱신
  → 영향받는 컴포넌트만 리렌더 (Zustand selector)
```

## Stage 간 의존성 그래프

```
stage1 ──▶ stage2
   │         │
   │         ▼
   ├──▶ stage3
   │         │
   │         ▼
   ├──▶ stage4 ──▶ stage5
   │                  │
   │                  ▼
   ├──▶ stage6        │
   │     │            │
   │     ▼            ▼
   └──▶ stage7 ◀──────┤
            │         │
            ▼         ▼
         stage8 ◀─────┘
```

stage7은 stage3·5·6 모두 의존 (총 ΔP 계산). stage8은 stage1·2·5의 안전·법규 변수 모두 의존.

## 엔진 함수 시그니처

```typescript
// lib/calc/dust/engine.ts
export async function runFromStage(
  fromStage: number,
  inputs: AllInputs,
  prevOutputs?: Partial<AllOutputs>
): Promise<AllOutputs>;

export async function runStage1(input: Stage1Input): Promise<Stage1Output>;
export async function runStage2(input: Stage2Input, s1: Stage1Output): Promise<Stage2Output>;
// ...
export async function runStage8(input: Stage8Input, all: Stages1to7Output): Promise<Stage8Output>;
```

## 검증 (Zod)

```typescript
// lib/calc/dust/validate.ts
export const stage1OutputSchema = z.object({
  dust: z.object({ d50: z.number().min(0.01).max(1000), ... }),
  gas: z.object({ T: z.number().min(-40).max(1500), ... }),
  derived: z.object({ ST_class: z.enum(["ST1","ST2","ST3"]).nullable(), ... }),
});

// 각 Stage 출력 검증 후 통과해야 다음 Stage 호출
```

## 영속화 (Firebase)

- 위저드 진행 중: localStorage에 자동저장 (디바운스 1s)
- 사용자 "저장" 클릭: Firestore `designs/{designId}` 에 전체 store 직렬화
- 공유링크: `designs/{designId}` 읽기전용 → /s/[id]
