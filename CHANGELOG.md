# CHANGELOG

본 프로젝트의 모든 변경사항을 기록합니다. [Keep a Changelog](https://keepachangelog.com/) 형식.

## [1.3.0-pptx] — 2026-05-30

### Added — v1.6 PowerPoint (.pptx)
- lib/pptx/concept-pptx.ts — ConceptSet → 편집 가능한 6슬라이드 .pptx (pptxgenjs)
  - 표지·요약·조건표·3안 비교표·1순위 상세·다음단계
- deck 페이지에 "PowerPoint(.pptx) 다운로드 — 편집 가능" 버튼
- next.config: 클라이언트 번들 Node 빌트인 fallback + IgnorePlugin (node: 스킴)
  → pptxgenjs(node:https 참조) 브라우저 번들 호환

### Verified
- 빌드 성공, vitest 148 PASS 유지
- MSW 시나리오 .pptx 생성·다운로드 정상 (콘솔 무에러)

## [1.2.0-deck] — 2026-05-30

### Added — v1.5 슬라이드/보고서
- lib/pdf/ConceptDeck.tsx — 6장 가로 슬라이드 데크 (표지·요약·조건·3안비교·1순위상세·다음단계)
- components/pdf/DeckPreview.tsx — Blob iframe + 다운로드 + 4회 재시도
- lib/concept/notebooklm-export.ts — NotebookLM 업로드용 Markdown export
- app/designer/concepts/deck — 슬라이드 PDF + Markdown 다운로드
- lib/pdf/fonts.ts — 공유 폰트 모듈 (NanumGothic 단일 등록)

### Fixed (PDF hang 안정화 — 3종 근본원인)
- PDF Text 내 이모지(🏆✓✗⚠📋★) → NanumGothic 글리프 없음 → ASCII 대체
- 중첩 `<Text>` + `\n` 혼합 → yoga 레이아웃 무한 hang → 단순화
- flexWrap+gap+%width → 단순 행 레이아웃으로 변경
- PDFPreview/DeckPreview 4회 재시도 + CDN woff2 폰트 확정

## [1.1.0-concept] — 2026-05-30

### Added — Concept Workflow (Brief → 3안 비교 → 결정 → 8단 자동연동)
- Phase A: Brief 입력(app/designer/brief) + 산업 17→25개 + equipment-sizing.ts + standard-layout.ts
- Phase B: generator.ts (건/습/반건 3안) + rules.ts (트레이드오프·CAPEX/OPEX·스코어), CAPEX 턴키 보정
- Phase C: concepts 페이지 3안 비교 + qa-scenarios.ts (10 시나리오 룰엔진)
- Phase D·E: decide 페이지 설비 외형·노즐·이격 표 + 덕트 표준배치 표 + 부지·높이 산출
- Phase F·G: to-stages.ts (Concept→8단 자동매핑) + decide→8단 주입 + 일관성 검증
- Phase H: concept 16 테스트, 누적 148 PASS, production build OK

### Verified
- MSW → 반건식 SDA+활성탄+백필터 추천 (PM 99.9%/HCl 99%/다이옥신 95%)
- 목재가공 → 사이클론+백필터 방폭 / 시멘트 → EP, wet 정합성 경고
- 폐수 불가 제약 → 습식안 feasible=false 자동 제외

## [Unreleased]

### Pending — Phase 3~8
- 데이터 시드 확장 (분진 80종 DB, 압력손실 케이스, 산업 사례 100+)
- 위저드 UI 8단 페이지
- P&ID 자동생성 (xyflow + 5 프리셋)
- 3D 뷰어 + AR + TCO 그래프
- PDF 12p + BOM 엑셀
- 결제·SEO·QA·배포

## [0.2.0-phase2] — 2026-05-07

### Added — Phase 2 완료 (Stage 5~8 + 86 테스트)

**types.ts 확장**
- Stage 5~8 인터페이스 (Bag/Cyclone/EP/Scrubber, Condenser, Fan, Safety, Compliance)
- PSD, FacilityType, ClassNo, KoreaRegion, FanType, CondenserType 등 enum

**데이터 시드 (4개)**
- cyclone-standards.ts — Stairmand HE/HT, Lapple, Swift HE/GP, Peterson 6종 비율표
- filter-media.ts — 여재 12종 + recommendMedia + recommendAC + cake resistance
- drift-velocity.ts — EP 드리프트 속도 산업별 lookup
- fan-curves.ts — 송풍기 5형식 + 표준 모터 27개

**계산엔진 Stage 5~8 (8개 모듈)**
- 05-cyclone.ts: Lapple d50/η, Stairmand HE/HT 등 6종, autoMulticyclone
- 05-bag.ts: A/C, 여재추천, ΔP 모델, 펄스공기
- 05-ep.ts: Deutsch + Modified D-Matts + 비저항 보정 + 컨디셔닝 권장
- 05-scrubber.ts: Calvert, Yung-Calvert, Nukiyama-Tanasawa, SDA stoichiometry
- 05-collector.ts: Stage 5 통합 + series secondary
- 06-condenser.ts: 5형식 결정, 노점 검증, 응축수, 폐열 ROI
- 07-fan.ts: 1팬/2팬/N+1, 5형식, BHP, VFD ROI (어피니티 법칙)
- 08-safety.ts: NFPA 68 폭발벤트, Zone 20/21/22 분류
- 08-compliance.ts: 12항목 자동판정, 종별 분류, TMS, 보조금 매칭

**engine.ts** — 8단 통합 파이프라인 (Stage 5~8 추가)

**단위테스트 (86 추가, 누적 119)**
- stage5-cyclone (9), stage5-bag (13), stage5-ep (8), stage5-scrubber (10)
- stage6 (7), stage7 (15), stage8 (20), engine-full (4)

### Fixed
- MSW 산업 + 산성가스 시 여재 추천 PPS → PTFE (다이옥신 흡착 표준 반영)
- Yung-Calvert 효율식 L/G 단위 오류 — 1 - exp(-3 × η_single × L/G)로 정정
- Stage 3 반송속도 검증 — 사용자 V_t vs 권장값 비교 추가

## [0.1.0-phase1] — 2026-05-07

### Added — Phase 0~1 완료
**문서 (32개)**
- BLUEPRINT v2 + ROADMAP + LOG + CHANGELOG + CHECKLIST + BACK-CHECKLIST + REPORT
- docs/01_design_methodology/ 3개
- docs/02_collector_matrix/ 6개
- docs/03_compliance/ 5개
- docs/04_flowcharts/ 4개
- docs/05_calc_engine/ 11개
- docs/06_tech_stack/ 3개
- docs/99_research/ 7개

**기술스택 (Next.js scaffold)**
- Next.js 15 + React 19 + TypeScript 5.7 + Tailwind 3
- Zustand 5 (persist)
- React Hook Form + Zod
- Vitest 2 + ESLint
- Firebase 11 + next-intl 3 + next-themes
- @xyflow/react 12, Recharts 3, @react-pdf/renderer 4, xlsx, mathjs, elkjs

**reference 링크**
- reference/전문/ 5개 junction (울진소각, 청주음폐수, 폐열발전, 배관기술자료, 프로젝트기타자료)
- reference/mywiki/ 8개 노트 복사

**Phase 1 — 계산엔진 1~4단 (코드)**
- lib/calc/dust/types.ts — 8단 통합 타입
- lib/calc/dust/01-properties.ts — Verhoff-Banchero, Magnus, ST 분류, 처리방식 ranking
- lib/calc/dust/02-hood.ts — 8형식 풍량식, K_hood 정압
- lib/calc/dust/03-duct.ts — Swamee-Jain 마찰계수, Sutherland 점도
- lib/calc/dust/04-treatment.ts — 건/습/반건 결정트리
- lib/calc/dust/engine.ts — 8단 통합 파이프라인
- lib/store/dust-store.ts — Zustand persist + 자동 재계산

**데이터 시드**
- lib/data/dust/kosha-controls.ts — 별표13 제어풍속표
- lib/data/dust/duct-fittings.ts — 반송속도, 조도, 손실계수
- lib/data/dust/dust26-list.ts — 산안법 별표16 26종 + 의무
- lib/data/dust/industries.ts — 17 산업 표준조합

**단위테스트 (Vitest, 33+ 케이스)**
- stage1.test.ts (ST·노점·랭킹) 15+
- stage2.test.ts (후드 풍량) 5+
- stage3.test.ts (덕트 사이징) 6+
- stage4.test.ts (처리방식) 4+
- engine.test.ts (통합 파이프라인) 3+

### Decided
- 기술스택 17개 영역 1순위/2순위 확정
- 5종 P&ID 표준 흐름도 프리셋
- 6×3 = 18조합 매트릭스
- 8단 계산엔진 파이프라인

### Pending — Phase 2~8
- Stage 5~8 계산엔진 (cyclone, bag, EP, scrubber, condenser, fan, safety, compliance)
- 위저드 UI 8단 페이지
- P&ID 자동생성 (xyflow + 5 프리셋)
- PDF 12p, BOM 엑셀
- 3D 뷰어 + AR + TCO

### Removed
- v1 초안의 6단계 요금제 디테일 (요금제는 나중 산정으로 보류)

## [0.0.1] — 2026-05-07

### Added
- 프로젝트 시작
- 참고방(스크류/벨트) 구조 분석 완료
- F:\전문, E:\mywiki 자료 인덱싱
- 한국 집진설비 시장조사 (디지털 공백 100% 확인)
