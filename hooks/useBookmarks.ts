"use client";

import { useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  addBookmark,
  bookmarkKeys,
  fetchMyBookmarkedCafeIds,
  removeBookmark,
} from "@/lib/api/bookmarks";
import { useAuthGateStore } from "@/stores/modalStore";

interface UseBookmarksReturn {
  isBookmarked: (cafeId: string) => boolean;
  toggle: (cafeId: string) => void;
  count: number;
  isAuthed: boolean;
  isPending: boolean;
}

export function useBookmarks(): UseBookmarksReturn {
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const queryClient = useQueryClient();
  const openAuthGate = useAuthGateStore((s) => s.openAuthGate);

  const { data: bookmarkIds = [] } = useQuery({
    queryKey: bookmarkKeys.me(),
    queryFn: fetchMyBookmarkedCafeIds,
    enabled: isAuthed,
    staleTime: 1000 * 60,
  });

  const bookmarkedSet = useMemo(() => new Set(bookmarkIds), [bookmarkIds]);

  const toggleMutation = useMutation({
    mutationFn: async ({
      cafeId,
      wasBookmarked,
    }: {
      cafeId: string;
      wasBookmarked: boolean;
    }) => {
      if (wasBookmarked) await removeBookmark(cafeId);
      else await addBookmark(cafeId);
      return { cafeId, wasBookmarked };
    },
    onMutate: async ({ cafeId, wasBookmarked }) => {
      await queryClient.cancelQueries({ queryKey: bookmarkKeys.me() });
      await queryClient.cancelQueries({ queryKey: bookmarkKeys.cafes() });

      const prev = queryClient.getQueryData<string[]>(bookmarkKeys.me()) ?? [];
      const next = wasBookmarked
        ? prev.filter((id) => id !== cafeId)
        : [...prev, cafeId];
      queryClient.setQueryData(bookmarkKeys.me(), next);

      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(bookmarkKeys.me(), ctx.prev);
      toast.error(
        err instanceof Error
          ? err.message
          : "즐겨찾기 처리 중 오류가 발생했습니다.",
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.me() });
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.cafes() });
    },
  });

  const toggle = useCallback(
    (cafeId: string) => {
      if (!isAuthed) {
        openAuthGate("즐겨찾기는 로그인 후 사용할 수 있어요.");
        return;
      }

      toggleMutation.mutate({
        cafeId,
        wasBookmarked: bookmarkedSet.has(cafeId),
      });
    },
    [bookmarkedSet, isAuthed, openAuthGate, toggleMutation],
  );

  return {
    isBookmarked: useCallback(
      (id: string) => bookmarkedSet.has(id),
      [bookmarkedSet],
    ),
    toggle,
    count: bookmarkIds.length,
    isAuthed,
    isPending: toggleMutation.isPending,
  };
}
