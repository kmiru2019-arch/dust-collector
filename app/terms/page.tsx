'use client';

/**
 * 이용약관 — 집진설비 설계 도구 (메카 마인드)
 * 자체 한/영 토글 (집진엔 전역 i18n 없음)
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

export default function TermsPage() {
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
        <article className={ARTICLE_CLS}>{isEn ? <TermsEn /> : <TermsKo />}</article>
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500">
          <p>{isEn ? 'Effective date: June 5, 2026' : '시행일: 2026년 6월 5일'}</p>
          <p className="mt-2"><Link href="/privacy" className="text-blue-600 hover:underline">{isEn ? 'Privacy Policy →' : '개인정보처리방침 →'}</Link></p>
        </div>
      </main>
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 text-xs text-gray-400">© 2026 Dust Collector Designer · 메카 마인드</div>
      </footer>
    </div>
  );
}

function TermsKo() {
  return (
    <>
      <h1>이용약관</h1>
      <h2>제1조 (목적)</h2>
      <p>본 약관은 메카 마인드(이하 &quot;회사&quot;)가 제공하는 집진설비 설계 지원 SaaS 서비스(이하 &quot;서비스&quot;)의 이용 조건 및 절차, 이용자(이하 &quot;회원&quot;)와 회사의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
      <h2>제2조 (서비스의 제공)</h2>
      <ol>
        <li>회사는 집진설비 설계 계산, 도면·문서 생성, PDF 보고서 등을 제공합니다.</li>
        <li>서비스는 연중무휴 24시간 제공함을 원칙으로 하며, 점검·장애·천재지변 등으로 일시 중단될 수 있습니다.</li>
        <li>서비스가 제공하는 모든 계산 결과 및 도면은 <strong>참고용</strong>이며, 실제 시공·발주 전 자격을 갖춘 엔지니어의 검증을 거쳐야 합니다.</li>
      </ol>
      <h2>제3조 (이용계약 체결)</h2>
      <ol>
        <li>이용계약은 회원이 본 약관에 동의하고 회원가입을 신청, 회사가 승낙함으로써 체결됩니다.</li>
        <li>회사는 Google 로그인 및 이메일/비밀번호 가입을 지원합니다.</li>
      </ol>
      <h2>제4조 (유료 서비스 및 결제)</h2>
      <ol>
        <li>유료 요금제(구독·토큰·연간권 등)의 종류와 가격은 서비스 화면에 게시합니다.</li>
        <li>결제 수단: 국내 회원은 토스페이먼츠, 해외 회원은 PayPal을 이용합니다.</li>
        <li>모든 가격은 부가가치세(VAT) 별도이며, 국가/지역 세법에 따라 세금이 추가될 수 있습니다.</li>
      </ol>
      <h2>제5조 (청약철회 및 환불)</h2>
      <p>「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 처리합니다. 디지털콘텐츠·용역은 제공이 개시되면 청약철회가 제한될 수 있으며, 이 경우 사전에 고지합니다. 월간 구독은 결제 후 7일 이내 미사용 시 전액 환불, 이후 잔여 일수 비례 환불합니다. 환불 문의: <code>dustcollector@mechamindlab.com</code></p>
      <h2>제6조 (회원의 의무)</h2>
      <ol>
        <li>회원은 다음 행위를 해서는 안 됩니다:
          <ul>
            <li>타인의 정보 도용 또는 허위 정보 등록</li>
            <li>서비스의 안정적 운영을 방해하는 행위(대량 자동 요청, 크롤링 등)</li>
            <li>회사의 지적재산권 및 타인의 권리 침해</li>
            <li>서비스의 역설계·소스코드 추출·복제를 시도하는 행위</li>
            <li>서비스 또는 그 출력물을 무단으로 재판매·재배포하는 행위</li>
            <li>악성코드 유포 등 서비스 또는 다른 이용자에게 피해를 주는 행위</li>
            <li>관계 법령에 위반되는 행위</li>
          </ul>
        </li>
      </ol>
      <h2>제7조 (회사의 의무 및 면책)</h2>
      <ol>
        <li>회사가 제공하는 계산 결과·도면·문서는 산업 표준에 기반하나, <strong>실제 시공·설계의 최종 책임은 자격을 갖춘 엔지니어 및 회원에게 있습니다.</strong></li>
        <li>회사는 천재지변·불가항력, 회원 귀책, 제3자 행위, 출력물을 검증 없이 시공에 적용하여 발생한 손해에 대해 책임지지 않습니다.</li>
        <li>회사의 손해배상 책임은 회원이 최근 12개월간 지불한 금액을 초과하지 않습니다.</li>
      </ol>
      <h2>제8조 (지적재산권)</h2>
      <ol>
        <li>서비스의 소프트웨어·계산 엔진·데이터베이스·도면 템플릿 등 지적재산권은 회사에 귀속됩니다.</li>
        <li>회원이 생성한 설계 결과물의 권리는 회원에게 귀속되며 자유롭게 사용할 수 있습니다.</li>
      </ol>
      <h2>제9조 (개인정보 보호)</h2>
      <p>회사는 「개인정보 보호법」 및 관계 법령에 따라 회원의 개인정보를 보호하며, 상세 내용은 별도의 <Link href="/privacy" className="text-blue-600">개인정보처리방침</Link>에 따릅니다.</p>
      <h2>제10조 (분쟁 해결)</h2>
      <ol>
        <li>본 약관에 명시되지 않은 사항은 관계 법령 및 상관례를 따릅니다.</li>
        <li>분쟁 발생 시 대한민국 법령을 준거법으로 하며, 회사 본점 소재지 관할 법원을 전속관할로 합니다.</li>
      </ol>
      <h2>사업자 정보</h2>
      <ul>
        <li>상호: 메카 마인드 · 대표: 김형민</li>
        <li>사업자등록번호: 455-45-01423</li>
        <li>사업장: 경기도 고양시 덕양구 충경로 138 (행신동)</li>
        <li>이메일: <code>dustcollector@mechamindlab.com</code></li>
      </ul>
      <h2>부칙</h2>
      <p>본 약관은 2026년 6월 5일부터 시행합니다.</p>
    </>
  );
}

function TermsEn() {
  return (
    <>
      <h1>Terms of Service</h1>
      <h2>1. Purpose</h2>
      <p>These Terms govern your use of the Dust Collector Designer SaaS service (&quot;Service&quot;) operated by Mecha Mind (&quot;Company&quot;).</p>
      <h2>2. Service</h2>
      <ol>
        <li>The Company provides dust collector design calculations, drawings/documents, and PDF reports.</li>
        <li>The Service is provided 24/7, subject to maintenance and force majeure.</li>
        <li><strong>All calculations and drawings are for reference only and must be verified by a qualified engineer before construction or procurement.</strong></li>
      </ol>
      <h2>3. Account</h2>
      <p>An account is created when you agree to these Terms and register via Google or email/password.</p>
      <h2>4. Pricing and Payment</h2>
      <ol>
        <li>Paid plans (subscription/tokens/annual) and prices are posted in the Service.</li>
        <li>Payment: Toss Payments (Korea), PayPal (international).</li>
        <li>All prices exclude VAT and applicable taxes.</li>
      </ol>
      <h2>5. Refund Policy</h2>
      <p>Handled per Korean consumer protection law. Digital content/services may be non-refundable once provision begins (disclosed in advance). Monthly subscriptions: full refund within 7 days if unused; pro-rated thereafter. Refunds: <code>dustcollector@mechamindlab.com</code></p>
      <h2>6. Member Obligations</h2>
      <ol>
        <li>Members may not:
          <ul>
            <li>Use false information or impersonate others</li>
            <li>Interfere with stable Service operation (mass automated requests, scraping)</li>
            <li>Infringe Company&apos;s IP or third-party rights</li>
            <li>Reverse engineer, decompile, or attempt to extract the source code of the Service</li>
            <li>Resell or redistribute the Service or its output without authorization</li>
            <li>Distribute malware or otherwise harm the Service or other users</li>
            <li>Violate applicable laws</li>
          </ul>
        </li>
      </ol>
      <h2>7. Disclaimer</h2>
      <ol>
        <li>Calculations and drawings are based on industry standards, but <strong>final responsibility for design and construction lies with qualified engineers and the Member.</strong></li>
        <li>The Company is not liable for force majeure, member fault, third-party acts, or damages from applying output to construction without verification.</li>
        <li>Company liability is limited to amounts paid by the Member in the past 12 months.</li>
      </ol>
      <h2>8. Intellectual Property</h2>
      <ol>
        <li>Service software, calculation engine, database, and templates belong to the Company.</li>
        <li>Design output generated by the Member belongs to the Member.</li>
      </ol>
      <h2>9. Privacy</h2>
      <p>See the <Link href="/privacy" className="text-blue-600">Privacy Policy</Link>.</p>
      <h2>10. Dispute Resolution</h2>
      <p>Korean law applies as governing law; disputes are subject to the court at the Company&apos;s principal office.</p>
      <h2>Business Information</h2>
      <ul>
        <li>Company: Mecha Mind · CEO: Kim Hyeongmin</li>
        <li>Business Reg. No.: 455-45-01423</li>
        <li>Address: 138 Chunggyeong-ro, Deogyang-gu, Goyang-si, Gyeonggi-do, Republic of Korea</li>
        <li>Email: <code>dustcollector@mechamindlab.com</code></li>
      </ul>
      <h2>Supplementary Provisions</h2>
      <p>These Terms are effective from June 5, 2026.</p>
    </>
  );
}
