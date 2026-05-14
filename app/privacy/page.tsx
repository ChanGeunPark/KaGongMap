import type { Metadata } from "next";
import Link from "next/link";
import KGIcon from "@/components/ui/KGIcon";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description:
    "카공맵이 수집하고 이용하는 개인정보 항목, 보유 기간, 외부 서비스 이용 및 이용자 권리를 안내합니다.",
  alternates: {
    canonical: "/privacy",
  },
};

const effectiveDate = "2026년 5월 1일";

const sections = [
  {
    title: "1. 수집하는 개인정보 항목",
    body: [
      "카공맵은 서비스 제공에 필요한 최소한의 개인정보를 수집합니다.",
      "소셜 로그인 시: 제공자 식별자, 이름 또는 닉네임, 이메일, 프로필 이미지 등 OAuth 제공자가 전달하는 기본 계정 정보",
      "서비스 이용 시: 닉네임, 즐겨찾기, 좋아요, 후기, 카페 제보, 사진 제보, 신고 내역 등 이용자가 직접 입력하거나 생성한 정보",
      "자동 생성 정보: 접속 로그, 기기 및 브라우저 정보, IP 주소, 서비스 이용 기록",
    ],
  },
  {
    title: "2. 개인정보의 이용 목적",
    body: [
      "회원 식별, 로그인 상태 유지, 계정 관리",
      "카페 제보, 사진 제보, 후기, 좋아요, 즐겨찾기 등 커뮤니티 기능 제공",
      "부정 이용 방지, 신고 처리, 서비스 안정성 확보",
      "서비스 개선을 위한 오류 확인 및 이용 현황 분석",
    ],
  },
  {
    title: "3. 보유 및 이용 기간",
    body: [
      "회원 정보는 회원 탈퇴 또는 개인정보 삭제 요청 시 지체 없이 파기합니다.",
      "회원 탈퇴 시 즐겨찾기, 로그인 기반 좋아요, 푸시 토큰 등 계정에 직접 연결된 개인 데이터는 삭제됩니다.",
      "카페 제보, 사진 제보, 정보 수정 제안 등 서비스 운영 기록은 개인 식별자를 제거하거나 익명화한 뒤 보관될 수 있습니다.",
      "이용자가 작성한 후기, 카페 제보, 사진 제보 등 공개 콘텐츠는 서비스 운영과 커뮤니티 기록 유지를 위해 별도 삭제 요청 전까지 보관될 수 있습니다.",
      "법령에 따라 보관이 필요한 정보는 해당 법령에서 정한 기간 동안 보관합니다.",
    ],
  },
  {
    title: "4. 제3자 제공",
    body: [
      "카공맵은 이용자의 개인정보를 사전 동의 없이 외부에 판매하거나 제공하지 않습니다.",
      "다만 법령에 따른 요청이 있거나 이용자가 직접 동의한 경우에는 필요한 범위에서 제공될 수 있습니다.",
    ],
  },
  {
    title: "5. 개인정보 처리위탁 및 외부 서비스",
    body: [
      "카공맵은 안정적인 서비스 제공을 위해 다음 외부 서비스를 이용할 수 있습니다.",
      "Supabase: 데이터베이스, 인증, 사용자 정보 및 서비스 데이터 저장",
      "Vercel: 웹 애플리케이션 배포 및 호스팅",
      "Cloudflare Images: 사용자가 제보한 이미지 저장 및 전송",
      "Kakao, Google: 소셜 로그인 인증",
      "Naver Maps, Kakao Local API: 지도 표시 및 장소 검색 기능 제공",
    ],
  },
  {
    title: "6. 광고 및 맞춤형 광고",
    body: [
      "현재 카공맵은 광고를 게재하지 않으며, 맞춤형 광고를 목적으로 개인정보를 수집하거나 이용하지 않습니다.",
      "향후 광고 또는 광고성 추적 기능을 도입하는 경우, 관련 내용을 본 처리방침에 반영하고 필요한 동의를 받겠습니다.",
    ],
  },
  {
    title: "7. 쿠키 및 유사 기술",
    body: [
      "카공맵은 로그인 상태 유지, 서비스 보안, 기본 기능 제공을 위해 쿠키 또는 유사 기술을 사용할 수 있습니다.",
      "광고 목적의 추적 쿠키는 현재 사용하지 않습니다.",
    ],
  },
  {
    title: "8. 이용자의 권리",
    body: [
      "이용자는 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다.",
      "회원은 마이페이지에서 직접 회원 탈퇴를 요청할 수 있습니다.",
      "서비스 내 계정 관리 기능 또는 운영자 문의를 통해 요청할 수 있으며, 카공맵은 본인 확인 후 필요한 조치를 진행합니다.",
    ],
  },
  {
    title: "9. 개인정보의 안전성 확보 조치",
    body: [
      "카공맵은 개인정보 접근 권한을 필요한 범위로 제한하고, 인증 정보와 주요 비밀키를 환경변수로 분리하여 관리합니다.",
      "데이터베이스에는 Row Level Security 등 접근 통제 정책을 적용하는 것을 원칙으로 합니다.",
    ],
  },
  {
    title: "10. 개인정보 보호 문의",
    body: [
      "개인정보 관련 문의, 삭제 요청, 권리 행사 요청은 앱의 문의하기 페이지를 통해 접수할 수 있습니다.",
      "문의 채널이 변경되는 경우 본 처리방침에 반영합니다.",
    ],
  },
  {
    title: "11. 처리방침 변경",
    body: [
      "본 개인정보 처리방침은 법령, 서비스 기능, 외부 서비스 이용 현황에 따라 변경될 수 있습니다.",
      "중요한 변경이 있는 경우 서비스 화면 또는 공지사항을 통해 안내합니다.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border-subtle bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1040px] items-center justify-between px-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-fg transition-opacity hover:opacity-80"
          >
            <KGIcon name="chev" size={14} />
            카공맵
          </Link>
          <span className="rounded-full border border-border-medium bg-bg-muted px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.5px] text-fg-3">
            Privacy
          </span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1040px] gap-7 px-5 py-8 lg:grid-cols-[260px_1fr] lg:py-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border-subtle bg-bg p-5 shadow-card">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.5px] text-kg-amber-deep">
              Kagongmap Policy
            </div>
            <h1 className="mt-2 text-[25px] font-bold leading-tight tracking-[-0.4px] text-fg">
              개인정보 처리방침
            </h1>
            <p className="mt-3 text-[13px] leading-6 text-fg-3">
              카공맵이 어떤 정보를 어떤 목적으로 다루는지 투명하게 안내합니다.
            </p>
            <div className="mt-5 rounded-lg bg-kg-amber-light px-4 py-3">
              <div className="text-[11px] font-semibold text-kg-amber-deep">
                시행일
              </div>
              <div className="mt-0.5 text-sm font-semibold text-fg">
                {effectiveDate}
              </div>
            </div>
          </div>
        </aside>

        <div>
          <section className="mb-5 rounded-2xl border border-border-subtle bg-white p-6 text-fg shadow-card sm:p-7">
            <div className="inline-flex rounded-full bg-kg-amber px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.5px] text-fg">
              No Ads
            </div>
            <h2 className="mt-5 text-[26px] font-semibold leading-tight tracking-[-0.5px] sm:text-[34px]">
              광고 목적의 개인정보 처리는 아직 하지 않습니다.
            </h2>
            <p className="mt-4 max-w-[680px] text-sm leading-7 text-fg-3 sm:text-btn">
              현재 카공맵은 로그인, 카페 제보, 후기, 좋아요, 즐겨찾기 등 서비스
              기능 제공에 필요한 정보만 사용합니다. 광고나 맞춤형 광고 추적을
              시작하게 되면 처리방침을 먼저 업데이트하겠습니다.
            </p>
          </section>

          <div className="mb-7 grid gap-3 sm:grid-cols-3">
            {["최소 수집", "광고 추적 없음", "삭제 요청 가능"].map((item) => (
              <div
                key={item}
                className="rounded-md border border-border-subtle bg-bg-muted px-4 py-3"
              >
                <span className="text-sm font-semibold text-fg">{item}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {sections.map((section) => (
              <section
                key={section.title}
                className="rounded-2xl border border-border-subtle bg-bg p-5 shadow-card sm:p-6"
              >
                <h2 className="text-[17px] font-semibold tracking-[-0.2px] text-fg">
                  {section.title}
                </h2>
                <ul className="mt-4 space-y-2.5 text-sm leading-7 text-fg-2">
                  {section.body.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-kg-amber" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-6 rounded-md border border-kg-amber/25 bg-kg-amber-light px-4 py-3 text-xs leading-6 text-kg-amber-deep">
            본 문서는 카공맵 MVP 운영을 위한 기본 개인정보 처리방침입니다. 정식
            출시, 문의 채널 확정, 광고 또는 통계 도구 도입 시 실제 운영 내용에
            맞게 업데이트해야 합니다.
          </p>
        </div>
      </div>
    </main>
  );
}
