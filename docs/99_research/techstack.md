# 리서치 — 기술스택 비교 (원본)

조사일: 2026-05-07
정제: docs/06_tech_stack/

## A. 3D 웹뷰어

| 라이브러리 | 주간 DL | 라이선스 | Next.js 15/React 19 | 한국어 자료 | 학습 | 커뮤니티 |
|---|---|---|---|---|---|---|
| three.js | ~1.7M | MIT | OK (SSR 주의) | 풍부 | 중상 | 매우 활발 |
| @react-three/fiber (R3F) | ~700K | MIT | v9 RC 이후 OK | 중 | 중 | 매우 활발 |
| @react-three/drei | ~515K | MIT | R3F v9 호환 | 중 | 중 | 활발 |
| <model-viewer> | ~70K | Apache-2.0 | OK (web component) | 적음 | 하 | 활발 (Google) |
| Babylon.js | ~250K | Apache-2.0 | OK | 적음 | 중상 | 활발 (MS) |
| Cesium | ~80K | Apache-2.0 | OK (무거움) | 거의 없음 | 상 | 지오 특화 |

**핵심**: R3F v8 → React 19 비호환. v9+ 필수.
**Next.js App Router**: `'use client'` + `dynamic({ssr:false})`.
**추천**: R3F + drei (편집 풍부) + <model-viewer> (AR 진입). 단일이면 model-viewer.

## B. AR (모바일 웹)

| 솔루션 | iOS | Android | 비용 | 정확도 |
|---|---|---|---|---|
| WebXR Device API | iOS Safari 미지원 | Chrome 79+ OK | 무료 | 높음 |
| <model-viewer ar> | Quick Look (USDZ) 자동 | Scene Viewer (intent) | 무료 | 중상 |
| 8th Wall | OK (자체 SLAM) | OK | $700/월 | 매우 높음 |
| Niantic Lightship | OK | OK | 25k콜/월 무료 | 매우 높음 |
| AR.js | 마커기반만 | 마커기반만 | 무료 | 낮음 |

**1순위**: <model-viewer ar> (iOS/Android 자동분기, 무료).
**현장 정확도**: 단색 콘크리트 바닥 plane 인식 실패 빈번 → QR 마커 + WebXR Hit Test 병행 또는 8th Wall.

## C. 자동 SVG/도면

| 라이브러리 | 주간 DL | 라이선스 | 적합 |
|---|---|---|---|
| @xyflow/react (React Flow) | ~1M+ | MIT | P&ID, 노드 |
| GoJS | ~25K | 상용 | 산업도면 풀기능 |
| JointJS Core | ~50K | MPL-2.0 | P&ID, BPMN |
| draw.io / mxGraph | - | Apache-2.0 | 범용 (구식) |
| Konva.js (react-konva) | ~649K | MIT | 자유 캔버스 |
| D3.js | ~5M | ISC | 풀 커스텀 |

**P&ID 1순위**: @xyflow/react. 2순위: JointJS Core.
**배치도/단면도 1순위**: Konva + react-konva. 2순위: D3 + 순정 SVG.

## D. DXF 내보내기

| 라이브러리 | 형식 | 라이선스 | 한계 |
|---|---|---|---|
| dxf-writer | 2D DXF (R12) | MIT | 마지막 갱신 3년 전 |
| @dxfjs/writer | 2D DXF (AC1027) | MIT | 활발 |
| three-dxf (parser) | 읽기 | MIT | 내보내기 X |
| MakerJS | DXF/SVG/PDF | Apache-2.0 | 레이어 제약 |
| opencascade.js | STEP/IGES/STL | LGPL | WASM 13MB+ |

**1순위**: @dxfjs/writer. 2순위: MakerJS (파라메트릭).
**DWG 직접 생성 불가** — ODA 라이선스 유료. AutoCAD/LibreCAD 변환 안내.

## E. PDF 보고서

