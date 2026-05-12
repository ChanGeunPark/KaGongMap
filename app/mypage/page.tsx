"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { bookmarkKeys, fetchMyBookmarkedCafes } from "@/lib/api/bookmarks";
import { useMySubmissionsSummary } from "@/lib/api/submissions";
import { cls } from "@/lib/utils";
import KGIcon from "@/components/ui/KGIcon";
import PwaInstallBanner from "@/components/pwa/PwaInstallBanner";
import PushNotificationToggle from "@/components/notifications/PushNotificationToggle";
import AccountSection from "./_components/AccountSection";
import LoginSection from "./_components/LoginSection";
import SettingsSection from "./_components/SettingsSection";
import BookmarkTab from "./_components/BookmarkTab";
import MyCafesTab from "./_components/MyCafesTab";
import EmptyPanel from "./_components/EmptyPanel";
import { isWebView } from "@/lib/native/isWebView";
import DevTestPushButton from "@/components/notifications/DevTestPushButton";

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
  const isAuthenticated = status === "authenticated";

  const { data: bookmarkedCafes = [], isLoading: bookmarksLoading } = useQuery({
    queryKey: bookmarkKeys.cafes(),
    queryFn: fetchMyBookmarkedCafes,
    enabled: isAuthenticated,
  });
  const { data: submissionsSummary } = useMySubmissionsSummary(isAuthenticated);
  const myCafeSubmissionCount = submissionsSummary
    ? submissionsSummary.cafes_registered +
      submissionsSummary.cafe_submissions.pending
    : 0;

  const [activeTab, setActiveTab] = useState<MyPageTab>("bookmarks");

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <KGIcon name="loader" size={28} stroke={1.5} />
      </div>
    );
  }

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

        {!isWebView() && (
          <section>
            <PwaInstallBanner />
          </section>
        )}

        <section className="mt-4 rounded-2xl border border-border-subtle bg-bg p-5 shadow-card">
          {isAuthenticated ? <AccountSection /> : <LoginSection />}
        </section>

        {isAuthenticated && <PushNotificationToggle />}

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
                  cafes={bookmarkedCafes}
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
