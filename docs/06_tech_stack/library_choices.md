# 라이브러리 선택 — 7개 영역 + 보조

| # | 영역 | 1순위 | 2순위 | 비고 |
|---|---|---|---|---|
| 1 | 프레임워크 | Next.js 15 + React 19 + TS 5.7 | - | App Router, Edge runtime 기본 |
| 2 | 상태관리 | Zustand 5.0 | - | 8단 store 일관성 |
| 3 | UI | Tailwind 3 + Radix/shadcn | - | 다크모드, KS 표제란 |
| 4 | 폼/검증 | React Hook Form + Zod 3 | - | 단계별 검증 |
| 5 | DB/Auth | Firebase Firestore + Auth + Functions | Supabase | 벨트작업방 패턴 그대로 |
| 6 | i18n | next-intl 3 | - | 한/영 |
| 7 | 테마 | next-themes | - | 다크모드 |
| 8 | 3D 뷰어 | @react-three/fiber@9 + drei | Babylon.js | R3F v9 RC 안정성 검증 필요 |
| 9 | AR | @google/model-viewer | 8th Wall (유료) | iOS Quick Look + Android Scene Viewer |
| 10 | P&ID 다이어그램 | @xyflow/react | JointJS Core | MIT, 1M+ DL |
| 11 | 배치도/단면도 | konva + react-konva | D3.js | 자유 도형 |
| 12 | DXF 출력 | @dxfjs/writer | MakerJS | 한글 MTEXT 주의 |
| 13 | PDF 보고서 | @react-pdf/renderer 4.x | pdfmake | Pretendard URL 임베드 |
| 14 | 차트 | Recharts | Apache ECharts | 벨트작업방 일관성 |
| 15 | 엑셀 | xlsx (SheetJS) | exceljs | BOM·계산서 |
| 16 | 단위환산 | mathjs | convert-units | m³/min↔CFM, Pa↔mmAq |
| 17 | 다이어그램 레이아웃 | elkjs | dagre | 자동 배치 |
| 18 | 테스트 | Vitest 2 + Playwright | - | 110+ 단위 + 10 E2E |
| 19 | 결제 | @paypal/react-paypal-js + 토스페이먼츠 SDK | - | 벨트 functions 재사용 |

## 추가 라이브러리

| 라이브러리 | 용도 |
|---|---|
| `@xyflow/react` | P&ID 자체편집 |
| `react-konva` | 단면도/배치도 캔버스 |
| `@dxfjs/writer` | DXF 내보내기 |
| `gltf-pipeline` | glTF 최적화 (build time) |
| `meshoptimizer` | 3D 모델 압축 |
| `lucide-react` | 아이콘 |
| `clsx` + `tailwind-merge` | 클래스 합성 |
| `nanoid` | ID 생성 |
| `js-yaml` | 법규 룰셋 YAML 로드 |
| `date-fns` | 안전검사 도래일 |
| `react-pdf` (또는 `pdfjs-dist`) | PDF 미리보기 |

## 빌드 도구

- **번들러**: Next.js 내장 (Turbopack)
- **CSS**: Tailwind 3 + PostCSS
- **린트**: ESLint 9 + Prettier 3
- **타입체크**: tsc --noEmit
- **CI/CD**: GitHub Actions → Firebase Hosting

## package.json 베이스

```json
{
  "name": "dust-collector-designer",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "seed": "node scripts/seed-dust-types.mjs"
  },
  "dependencies": {
    "next": "15.1.4",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "typescript": "5.7.3",
    "zustand": "5.0.2",
    "tailwindcss": "3.4.17",
    "lucide-react": "0.469.0",
    "react-hook-form": "7.54.2",
    "zod": "3.24.1",
    "next-intl": "3.26.3",
    "next-themes": "0.4.4",
    "firebase": "11.0.2",
    "@react-three/fiber": "9.0.0",
    "@react-three/drei": "9.114.0",
    "three": "0.171.0",
    "@google/model-viewer": "4.0.0",
    "@xyflow/react": "12.4.4",
    "konva": "9.3.18",
    "react-konva": "19.0.0",
    "@dxfjs/writer": "2.2.4",
    "@react-pdf/renderer": "4.1.6",
    "recharts": "3.8.1",
    "xlsx": "0.18.5",
    "mathjs": "14.0.1",
    "elkjs": "0.9.3",
    "js-yaml": "4.1.0",
    "date-fns": "4.1.0",
    "nanoid": "5.0.9",
    "clsx": "2.1.1",
    "tailwind-merge": "2.5.5",
    "@paypal/react-paypal-js": "8.8.3"
  },
  "devDependencies": {
    "vitest": "2.1.8",
    "@vitest/ui": "2.1.8",
    "@playwright/test": "1.49.1",
    "@types/react": "19.0.0",
    "@types/node": "22.10.2",
    "eslint": "9.17.0",
    "eslint-config-next": "15.1.4",
    "prettier": "3.4.2",
    "postcss": "8.4.49",
    "autoprefixer": "10.4.20"
  }
}
```
