# REPORT — 검증·실측 결과

작성일: 2026-05-07 (v0 — 검증 시작 전 골격)

---

## 0. 검증계획

각 계산모듈에 대해 다음 3단계 검증:
1. **단위테스트** — 식 자체 정확도 (100% 일치)
2. **문헌 사례** — KOSHA Guide·EPA·ACGIH 예제와 비교 (±5%)
3. **실측 사례** — F:\전문 자료의 실제 프로젝트와 비교 (±10~15%)

---

## 1. 단위테스트 결과

### Phase 2 (2026-05-07, 22:15) — 119/119 PASS ✅

| 모듈 | 테스트수 | PASS | FAIL |
|---|---|---|---|
| 01-properties | 14 | 14 | 0 |
| 02-hood | 6 | 6 | 0 |
| 03-duct | 6 | 6 | 0 |
| 04-treatment | 4 | 4 | 0 |
| 05-cyclone | 9 | 9 | 0 |
| 05-bag | 13 | 13 | 0 |
| 05-ep | 8 | 8 | 0 |
| 05-scrubber | 10 | 10 | 0 |
| 06-condenser | 7 | 7 | 0 |
| 07-fan | 15 | 15 | 0 |
| 08-safety+compliance | 20 | 20 | 0 |
| engine (Stage 1~4) | 3 | 3 | 0 |
| engine-full (Stage 1~8) | 4 | 4 | 0 |
| **누적** | **119** | **119** | **0** |

Duration: 1.16s

### Phase 1 (2026-05-07, 20:12) — 33/33 PASS ✅

| 모듈 | 테스트수 | PASS | FAIL | 비고 |
|---|---|---|---|---|
| 01-properties (stage1.test.ts) | 14 | 14 | 0 | ST 분류, Verhoff 노점, Magnus 수증기, 비저항, 처리방식 ranking |
| 02-hood (stage2.test.ts) | 6 | 6 | 0 | 8형식 풍량식, ρ_air, 발암성 가산 |
| 03-duct (stage3.test.ts) | 6 | 6 | 0 | Swamee-Jain, Sutherland, 권장 V_t 미달 경고 |
| 04-treatment (stage4.test.ts) | 4 | 4 | 0 | 건/습/반건 결정트리 |
| engine.test.ts (통합) | 3 | 3 | 0 | 일반산업·목재가공·MSW 풀 파이프라인 |
| **Phase 1 합계** | **33** | **33** | **0** | **100% PASS** |

**버그 수정 이력**:
- v0.1.0: Verhoff-Banchero 식 단위 오류 (atm → mmHg 변환 누락) → 수정 후 OK
- v0.1.0: 03-duct 반송속도 검증 로직 — 사용자 V_t vs 권장값 비교로 변경

### Phase 2~8 (예정)
| 모듈 | 목표 |
|---|---|
| 05-cyclone | 10+ (Stairmand HE/Lapple 6종) |
| 05-bag | 10+ (A/C, 여재 12종) |
| 05-ep | 10+ (Deutsch + 비저항 영향) |
| 05-scrubber | 10+ (벤추리·SDA·패킹·스프레이) |
| 06-condenser | 8+ (5형식 + 노점) |
| 07-fan | 12+ (1팬/2팬/N+1, 형식 5, VFD) |
| 08-safety | 10+ (Kst·Zone·NFPA 68) |
| 08-compliance | 15+ (15입력 → 12출력 매트릭스) |
| **Phase 2~8 합계** | **목표 110+ (누적)** |

---

## 2. 문헌 사례 검증

| 사례 | 출처 | 우리 결과 | 문헌 | 오차 | 판정 |
|---|---|---|---|---|---|
| KOSHA W-1 후드 예제 | KOSHA Guide W-1-2019 §X.X | TBD | TBD | TBD | TBD |
| ACGIH 산업환기 매뉴얼 예제 | 28th ed. | TBD | TBD | TBD | TBD |
| EPA Lesson 3 EP 예제 | EPA-450/2-81-005 | TBD | TBD | TBD | TBD |
| Cyclone 설계 예제 (Stairmand HE) | Coulson&Richardson 6e | TBD | TBD | TBD | TBD |
| Verhoff 황산노점 예제 | Verhoff&Banchero 1974 | TBD | TBD | TBD | TBD |

---

## 3. 실측 사례 검증 (F:\전문 자료)

| 사례 | 자료 | 적용 모듈 | 결과 |
|---|---|---|---|
| 울진소각시설 기계용량 | F:\전문\경호\11.울진소각\기계용량계산서.hwp | 풍량·송풍기 | TBD |
| 폐열발전 P&ID | F:\전문\경호\44.폐열발전설비 | 응축기·HX | TBD |
| 청주음폐수에너지화 | F:\전문\경호\30.청주음폐수에너지화 | 통합플랜트 | TBD |
| 배관압력손실 | F:\전문\경호\0.프로젝트기타자료\배관압력손실.pdf | 덕트 | TBD |
| 시멘트킬른 (외부) | 별도 확보 필요 | EP+백 하이브리드 | TBD |

---

## 4. UX·성능 검증

| 항목 | 목표 | 현재 | 판정 |
|---|---|---|---|
| Lighthouse Performance | 90+ | TBD | - |
| Lighthouse SEO | 95+ | TBD | - |
| Lighthouse Accessibility | 95+ | TBD | - |
| First Contentful Paint | <1.5s | TBD | - |
| Time to Interactive | <3s | TBD | - |
| 8단 위저드 완료시간 | <10분 | TBD | - |
| PDF 생성 시간 | <5s | TBD | - |
| 3D 모델 로딩 | <3s | TBD | - |

---

## 5. 보안·법규 검증

- [ ] Firebase Security Rules 검증
- [ ] PII 처리 정책 (회사명·이메일)
- [ ] 컴플라이언스 리포트 면책조항 명시
- [ ] 저작권 — KOSHA Guide PDF 직접 호스팅 X (링크만)
- [ ] 개인정보처리방침·이용약관

---

## 6. 결론·다음 작업

- 모든 검증 항목 **TBD** (Phase 1~8 진행 중 채워질 예정)
- v1.0 출시 시점에 본 문서 100% 채움 + 사용자 검토 받음
- 검증 미달 항목은 BACK-CHECKLIST로 이전
