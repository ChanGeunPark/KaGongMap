import type { Metadata } from "next";
import Link from "next/link";
import KGIcon from "@/components/ui/KGIcon";

export const metadata: Metadata = {
  title: "이용약관",
  description:
    "카공맵 서비스 이용 조건, 사용자 콘텐츠 정책, 신고 및 운영 기준을 안내합니다.",
  alternates: {
    canonical: "/terms",
  },
};

const effectiveDate = "2026년 5월 14일";

const sections = [
  {
    title: "1. 목적",
    body: [
      "본 약관은 카공맵이 제공하는 카페 지도, 카페 제보, 후기, 사진 제보, 즐겨찾기, 신고 등 서비스의 이용 조건과 운영 기준을 정합니다.",
      "이용자는 본 약관에 동의한 경우 카공맵 서비스를 이용할 수 있습니다.",
    ],
  },
  {
    title: "2. 서비스의 내용",
    body: [
      "카공맵은 카공족을 위한 카페 위치, 콘센트, 와이파이, 소음 수준, 운영시간, 후기 등 정보를 제공합니다.",
      "이용자는 카페 제보, 사진 제보, 후기 작성, 좋아요, 즐겨찾기, 신고 등 커뮤니티 기능을 이용할 수 있습니다.",
      "서비스 기능과 제공 범위는 운영 상황, 기술적 필요, 정책 변경에 따라 추가, 변경 또는 중단될 수 있습니다.",
    ],
  },
  {
    title: "3. 회원가입 및 로그인",
    body: [
      "카공맵은 Kakao, Google 등 외부 소셜 로그인 제공자를 통해 회원 로그인 기능을 제공할 수 있습니다.",
      "비회원도 지도 탐색, 카페 상세 열람, 일부 제보 및 후기 기능을 이용할 수 있으나, 즐겨찾기와 마이페이지 등 일부 기능은 로그인이 필요합니다.",
      "이용자는 본인의 계정을 안전하게 관리해야 하며, 계정 사용으로 발생하는 활동에 대한 책임을 부담합니다.",
    ],
  },
  {
    title: "4. 사용자 콘텐츠",
    body: [
      "이용자가 작성하거나 업로드한 카페 제보, 사진, 후기, 신고 내용 등은 사용자 콘텐츠에 해당합니다.",
      "이용자는 본인이 작성한 콘텐츠가 사실에 부합하고 타인의 권리, 명예, 개인정보, 저작권을 침해하지 않도록 주의해야 합니다.",
      "이용자가 공개 영역에 등록한 콘텐츠는 서비스 운영, 카페 정보 제공, 신고 검토, 품질 개선을 위해 필요한 범위에서 노출되거나 활용될 수 있습니다.",
    ],
  },
  {
    title: "5. 금지행위",
    body: [
      "허위 정보, 광고, 스팸, 반복 게시, 악의적 신고 또는 서비스 운영을 방해하는 행위",
      "욕설, 혐오, 차별, 음란물, 폭력적 표현, 타인에게 불쾌감을 주는 콘텐츠 게시",
      "타인의 개인정보, 초상, 저작물, 상표 등 권리를 침해하는 행위",
      "카페, 이용자, 운영자 또는 제3자를 사칭하거나 허위로 제보하는 행위",
      "서비스의 취약점을 악용하거나 비정상적인 방식으로 데이터에 접근하는 행위",
    ],
  },
  {
    title: "6. 신고 및 콘텐츠 관리",
    body: [
      "이용자는 부적절한 후기, 사진, 카페 정보, 폐업 또는 중복 등록 등 문제가 있는 콘텐츠를 신고할 수 있습니다.",
      "카공맵은 신고된 콘텐츠를 검토하여 필요하다고 판단되는 경우 숨김, 수정, 삭제, 반려, 계정 제한 등 조치를 할 수 있습니다.",
      "명백히 부적절하거나 서비스 운영을 방해하는 콘텐츠는 사전 통지 없이 제한될 수 있습니다.",
      "신고 처리 결과는 운영 정책과 개인정보 보호 필요성에 따라 개별적으로 안내되지 않을 수 있습니다.",
    ],
  },
  {
    title: "7. 정보의 정확성",
    body: [
      "카공맵의 카페 정보는 이용자 제보, 공개 정보, 운영자 검토 등을 바탕으로 제공되며, 실시간 정확성을 보장하지 않습니다.",
      "운영시간, 콘센트, 와이파이, 혼잡도, 가격, 폐업 여부 등은 실제 현장 상황과 다를 수 있습니다.",
      "이용자는 방문 전 카페 공식 채널, 지도 서비스, 전화 등으로 최신 정보를 확인하는 것이 좋습니다.",
    ],
  },
  {
    title: "8. 위치 및 지도 서비스",
    body: [
      "카공맵은 지도 표시, 길찾기, 주소 검색 등을 위해 외부 지도 또는 장소 검색 서비스를 연동할 수 있습니다.",
      "외부 지도 서비스의 정확성, 장애, 정책 변경, 링크 이동 결과에 대해서는 해당 제공자의 정책이 적용될 수 있습니다.",
    ],
  },
  {
    title: "9. 서비스 이용 제한",
    body: [
      "이용자가 본 약관 또는 관련 법령을 위반한 경우 카공맵은 콘텐츠 삭제, 기능 제한, 계정 이용 제한 등 필요한 조치를 할 수 있습니다.",
      "서비스 보안, 장애 대응, 점검, 운영상 필요가 있는 경우 일부 또는 전체 서비스 이용이 일시적으로 제한될 수 있습니다.",
    ],
  },
  {
    title: "10. 지식재산권",
    body: [
      "카공맵의 이름, 로고, 화면 구성, 코드, 데이터베이스 구조 등 서비스 자체에 관한 권리는 카공맵 또는 정당한 권리자에게 있습니다.",
      "이용자는 서비스 화면, 데이터, 콘텐츠를 카공맵의 사전 허락 없이 무단 복제, 수집, 배포, 상업적으로 이용해서는 안 됩니다.",
    ],
  },
  {
    title: "11. 면책",
    body: [
      "카공맵은 이용자 간 또는 이용자와 카페 등 제3자 사이에서 발생한 분쟁에 직접적인 책임을 부담하지 않습니다.",
      "천재지변, 외부 서비스 장애, 네트워크 오류, 이용자의 귀책 사유 등 카공맵의 합리적 통제를 벗어난 사유로 발생한 손해에 대해 책임을 제한할 수 있습니다.",
      "무료로 제공되는 서비스와 정보는 관련 법령이 허용하는 범위에서 있는 그대로 제공됩니다.",
    ],
  },
  {
    title: "12. 약관의 변경",
    body: [
      "카공맵은 법령, 서비스 기능, 운영 정책 변경에 따라 본 약관을 변경할 수 있습니다.",
      "중요한 변경이 있는 경우 서비스 화면 또는 공지사항을 통해 안내합니다.",
      "변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단하거나 계정 삭제를 요청할 수 있습니다.",
    ],
  },
  {
    title: "13. 문의",
    body: [
      "서비스 이용, 신고, 콘텐츠 삭제, 계정 관련 문의는 서비스 내 안내되는 문의 채널을 통해 접수할 수 있습니다.",
      "정식 출시 전까지 문의 채널이 변경될 수 있으며, 확정되는 즉시 본 약관에 반영합니다.",
    ],
  },
];

