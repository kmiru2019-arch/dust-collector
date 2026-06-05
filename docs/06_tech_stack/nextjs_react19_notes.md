# Next.js 15 + React 19 호환성 메모

집진설비 웹앱 개발 중 주의해야 할 호환성 이슈.

## 1. R3F (@react-three/fiber)

**핵심 이슈**: R3F v8은 React 19 비호환.
- `@react-three/fiber@9` 이상 필수 (현재 RC, 안정화 진행 중)
- `@react-three/drei@9.114+` 필요

**Next.js App Router에서 SSR 회피**:
```tsx
'use client';
import dynamic from 'next/dynamic';

const Plant3DViewer = dynamic(() => import('./Plant3DViewer'), {
  ssr: false,
  loading: () => <div>3D 로딩...</div>,
});
```

## 2. @react-pdf/renderer 4.x

- React 19 지원 OK (4.1+)
- **Edge Runtime에서**: 로컬 파일시스템 미지원 → Pretendard 폰트 URL 등록
```typescript
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'Pretendard',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/web/static/woff2-subset/Pretendard-Regular.subset.woff2', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/web/static/woff2-subset/Pretendard-SemiBold.subset.woff2', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/web/static/woff2-subset/Pretendard-Bold.subset.woff2', fontWeight: 700 },
  ],
});
```

- PDF 생성은 무거우므로 Node Runtime에서 (`export const runtime = 'nodejs'`)

## 3. @xyflow/react (React Flow 12)

- React 19 지원 OK
- `'use client'` 필수
- 노드 1000개+에서 성능 저하 — `nodeOrigin`, `panOnDrag={false}` 등으로 최적화
- Custom node는 `React.memo()` 필수

## 4. Konva + react-konva

- react-konva 19.x 가 React 19 지원
- SSR 미지원 → `dynamic(..., { ssr: false })`

## 5. Firebase 11.x

- React 19 호환 OK
- `getApps()` 패턴으로 중복 초기화 방지
- Edge Runtime에서 Firebase Admin SDK 미지원 → Functions 또는 Node API route

```typescript
// lib/firebase/client.ts
import { initializeApp, getApps, getApp } from 'firebase/app';

const config = { /* env vars */ };
export const app = getApps().length === 0 ? initializeApp(config) : getApp();
```

## 6. next-intl 3.x

- App Router 기본
- `i18n.ts` 정적 라우팅
- 한/영 두 언어, 한국어 디폴트

## 7. Edge vs Node Runtime 매트릭스

| API 라우트 | Runtime | 사유 |
|---|---|---|
| `/api/v1/calc` | Edge | 빠른 응답, 외부 API |
| `/api/pdf` | Node | @react-pdf/renderer Buffer 처리 |
| `/api/paypal/webhook` | Node | 서명 검증 라이브러리 |
| `/api/toss/webhook` | Node | 동일 |

## 8. Turbopack

- Next.js 15 기본 dev server
- `next dev --turbo`
- Three.js·xyflow 등 큰 라이브러리에서 빠른 HMR

## 9. React 19 Compiler (옵션)

- React Compiler (Forget) — 자동 메모이제이션
- 안정화 후 도입 검토 (현재 베타)

## 10. 빌드 사이즈 관리

- `dynamic import` 적극 활용 (R3F, xyflow, Konva 모두 무거움)
- Tree-shaking 확인 (mathjs는 큼 → 부분 import)
- Three.js GLB 모델은 외부 CDN 또는 Storage

```typescript
import { evaluate } from 'mathjs/number';  // ~50KB만
// 대신:
// import * as math from 'mathjs';  // ~700KB 전체
```

## 11. 테스트

- Vitest 2: React 19 + ESM 호환
- Playwright: 모바일 AR은 헤드리스에서 미작동 → 수동 테스트 또는 BrowserStack

## 12. 배포

- Firebase Hosting + Functions
- 한국 리전 (asia-northeast3 = 서울)
- Cloud Run 컨테이너 (PDF 생성 등 무거운 워크로드)
