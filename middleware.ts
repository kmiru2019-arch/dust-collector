import { NextRequest, NextResponse } from 'next/server';

/**
 * 사이트 비공개 게이트 (구축 중 전용) — 집진설비
 * SITE_GATE_ENABLED='true' 일 때만 비밀번호(Basic Auth) 요구.
 * 오픈/심사 시 apphosting.yaml의 SITE_GATE_ENABLED 를 'false' 로 토글 후 재배포.
 */
export function middleware(req: NextRequest) {
  if (process.env.SITE_GATE_ENABLED !== 'true') {
    return NextResponse.next();
  }

  const expectedUser = process.env.SITE_GATE_USER || 'mecha';
  const expectedPass = process.env.SITE_GATE_PASS || '';

  const auth = req.headers.get('authorization');
  if (auth) {
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic' && encoded) {
      try {
        const decoded = atob(encoded);
        const idx = decoded.indexOf(':');
        const user = decoded.slice(0, idx);
        const pass = decoded.slice(idx + 1);
        if (user === expectedUser && pass === expectedPass) {
          return NextResponse.next();
        }
      } catch {
        // 잘못된 인코딩 → 401
      }
    }
  }

  return new NextResponse('비공개 — 준비 중입니다 (Private — Coming soon)', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Private Site", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|sw.js|lottery-icon).*)'],
};
