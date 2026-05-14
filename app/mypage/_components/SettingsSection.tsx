import Link from "next/link";
import KGIcon from "@/components/ui/KGIcon";

export default function SettingsSection() {
  return (
    <section className="mt-4 rounded-2xl border border-border-subtle bg-bg p-5 shadow-card">
      <h2 className="text-[17px] font-semibold tracking-[-0.2px] text-fg">
        웹 설정
      </h2>
      <p className="mt-1 text-[13px] leading-6 text-fg-3">
        서비스 정보와 정책을 확인할 수 있어요.
      </p>

      <div className="mt-5 divide-y divide-border-subtle">
        <SettingsLink
          href="/terms"
          icon="info"
          title="이용약관"
          description="카공맵 이용 규칙과 커뮤니티 운영 기준을 확인해요."
        />
        <SettingsLink
          href="/privacy"
          icon="info"
          title="개인정보 처리방침"
          description="카공맵이 개인정보를 다루는 방식을 확인해요."
        />
        <SettingsLink
          href="/contact"
          icon="info"
          title="문의하기"
          description="서비스 이용, 신고, 개인정보 관련 문의를 남겨요."
        />
        <SettingsLink
          href="/"
          icon="mapIcon"
          title="지도 홈"
          description="카공하기 좋은 카페를 다시 둘러봐요."
        />
      </div>
    </section>
  );
}

function SettingsLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 py-4 transition-opacity hover:opacity-75"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-fg-3">
        <KGIcon name={icon} size={20} stroke={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-caption font-semibold text-fg">{title}</span>
        <span className="mt-0.5 block truncate text-[12.5px] text-fg-3">
          {description}
        </span>
      </span>
      <KGIcon name="chev" size={18} stroke={2.2} />
    </Link>
  );
}
