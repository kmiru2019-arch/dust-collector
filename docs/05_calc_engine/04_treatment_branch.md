# Stage 4 — 처리방식 결정 (코드 매핑)

건식 / 습식 / 반건식 분기 결정.

## 결정트리 의사코드

```
INPUT: dust(flammable, stickiness, Kst), gas(T, HCl, SO2, RH), context
OUTPUT: ranked candidates [{type, score, reason}]

if dust.flammable and dust.Kst > 0:
    if context.water_available and not gas.water_sensitive:
        push("wet", 0.6, "폭발성 회피용 습식")
        push("dry+explosion_protection", 0.7, "ATEX 백필터")
    else:
        push("dry+explosion_protection", 0.9)

if dust.stickiness == "high" or dust.tar:
    push("wet", 0.9, "점착성")
    push("semi-dry", 0.5)

if gas.HCl > 50 ppm:
    push("semi-dry+SDA", 0.95, "HCl 다량")
    push("wet", 0.8)

if gas.SO2 > 100 ppm:
    push("wet+FGD", 0.85, "SO2 흡수")
    push("semi-dry+SDA", 0.85)

if gas.T_in > 800:
    push("wet+quench", 0.9, "초고온 직접급랭")

elif gas.T_in > 400:
    push("dry+precool", 0.85, "냉각 후 건식")
    push("wet+quench", 0.7)

if 모두 미충족:
    push("dry", 0.95, "표준 건식")

return sort_by_score(candidates)
```

## 코드 (lib/calc/dust/04-treatment.ts)

```typescript
export function decideTreatment(s1: Stage1Output, input: Stage4Input): Stage4Output {
  const candidates: TreatmentCandidate[] = [];
  
  // 폭발성
  if (s1.dust.flammable && (s1.dust.Kst ?? 0) > 0) {
    if (input.water_available && !s1.gas.water_sensitive) {
      candidates.push({
        type: "wet",
        score: 0.6,
        reason: "가연성 분진 — 습식세정으로 점화원 회피",
        rationale_link: "/docs/safety/explosion",
      });
    }
    candidates.push({
      type: "dry+explosion_protection",
      score: 0.85,
      reason: `폭발성 분진 (ST ${s1.derived.ST_class}) — Cyclone+Bag+ATEX+벤트`,
    });
  }
  
  // 점착성
  if (s1.dust.stickiness === "high" || s1.dust.tar) {
    candidates.push({
      type: "wet",
      score: 0.9,
      reason: "점착성 분진 — 습식세정",
    });
    candidates.push({
      type: "semi-dry",
      score: 0.5,
      reason: "반건식 SDA로 분무 후 백",
    });
  }
  
  // 산성가스
  const HCl = s1.gas.HCl ?? 0;
  const SO2 = s1.gas.SO2 ?? 0;
  
  if (HCl > 50) {
    candidates.push({
      type: "semi-dry+SDA",
      score: 0.95,
      reason: `HCl ${HCl}ppm — SDA로 중화`,
    });
    candidates.push({
      type: "wet",
      score: 0.8,
      reason: "습식 흡수 (대안)",
    });
  }
  
  if (SO2 > 100) {
    candidates.push({
      type: "wet+FGD",
      score: 0.85,
      reason: `SO₂ ${SO2}ppm — 습식 FGD (LSFO)`,
    });
    candidates.push({
      type: "semi-dry+SDA",
      score: 0.85,
      reason: "반건식 SDA + 백",
    });
  }
  
  // 다이옥신·Hg (소각)
  if ((s1.gas.PCDD ?? 0) > 0.05 || (s1.gas.Hg ?? 0) > 0.01) {
    // SDA + AC + Bag 조합 강력 추천
    const existing_sda = candidates.find(c => c.type === "semi-dry+SDA");
    if (existing_sda) {
      existing_sda.score += 0.05;
      existing_sda.reason += " + 활성탄 주입(다이옥신/Hg)";
    } else {
      candidates.push({
        type: "semi-dry+SDA+AC",
        score: 0.95,
        reason: "다이옥신·Hg 흡착 — SDA+AC+Bag",
      });
    }
  }
  
  // 고온
  if (s1.gas.T_in > 800) {
    candidates.push({
      type: "wet+quench",
      score: 0.9,
      reason: `T ${s1.gas.T_in}°C — 직접급랭`,
    });
  } else if (s1.gas.T_in > 400) {
    candidates.push({
      type: "dry+precool",
      score: 0.8,
      reason: "고온 — HX 냉각 후 건식",
    });
  }
  
  // 디폴트 (일반산업)
  if (candidates.length === 0 || candidates.every(c => c.score < 0.7)) {
    candidates.push({
      type: "dry",
      score: 0.95,
      reason: "표준 건식 백필터",
    });
  }
  
  // 정렬·중복제거
  const sorted = dedupe(candidates).sort((a, b) => b.score - a.score);
  
  return {
    treatment_ranked: sorted,
    primary_choice: sorted[0],
    rationale: sorted[0].reason,
  };
}

function dedupe(arr: TreatmentCandidate[]): TreatmentCandidate[] {
  const map = new Map<string, TreatmentCandidate>();
  for (const c of arr) {
    const existing = map.get(c.type);
    if (!existing || c.score > existing.score) {
      map.set(c.type, c);
    }
  }
  return Array.from(map.values());
}
```

## 단위테스트

```typescript
describe("Stage 4 — Treatment", () => {
  it("일반 분진 → dry", () => {
    const r = decideTreatment({
      dust: { flammable: false, stickiness: "low" },
      gas: { T_in: 25, HCl: 0, SO2: 0 },
      derived: { ST_class: null },
    }, { water_available: true });
    expect(r.primary_choice.type).toBe("dry");
  });
  
  it("목분 → dry+explosion_protection", () => {
    const r = decideTreatment({
      dust: { flammable: true, Kst: 150 },
      derived: { ST_class: "ST1" },
      gas: { T_in: 25 },
    }, { water_available: false });
    expect(r.primary_choice.type).toBe("dry+explosion_protection");
  });
  
  it("MSW 소각 → semi-dry+SDA+AC", () => {
    const r = decideTreatment({
      dust: { flammable: false },
      gas: { T_in: 800, HCl: 800, SO2: 300, Hg: 0.05 },
    }, {});
    expect(r.primary_choice.type).toMatch(/semi-dry/);
  });
});
```
