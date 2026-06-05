import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/firebase/auth-context';

export const metadata: Metadata = {
  title: '집진설비 설계 웹앱',
  description: '8단 위저드 기반 집진설비 자동설계 + P&ID + 법규 컴플라이언스',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-pretendard antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