| 라이브러리 | 환경 | Edge | 한국어 |
|---|---|---|---|
| @react-pdf/renderer 4.x | Node/Browser | 부분 (Font src URL) | Pretendard URL OK |
| pdfmake | Browser/Node | OK | vfs 사전 임베드 |
| jsPDF + html2canvas | Browser | OK | 캡처식, 검색X |
| PDFKit | Node | NO | 풀 커스텀 |
| Puppeteer | Node | NO | HTML→PDF 무거움 |

**1순위**: @react-pdf/renderer (벨트작업방 일관성, Pretendard URL 임베드).
**Edge Runtime**: Font.register({src: cdn url}) 사용.

## F. 단위환산

| 라이브러리 | 주간 DL | 용도 |
|---|---|---|
| mathjs | ~2M | 단위 자동환산 + 수식 |
| convert-units | ~92K | 변환만 |
| decimal.js | ~20M | 임의정밀 |
| big.js | ~15M | 경량 |

**1순위**: mathjs. 부분 import (`mathjs/number`)로 사이즈 절감.

## G. 차트

| 라이브러리 | 주간 DL | 라이선스 | 강점 |
|---|---|---|---|
| Recharts | ~3M | MIT | React 친화, 단순 |
| Apache ECharts | ~2M | Apache-2.0 | 대시보드, 3D |
| Chart.js | ~5M | MIT | Canvas, 대량 |
| visx | ~200K | MIT | D3 저수준 |

**1순위**: Recharts. 2순위: Apache ECharts (집진성능 곡선).

## H. 표·BOM 엑셀

- xlsx (SheetJS CE) — 보편, MIT
- exceljs — 서식·이미지 강점

**1순위**: xlsx. 서식 필요 시 exceljs.

## I. 종합 추천 스택

| # | 영역 | 1순위 | 2순위 |
|---|---|---|---|
| 1 | 3D 뷰어 | @react-three/fiber@9 + drei | Babylon.js |
| 2 | AR | @google/model-viewer | 8th Wall |
| 3 | P&ID | @xyflow/react | JointJS Core |
| 4 | 배치도/단면도 | konva + react-konva | D3 + 순정 SVG |
| 5 | DXF | @dxfjs/writer | MakerJS |
| 6 | PDF | @react-pdf/renderer 4.x | pdfmake |
| 7 | 차트 | Recharts | Apache ECharts |
| 보조 | 단위 | mathjs | convert-units |
| 보조 | 엑셀 | xlsx | exceljs |
| 보조 | 레이아웃 | elkjs | dagre |

## 출처

- [@react-three/fiber](https://www.npmjs.com/package/@react-three/fiber)
- [@react-three/drei](https://www.npmjs.com/package/@react-three/drei)
- [Next.js 15 + R3F 호환](https://github.com/vercel/next.js/issues/71836)
- [<model-viewer> AR](https://modelviewer.dev/examples/augmentedreality/index.html)
- [Google Scene Viewer](https://developers.google.com/ar/develop/scene-viewer)
- [@xyflow/react](https://www.npmjs.com/package/@xyflow/react)
- [JS diagramming libraries 2026](https://www.jointjs.com/blog/javascript-diagramming-libraries)
- [@dxfjs/writer](https://github.com/dxfjs/writer)
- [Maker.js](https://maker.js.org/)
- [@react-pdf/renderer compatibility](https://react-pdf.org/compatibility)
- [@react-pdf/renderer fonts](https://react-pdf.org/fonts)
- [WebXR caniuse](https://caniuse.com/webxr)
- [WebXR on iOS](https://launch.variant3d.com/blog/23-06-state-webxr-on-ios-beyond)
- [8th Wall pricing](https://www.8thwall.com/pricing)
- [Niantic Lightship pricing](https://community.nianticspatial.com/t/pricing-changes-of-lightship/5134)
- [Best JS charting libraries 2026](https://www.pkgpulse.com/blog/best-javascript-charting-libraries-2026)
- [Konva.js](https://konvajs.org/)
- [KS A 0106](https://www.kssn.net/search/stddetail.do?itemNo=K001010099613)
- [KS A 0005](https://kssn.net/search/stddetail.do?itemNo=K001010103199)
