'use client';

/**
 * 개인정보처리방침 — 집진설비 설계 도구 (메카 마인드)
 * 자체 한/영 토글
 */

import { useState } from 'react';
import Link from 'next/link';

const ARTICLE_CLS =
  'space-y-3 text-sm text-gray-700 dark:text-gray-300 ' +
  '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 dark:[&_h1]:text-gray-100 [&_h1]:mb-4 ' +
  '[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-gray-900 dark:[&_h2]:text-gray-100 ' +
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1 ' +
  '[&_p]:leading-relaxed [&_strong]:font-semibold ' +
  '[&_code]:bg-gray-100 dark:[&_code]:bg-gray-800 [&_code]:px-1 [&_code]:rounded';

export default function PrivacyPage() {
  const [isEn, setIsEn] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900 dark:text-gray-100">← {isEn ? 'Home' : '홈'}</Link>
          <button onClick={() => setIsEn(!isEn)} className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">{isEn ? '한국어' : 'EN'}</button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <article className={ARTICLE_CLS}>{isEn ? <PrivacyEn /> : <PrivacyKo />}</article>
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500">
          <p>{isEn ? 'Effective date: June 5, 2026' : '시행일: 2026년 6월 5일'}</p>
          <p className="mt-2"><Link href="/terms" className="text-blue-600 hover:underline">{isEn ? 'Terms of Service →' : '이용약관 →'}</Link></p>
        </div>
      </main>
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 text-xs text-gray-400">© 2026 Dust Collector Designer · 메카 마인드</div>
      </footer>
    </div>
  );
}

function PrivacyKo() {
  return (
    <>
      <h1>개인정보처리방침</h1>
      <p>메카 마인드(이하 &quot;회사&quot;)는 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 보호하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.</p>
      <h2>제1조 (수집 항목)</h2>
      <ul>
        <li><strong>회원가입·로그인:</strong> 이메일, 비밀번호(암호화 저장), (Google 로그인 시) 이름·프로필 사진</li>
        <li><strong>서비스 이용:</strong> 설계 입력값·결과, 사용 이력, 접속 로그·IP·기기/브라우저 정보</li>
        <li><strong>유료 결제:</strong> 카드 등 민감 결제정보는 결제대행사(PG)가 처리하며 회사는 결제 식별번호·승인내역·요금제 정보만 보관합니다.</li>
      </ul>
      <h2>제2조 (이용 목적)</h2>
      <ul>
        <li>회원 식별 및 계정 관리, 설계 결과 클라우드 저장 및 등급별 기능 제공</li>
        <li>결제·정산·환불 처리, 고객 문의 응대, 서비스 개선·부정이용 방지(비식별 통계)</li>
      </ul>
      <h2>제3조 (보유 기간)</h2>
      <ol>
        <li>회원 탈퇴 시 지체 없이 파기함을 원칙으로 합니다.</li>
        <li>단, 법령에 따라 계약·청약철회 기록 5년, 대금결제 기록 5년, 소비자 분쟁 기록 3년, 접속 기록 3개월을 보관합니다.</li>
      </ol>
      <h2>제4조 (처리위탁 / 제3자)</h2>
      <ul>
        <li>Google LLC(Firebase/Google Cloud): 인증·데이터베이스·호스팅</li>
        <li>토스페이먼츠 / PayPal: 결제 처리</li>
        <li>Crisp: 고객 문의 / Sentry: 오류 모니터링 / Anthropic: (프리미엄) AI 상담</li>
      </ul>
      <h2>제5조 (국외 이전)</h2>
      <p>클라우드 인프라(Google Cloud, 리전: 대만 asia-east1) 및 해외 결제·AI 서비스 이용을 위해 개인정보가 국외(미국·대만 등)에 저장·처리될 수 있습니다. 이용자는 회원가입·결제 시 이에 동의함으로써 서비스를 이용합니다.</p>
      <h2>제6조 (이용자의 권리)</h2>
      <p>이용자는 언제든지 개인정보 열람·정정·삭제·처리정지를 요청할 수 있으며, 계정 설정 또는 아래 연락처로 요청할 수 있습니다.</p>
      <h2>제7조 (해외 이용자 권리 — GDPR / CCPA)</h2>
      <p><strong>EU/EEA 이용자:</strong> GDPR에 따라 열람·정정·삭제·처리제한·이동·반대·동의철회 권리를 가지며, 거주지 감독기구에 민원을 제기할 수 있습니다.</p>
      <p><strong>미국 캘리포니아 이용자:</strong> CCPA/CPRA에 따라 알 권리·삭제·판매거부 권리를 가집니다. <strong>회사는 개인정보를 판매하지 않습니다.</strong></p>
      <h2>제8조 (안전성 확보)</h2>
      <ul>
        <li>인증정보 암호화 저장·전송(HTTPS), 접근권한 최소화·통제, 접속기록 보관</li>
      </ul>
      <h2>제9조 (개인정보 보호책임자)</h2>
      <ul>
        <li>보호책임자: 김형민 (대표)</li>
        <li>이메일: <code>dustcollector@mechamindlab.com</code></li>
      </ul>
      <h2>제10조 (사업자 정보)</h2>
      <ul>
        <li>상호: 메카 마인드 · 대표: 김형민 · 사업자등록번호: 455-45-01423</li>
        <li>사업장: 경기도 고양시 덕양구 충경로 138 (행신동)</li>
      </ul>
      <h2>부칙</h2>
      <p>본 방침은 2026년 6월 5일부터 시행합니다.</p>
    </>
  );
}

