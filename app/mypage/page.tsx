"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useUserStore } from "@/stores/userStore";
import { useUpdateNickname } from "@/lib/api/user";
import { bookmarkKeys, fetchMyBookmarkedCafes } from "@/lib/api/bookmarks";
import { cafeKeys, fetchMyRegisteredCafes } from "@/lib/api/cafes";
import { useMySubmissionsSummary } from "@/lib/api/submissions";
import { cls } from "@/lib/utils";
import KGIcon from "@/components/ui/KGIcon";
import CafeCard from "@/components/cafe/card/CafeCard";
import PwaInstallBanner from "@/components/pwa/PwaInstallBanner";

type MyPageTab = "bookmarks" | "cafes" | "reviews";

const TABS: { id: MyPageTab; label: string }[] = [
  { id: "bookmarks", label: "즐겨찾기" },
  { id: "cafes", label: "내가 등록" },
  { id: "reviews", label: "내 후기" },
];

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const dbUser = useUserStore((s) => s.dbUser);
  const { mutate: updateNickname, isPending } = useUpdateNickname();
  const { data: bookmarkedCafes = [], isLoading: bookmarksLoading } = useQuery({
    queryKey: bookmarkKeys.cafes(),
    queryFn: fetchMyBookmarkedCafes,
    enabled: status === "authenticated",
  });
  const { data: submissionsSummary } = useMySubmissionsSummary(
    status === "authenticated",
  );
  const myCafeSubmissionCount = submissionsSummary
    ? submissionsSummary.cafes_registered +
      submissionsSummary.cafe_submissions.pending
    : 0;

  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [activeTab, setActiveTab] = useState<MyPageTab>("bookmarks");
  const isAuthenticated = status === "authenticated";

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <KGIcon name="loader" size={28} stroke={1.5} />
      </div>
    );
  }

  const submit = () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      toast.error("닉네임은 2~20자여야 합니다.");
      return;
    }
    if (trimmed === dbUser?.nickname) {
      setEditing(false);
      return;
    }
    updateNickname(trimmed, {
      onSuccess: () => {
        toast.success("닉네임이 변경되었습니다.");
        setEditing(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-[640px] px-5 py-6">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.5px] text-kg-amber-deep">
              Account
            </p>
            <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.4px] text-fg">
              설정
            </h1>
          </div>
        </div>

        <section className="rounded-2xl border border-border-subtle bg-bg p-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-main-light text-main-deep">
              <KGIcon
                name={isAuthenticated ? "check" : "users"}
                size={22}
                stroke={2}
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-[17px] font-semibold tracking-[-0.2px] text-fg">
                계정
              </h2>
              <p className="mt-1 text-[13px] leading-5 text-fg-3">
                {isAuthenticated
                  ? `${dbUser?.nickname ?? session?.user?.name ?? "사용자"}님으로 로그인되어 있어요.`
                  : "로그인 후 닉네임, 즐겨찾기, 활동 내역을 관리할 수 있어요."}
              </p>
            </div>
          </div>
        </section>

        <section>
          <PwaInstallBanner />
        </section>

        <section className="mt-4 rounded-2xl border border-border-subtle bg-bg p-5 shadow-card">
          {isAuthenticated ? (
            <AccountSection
              dbNickname={dbUser?.nickname ?? ""}
              editing={editing}
              nickname={nickname}
              setEditing={setEditing}
              setNickname={setNickname}
              submit={submit}
              isPending={isPending}
            />
          ) : (
            <LoginSection />
          )}
        </section>

        <SettingsSection />

        {isAuthenticated && (
          <section className="mt-6">
            <div className="mb-3 px-1">
              <h2 className="text-[17px] font-semibold tracking-[-0.2px] text-fg">
                내 활동
              </h2>
              <p className="mt-1 text-[13px] text-fg-3">
                저장한 카페와 내가 남긴 기록을 확인해요.
              </p>
            </div>

            <div className="flex rounded-full bg-gray-100 p-1">
              {TABS.map((tab) => {
                const count =
                  tab.id === "bookmarks"
                    ? bookmarkedCafes.length
                    : tab.id === "cafes"
                      ? myCafeSubmissionCount
                      : 0;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cls(
                      "flex-1 rounded-full px-3 py-2 text-[13px] font-semibold transition-colors",
                      activeTab === tab.id
                        ? "bg-bg text-fg shadow-button"
                        : "text-fg-3 hover:text-fg-2",
                    )}
                  >
                    {tab.label}
                    <span className="ml-1 text-[11px] opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              {activeTab === "bookmarks" && (
                <BookmarkTab
                  isLoading={bookmarksLoading}
                  onSelectCafe={() => router.push("/")}
                />
              )}
              {activeTab === "cafes" && (
                <MyCafesTab onSelectCafe={() => router.push("/")} />
              )}
              {activeTab === "reviews" && (
                <EmptyPanel
                  icon="list"
                  title="내 후기 목록은 아직 준비 중이에요."
                  description="후기 삭제와 함께 묶어서 확장하면 좋습니다."
                />
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function LoginSection() {
  return (
    <div>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.5px] text-main-deep">
        Sign in
      </p>
      <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.3px] text-fg">
        로그인
      </h2>
      <p className="mt-2 text-[13px] leading-6 text-fg-3">
        카공맵 계정으로 즐겨찾기, 후기 작성, 카페 제보 활동을 이어서 관리할 수
        있어요.
      </p>

      <button
        type="button"
        onClick={() => signIn("kakao", { callbackUrl: "/mypage" })}
        className="mt-5 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-main px-5 text-[14px] font-bold text-gray-900 transition-colors hover:bg-main-deep"
      >
        카카오로 로그인
      </button>

      <p className="mt-4 text-[12px] leading-5 text-fg-4">
        로그인하면 카공맵의{" "}
        <Link href="/privacy" className="font-semibold text-fg-2 underline">
          개인정보 처리방침
        </Link>
        에 동의한 것으로 간주됩니다.
      </p>
    </div>
  );
}

function AccountSection({
  dbNickname,
  editing,
  nickname,
  setEditing,
  setNickname,
  submit,
  isPending,
}: {
  dbNickname: string;
  editing: boolean;
  nickname: string;
  setEditing: (editing: boolean) => void;
  setNickname: (nickname: string) => void;
  submit: () => void;
  isPending: boolean;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.5px] text-main-deep">
            Profile
          </p>
          <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.3px] text-fg">
            프로필
          </h2>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full bg-gray-100 px-4 py-2 text-[12.5px] font-semibold text-fg-2 transition-colors hover:bg-gray-200"
        >
          로그아웃
        </button>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-[13px] font-semibold text-fg-2">닉네임</div>
        {editing ? (
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="min-w-0 flex-1 rounded-xl border border-border-medium bg-bg px-4 py-3 text-[14px]"
              autoFocus
            />
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="rounded-full bg-fg px-4 py-2 text-[12.5px] font-semibold text-bg disabled:opacity-50"
            >
              {isPending ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={() => {
                setNickname(dbNickname);
                setEditing(false);
              }}
              className="rounded-full bg-gray-100 px-4 py-2 text-[12.5px] font-semibold text-fg-2"
            >
              취소
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-muted px-4 py-3">
            <span className="min-w-0 truncate text-[15px] font-semibold text-fg">
              {dbNickname || "닉네임 없음"}
            </span>
            <button
              type="button"
              onClick={() => {
                setNickname(dbNickname);
                setEditing(true);
              }}
              className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-semibold text-fg-2 hover:bg-gray-200"
            >
              변경
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsSection() {
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
          href="/privacy"
          icon="info"
          title="개인정보 처리방침"
          description="카공맵이 개인정보를 다루는 방식을 확인해요."
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
        <span className="block text-[14px] font-semibold text-fg">{title}</span>
        <span className="mt-0.5 block truncate text-[12.5px] text-fg-3">
          {description}
        </span>
      </span>
      <KGIcon name="chev" size={18} stroke={2.2} />
    </Link>
  );
}

function BookmarkTab({
  isLoading,
  onSelectCafe,
}: {
  isLoading: boolean;
  onSelectCafe: (id: string) => void;
}) {
  const { data: cafes = [] } = useQuery({
    queryKey: bookmarkKeys.cafes(),
    queryFn: fetchMyBookmarkedCafes,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-bg p-6">
        <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
        <div className="mt-4 h-20 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (cafes.length === 0) {
    return (
      <EmptyPanel
        icon="bookmark"
        title="아직 즐겨찾기한 카페가 없어요."
        description="상세 모달에서 북마크 버튼을 누르면 여기에 모입니다."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {cafes.map((cafe) => (
        <CafeCard
          key={cafe.id}
          cafe={cafe}
          onClick={() => onSelectCafe(cafe.id)}
        />
      ))}
    </div>
  );
}

function MyCafesTab({
  onSelectCafe,
}: {
  onSelectCafe: (id: string) => void;
}) {
  const { data: cafes = [], isLoading } = useQuery({
    queryKey: cafeKeys.mine(),
    queryFn: fetchMyRegisteredCafes,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-bg p-6">
        <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
        <div className="mt-4 h-20 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (cafes.length === 0) {
    return (
      <EmptyPanel
        icon="pin"
        title="아직 등록된 카페가 없어요."
        description="제보가 어드민 승인을 통과하면 여기에 모입니다."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {cafes.map((cafe) => (
        <CafeCard
          key={cafe.id}
          cafe={cafe}
          onClick={() => onSelectCafe(cafe.id)}
        />
      ))}
    </div>
  );
}

function EmptyPanel({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg p-8 text-center shadow-card">
      <div className="mx-auto mb-3 flex size-8 items-center justify-center rounded-lg bg-gray-100 text-fg-3">
        <KGIcon name={icon} size={18} stroke={2} />
      </div>
      <p className="text-[15px] font-semibold text-fg">{title}</p>
      <p className="mt-1 text-[13px] leading-5 text-fg-3">{description}</p>
    </div>
  );
}