export default function TermsPage() {
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
            Terms
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
              이용약관
            </h1>
            <p className="mt-3 text-[13px] leading-6 text-fg-3">
              카공맵을 이용할 때의 기본 규칙과 커뮤니티 운영 기준을 안내합니다.
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
              Community Rules
            </div>
            <h2 className="mt-5 text-[26px] font-semibold leading-tight tracking-[-0.5px] sm:text-[34px]">
              카공맵은 이용자 제보로 함께 만드는 지도입니다.
            </h2>
            <p className="mt-4 max-w-[680px] text-sm leading-7 text-fg-3 sm:text-btn">
              정확하고 안전한 카페 정보를 위해 허위 제보, 부적절한 콘텐츠,
              악의적 신고를 제한하며, 신고된 내용은 운영자가 검토할 수 있습니다.
            </p>
          </section>

          <div className="mb-7 grid gap-3 sm:grid-cols-3">
            {["UGC 운영 기준", "신고 및 삭제 정책", "정보 정확성 안내"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-md border border-border-subtle bg-bg-muted px-4 py-3"
                >
                  <span className="text-sm font-semibold text-fg">{item}</span>
                </div>
              ),
            )}
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
            본 문서는 카공맵 MVP 운영을 위한 기본 이용약관입니다. 정식 출시,
            문의 채널 확정, 유료 기능 또는 광고 도입 시 실제 운영 내용에 맞게
            업데이트해야 합니다.
          </p>
        </div>
      </div>
    </main>
  );
}
