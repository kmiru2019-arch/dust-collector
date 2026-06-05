# ROADMAP — 집진설비 설계 웹앱

작성일: 2026-05-07

---

## v1.0 MVP (12주)

### Phase 0 — 기반 구축 (1주차)
- [ ] 작업방 폴더 구조 생성
- [ ] BLUEPRINT.md 확정 (사용자 승인)
- [ ] ROADMAP / CHECKLIST / BACK-CHECKLIST / LOG / CHANGELOG / REPORT 골격
- [ ] reference\전문\ 심볼릭링크 5개
- [ ] reference\mywiki\ 심볼릭링크 8개
- [ ] docs\ 하위 11개 디테일 문서 작성
- [ ] 기술스택 확정 (package.json 베이스)
- [ ] Next.js scaffold (벨트작업방 패턴 복사)
- [ ] Firebase 프로젝트 생성·연동
- [ ] Vitest·ESLint·Prettier 설정

### Phase 1 — 계산엔진 1/2 (2~3주차)
- [ ] lib/calc/dust/01-properties.ts (분진성상)
- [ ] lib/calc/dust/02-hood.ts (KOSHA W-1 후드 8종)
- [ ] lib/calc/dust/03-duct.ts (Darcy + 손실계수)
- [ ] lib/calc/dust/04-treatment.ts (건/습/반건 결정트리)
- [ ] lib/data/dust/kosha-controls.ts (별표13)
- [ ] lib/data/dust/hood-types.ts (8종)
- [ ] lib/data/dust/duct-fittings.ts (손실계수표)
- [ ] 단위테스트 50건

### Phase 2 — 계산엔진 2/2 (4~5주차)
- [ ] 05-cyclone.ts (Stairmand/Lapple/Swift 6종 + Lapple/Barth/Iozia 효율식)
- [ ] 05-bag.ts (펄스제트 A/C, ΔP 모델)
- [ ] 05-cartridge.ts (HEPA·셀룰로오스·PTFE)
- [ ] 05-ep.ts (Deutsch + Modified Deutsch-Matts + 비저항 보정)
- [ ] 05-scrubber.ts (벤추리 ΔP·효율, 패킹·스프레이)
- [ ] 05-settling.ts (Stokes)
- [ ] 05-inertial.ts (루버·미스트E)
- [ ] 06-condenser.ts (5형식 + Verhoff-Banchero 노점 + 응축수)
- [ ] 07-fan.ts (1팬/2팬/N+1 결정 + 5형식 + VFD ROI)
- [ ] 08-safety.ts (Kst·MIE·Zone 20/21/22 + 폭발벤트면적 NFPA68)
- [ ] 08-compliance.ts (12항목 자동판정)
- [ ] engine.ts (8단 통합 파이프라인)
- [ ] 단위테스트 60건

### Phase 3 — 데이터 시드 (6주차)
- [ ] dust-types.ts (분진 80종 DB)
- [ ] filter-media.ts (여재 12종 + 온도한계)
- [ ] cyclone-standards.ts (6종 표준비율)
- [ ] fan-curves.ts (송풍기 5형식 성능)
- [ ] industries.ts (17산업 표준조합)
- [ ] dust26-list.ts (산안법 별표16)
- [ ] compliance/rules/*.yaml (법규 룰셋 8개)
- [ ] scripts/seed-dust-types.mjs

### Phase 4 — 위저드 UI (7주차)
- [ ] components/designer/Stage1Properties.tsx
- [ ] Stage2Hood / Stage3Duct / Stage4Treatment
- [ ] Stage5Collector (6방식 분기 탭)
- [ ] Stage6Condenser / Stage7Fan / Stage8Compliance
- [ ] ResultPage (KPI 대시보드)
- [ ] lib/store/dust-store.ts (Zustand)
- [ ] ValidationBanner (단계별 검증)
- [ ] CalcInfoPopover (식·출처)

### Phase 5 — 도면·보고서 (8~9주차)
- [ ] lib/drawing/dust/symbols/ ISO 14617 + ISA-5.1 SVG 심볼셋
- [ ] lib/drawing/dust/presets/ 5종 P&ID 프리셋
- [ ] lib/drawing/dust/pid-generator.ts (JSON → React Flow nodes)
- [ ] components/flowchart/PIDViewer.tsx
- [ ] components/flowchart/SectionView.tsx (Konva)
- [ ] components/flowchart/PlotPlan.tsx (Konva)
- [ ] lib/drawing/dust/dxf-export.ts (@dxfjs/writer)
- [ ] PDF 보고서 12페이지 (@react-pdf/renderer + Pretendard URL 임베드)
- [ ] BOM 엑셀 (xlsx)

### Phase 6 — 차별화 (10주차)
- [ ] components/3d/Plant3DViewer.tsx (R3F + drei)
- [ ] components/3d/ARButton.tsx (model-viewer)
- [ ] public/3d-models/ glTF 8종 (필터·사이클론·EP·후드·송풍기·HX)
- [ ] components/compliance/ComplianceReport.tsx (12항목)
- [ ] components/tco/TCOChart.tsx (5년 그래프)
- [ ] What-if 패널 (Recharts 민감도)

### Phase 7 — 결제·SEO (11주차)
- [ ] 6단계 요금제 페이지 (간략, 추후 정밀화)
- [ ] PayPal·토스 webhook 통합 (벨트 functions 재사용)
- [ ] SEO 페이지 5개:
  - [ ] /compare/cartridge-vs-bag
  - [ ] /compare/ep-vs-bag
  - [ ] /industries/woodworking
  - [ ] /industries/cement
  - [ ] /industries/incineration
- [ ] 단일 계산기 4종 (SEO 자석):
  - [ ] /tools/airflow
  - [ ] /tools/hood
  - [ ] /tools/pressure-loss
  - [ ] /tools/dewpoint
- [ ] sitemap.xml + robots.txt + OG 태그

### Phase 8 — QA·배포 (12주차)
- [ ] E2E 테스트 (Playwright) 핵심 시나리오 10건
- [ ] 실측 사례 검증 5건 (울진소각·제재공장 등)
- [ ] Lighthouse 90+ (Performance/SEO/Accessibility)
- [ ] Firebase Hosting 배포
- [ ] 도메인 연결·SSL
- [ ] Google Search Console 등록

---

## v1.5 (3~4개월 후)

- [ ] 영문화 (next-intl)
- [ ] CFD-lite 기류 시각화 (후드 제어풍속 영역)
- [ ] AR 정확도 향상 (8th Wall 또는 QR 마커)
- [ ] 외부 REST API (월 1000회, Bearer 인증)
- [ ] 도면 버전관리·공유링크
- [ ] 회사 CI·결재자 자동 임베드
- [ ] 더 많은 산업 (반도체·제약·섬유·제지)
- [ ] AI 추천: 자연어로 "공정 설명" → 자동 입력 (Claude API)

---

## v2.0 (6~12개월 후)

- [ ] IoT 차압 대시보드 (Lifetime 전용)
- [ ] ESP32 + MQTT 차압센서 키트 판매
- [ ] 필터수명 ML 예측 모델
- [ ] 자동 A/S 콜·교체부품 견적
- [ ] 협력사 공급망 마켓플레이스
- [ ] B2B SaaS 멀티테넌시
- [ ] 모바일앱 (React Native + Expo)
