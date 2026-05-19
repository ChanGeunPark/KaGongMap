"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCreateUser, useUser } from "@/lib/api/user";
import { useUserStore } from "@/stores/userStore";

// 로그인 시 DB users 레코드를 보장한다.
// - 세션 → useUser로 조회 → 없으면 createUser 1회 실행 → 전역 store 동기화.
// - 로그아웃 시 store clear.
export function useBootstrapDbUser() {
  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const profileImage = session?.user?.image ?? null;

  const {
    data: dbUser,
    isLoading: isUserLoading,
    isSuccess: isUserFetchSuccess,
    isError: isUserFetchError,
  } = useUser(userId);
  const { mutate: createUser } = useCreateUser();
  const setDbUser = useUserStore((s) => s.setDbUser);
  const clearUser = useUserStore((s) => s.clearUser);

  const createUserRef = useRef(createUser);
  const createAttemptedForUserId = useRef<string | null>(null);
  const prevUserIdForBootstrap = useRef<string | null>(null);

  useEffect(() => {
    createUserRef.current = createUser;
  }, [createUser]);

  useEffect(() => {
    if (prevUserIdForBootstrap.current === userId) return;
    createAttemptedForUserId.current = null;
    prevUserIdForBootstrap.current = userId;
  }, [userId]);

  useEffect(() => {
    if (status !== "authenticated" || !userId) {
      clearUser();
    }
  }, [status, userId, clearUser]);

  useEffect(() => {
    setDbUser(dbUser ?? null);
  }, [dbUser, setDbUser]);

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;
    if (isUserLoading || !isUserFetchSuccess) return;
    if (isUserFetchError) return;
    if (dbUser !== null) return;

    if (createAttemptedForUserId.current === userId) return;
    createAttemptedForUserId.current = userId;

    createUserRef.current({
      userId,
      avatar_url: profileImage,
    });
  }, [
    status,
    userId,
    dbUser,
    isUserLoading,
    isUserFetchSuccess,
    isUserFetchError,
    profileImage,
  ]);
}