function PrivacyEn() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>Mecha Mind (&quot;Company&quot;) complies with applicable privacy laws and establishes this Privacy Policy to protect users&apos; personal information.</p>
      <h2>1. Information Collected</h2>
      <ul>
        <li><strong>Sign-up/Login:</strong> email, password (encrypted), and (for Google) name and profile photo</li>
        <li><strong>Service Use:</strong> design inputs/results, usage history, access logs, IP, device/browser info</li>
        <li><strong>Payments:</strong> card data is handled by the payment gateway; the Company stores only payment IDs, approvals, and plan info.</li>
      </ul>
      <h2>2. Purpose</h2>
      <ul>
        <li>Member identification, account management, cloud storage, tier-based features</li>
        <li>Payment/refund processing, support, service improvement and fraud prevention (de-identified)</li>
      </ul>
      <h2>3. Retention</h2>
      <ol>
        <li>Data is destroyed without delay upon account deletion.</li>
        <li>Per law: contract/withdrawal records 5 years, payment records 5 years, complaint records 3 years, access logs 3 months.</li>
      </ol>
      <h2>4. Processing Consignment / Third Parties</h2>
      <ul>
        <li>Google LLC (Firebase/Google Cloud): authentication, database, hosting</li>
        <li>Toss Payments / PayPal: payment · Crisp: support · Sentry: monitoring · Anthropic: (Premium) AI</li>
      </ul>
      <h2>5. Overseas Transfer</h2>
      <p>Personal data may be stored/processed overseas (e.g., USA, Taiwan) via Google Cloud (region: Taiwan asia-east1) and international payment/AI services. By signing up or paying, users consent to such transfer.</p>
      <h2>6. User Rights</h2>
      <p>Users may request access, correction, deletion, or suspension of processing at any time.</p>
      <h2>7. International Users (GDPR / CCPA)</h2>
      <p><strong>EU/EEA users:</strong> Under the GDPR, you have rights of access, rectification, erasure, restriction, portability, objection, and withdrawal of consent, and may lodge a complaint with a supervisory authority.</p>
      <p><strong>California (USA) users:</strong> Under the CCPA/CPRA, you have the right to know, delete, and opt out of sale. <strong>We do not sell your personal information.</strong></p>
      <h2>8. Security</h2>
      <ul>
        <li>Encryption of credentials, HTTPS, minimized access control, access log retention</li>
      </ul>
      <h2>9. Privacy Officer</h2>
      <ul>
        <li>Officer: Kim Hyeongmin (Representative)</li>
        <li>Email: <code>dustcollector@mechamindlab.com</code></li>
      </ul>
      <h2>10. Business Information</h2>
      <ul>
        <li>Company: Mecha Mind · CEO: Kim Hyeongmin · Business Reg. No.: 455-45-01423</li>
        <li>Address: 138 Chunggyeong-ro, Deogyang-gu, Goyang-si, Gyeonggi-do, Republic of Korea</li>
      </ul>
      <h2>Supplementary Provisions</h2>
      <p>This policy is effective from June 5, 2026.</p>
    </>
  );
}
