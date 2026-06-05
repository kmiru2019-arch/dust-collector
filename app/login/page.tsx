'use client';

/**
 * 로그인 페이지 — 집진설비 설계 도구
 * - Google + 이메일/비밀번호 + 데모
 * - 자체 한/영 토글 (집진엔 전역 i18n 없음)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth-context';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } from '@/lib/firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, configured } = useAuth();
  const [isEn, setIsEn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!loading && user) router.replace('/designer');
  }, [user, loading, router]);

  const mapAuthError = (code: string): string => {
    switch (code) {
      case 'auth/email-already-in-use':
        return isEn ? 'Email already in use. Try signing in.' : '이미 가입된 이메일입니다. 로그인해 주세요.';
      case 'auth/invalid-email':
        return isEn ? 'Invalid email format.' : '이메일 형식이 올바르지 않습니다.';
      case 'auth/weak-password':
        return isEn ? 'Password must be at least 6 characters.' : '비밀번호는 6자 이상이어야 합니다.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return isEn ? 'Incorrect email or password.' : '이메일 또는 비밀번호가 올바르지 않습니다.';
      case 'auth/too-many-requests':
        return isEn ? 'Too many attempts. Try again later.' : '시도가 너무 많습니다. 잠시 후 다시 시도하세요.';
      default:
        return isEn ? 'Something went wrong. Please try again.' : '오류가 발생했습니다. 다시 시도해 주세요.';
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error('Google login failed:', e);
      setError(isEn ? 'Google login failed. Check Firebase setup or popup blocker.' : 'Google 로그인 실패. Firebase 셋업 또는 팝업 차단을 확인하세요.');
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email || !password) {
      setError(isEn ? 'Enter email and password.' : '이메일과 비밀번호를 입력하세요.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password);
        setInfo(isEn ? 'Verification email sent. You are signed in.' : '인증 메일을 보냈습니다. 로그인되었습니다.');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setError(mapAuthError((err as { code?: string })?.code ?? ''));
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email) {
      setError(isEn ? 'Enter your email first.' : '먼저 이메일을 입력하세요.');
      return;
    }
    try {
      await resetPassword(email);
      setInfo(isEn ? 'Password reset email sent.' : '비밀번호 재설정 메일을 보냈습니다.');
    } catch (err) {
      setError(mapAuthError((err as { code?: string })?.code ?? ''));
    }
  };

  const handleDemoLogin = () => {
    try {
      localStorage.setItem('dust_demo_user', JSON.stringify({ uid: 'demo-' + Date.now(), displayName: isEn ? 'Demo User' : '체험 사용자', isDemo: true }));
    } catch {
      // 무시
    }
    router.push('/designer');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900 dark:text-gray-100">
            ← {isEn ? 'Home' : '홈'}
          </Link>
          <button onClick={() => setIsEn(!isEn)} className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            {isEn ? '한국어' : 'EN'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-8 px-4 pb-10">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-10 text-center shadow-lg">
          <div className="text-5xl mb-6">🌫️</div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            {isEn ? 'Sign in to Dust Collector Designer' : '집진설비 설계 도구 로그인'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            {isEn ? 'Sign in to save designs to cloud and access Pro features.' : '설계를 클라우드에 저장하고 Pro 기능을 사용하려면 로그인하세요.'}
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={busy || !configured}
            className="w-full py-3 bg-white text-gray-800 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition flex items-center justify-center gap-3 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {busy ? (isEn ? 'Signing in…' : '로그인 중…') : (isEn ? 'Continue with Google' : 'Google 계정으로 계속')}
          </button>

          {!configured && (
            <p className="text-xs text-amber-700 dark:text-amber-500 mb-4">
              {isEn ? '⚠ Firebase not configured. Use demo mode below.' : '⚠ Firebase 미설정. 아래 데모 모드를 사용하세요.'}
            </p>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800" /></div>
            <div className="relative flex justify-center text-xs"><span className="px-2 bg-white dark:bg-gray-900 text-gray-400">{isEn ? 'OR with email' : '또는 이메일로'}</span></div>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-2 text-left">
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={isEn ? 'Email' : '이메일'} disabled={busy || !configured}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
            <input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEn ? 'Password (6+ chars)' : '비밀번호 (6자 이상)'} disabled={busy || !configured}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
            <button type="submit" disabled={busy || !configured} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {busy ? (isEn ? 'Please wait…' : '처리 중…') : mode === 'signup' ? (isEn ? 'Create account' : '회원가입') : (isEn ? 'Sign in' : '로그인')}
            </button>
          </form>
          <div className="flex justify-between items-center mt-2 text-xs">
            <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setInfo(null); }} className="text-blue-600 dark:text-blue-400 hover:underline">
              {mode === 'signin' ? (isEn ? 'Create an account' : '계정 만들기') : (isEn ? 'Have an account? Sign in' : '이미 계정이 있어요 · 로그인')}
            </button>
            <button type="button" onClick={handleForgotPassword} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
              {isEn ? 'Forgot password?' : '비밀번호 찾기'}
            </button>
          </div>

          {info && <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs text-emerald-700 dark:text-emerald-400">✓ {info}</div>}
          {error && <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-400">⚠ {error}</div>}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800" /></div>
            <div className="relative flex justify-center text-xs"><span className="px-2 bg-white dark:bg-gray-900 text-gray-400">{isEn ? 'OR' : '또는'}</span></div>
          </div>

          <button onClick={handleDemoLogin} disabled={busy} className="w-full py-3 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-semibold rounded-xl hover:bg-amber-200 dark:hover:bg-amber-950/60 transition disabled:opacity-50">
            🎮 {isEn ? 'Try Demo Mode (no signup)' : '데모로 체험하기 (가입 불필요)'}
          </button>
          <p className="text-[11px] text-gray-400 mt-2">
            {isEn ? 'Demo mode: no cloud save. Designs stay only in your browser.' : '데모 모드: 클라우드 저장 안 됨. 설계는 브라우저 내에만 유지됩니다.'}
          </p>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-400">
            <Link href="/pricing" className="text-blue-600 dark:text-blue-400 hover:underline">{isEn ? 'See pricing' : '요금제 보기'}</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
