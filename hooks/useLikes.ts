"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyLikedCafeIds,
  likeCafe,
  likeKeys,
  unlikeCafe,
} from "@/lib/api/likes";
import { cafeKeys } from "@/lib/api/cafes";
import type { CafeMarker, CafeWithDetail } from "@/types/db";
import {
  readLikedCafeIds,
  writeLikedCafeIds,
} from "@/hooks/storage/likedStorage";

interface UseLikesReturn {
  isLiked: (cafeId: string) => boolean;
  toggle: (cafeId: string) => void;
  count: number;
  isAuthed: boolean;
  isPending: boolean;
}

// 비로그인 상태에서는 localStorage를 source-of-truth로 사용한다.
// 로그인 후에는 서버의 cafe_likes만 사용하고, 익명 좋아요는 머지하지 않는다.
export function useLikes(): UseLikesReturn {
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const queryClient = useQueryClient();

  const [localLikes, setLocalLikes] = useState<string[]>(() => []);

  // 마운트 시 localStorage hydrate (SSR 안전)
  useEffect(() => {
    setTimeout(() => {
      setLocalLikes(readLikedCafeIds());
    }, 0);
  }, []);

  const { data: serverLikes = [] } = useQuery({
    queryKey: likeKeys.me(),
    queryFn: fetchMyLikedCafeIds,
    enabled: isAuthed,
    staleTime: 1000 * 60,
  });

  const liked = isAuthed ? serverLikes : localLikes;
  const likedSet = useMemo(() => new Set(liked), [liked]);

  // markers + detail 캐시의 like_count만 부분 패치 (전체 refetch 회피)
  const patchLikeCount = useCallback(
    (cafeId: string, delta: number) => {
      queryClient.setQueryData<CafeMarker[]>(cafeKeys.markers(), (prev) => {
        if (!prev) return prev;
        return prev.map((m) =>
          m.id === cafeId ? { ...m, like_count: m.like_count + delta } : m,
        );
      });
      queryClient.setQueryData<CafeWithDetail>(
        cafeKeys.detail(cafeId),
        (prev) => {
          if (!prev) return prev;
          return { ...prev, like_count: prev.like_count + delta };
        },
      );
    },
    [queryClient],
  );

  const serverToggle = useMutation({
    mutationFn: async ({
      cafeId,
      wasLiked,
    }: {
      cafeId: string;
      wasLiked: boolean;
    }) => {
      if (wasLiked) await unlikeCafe(cafeId);
      else await likeCafe(cafeId);
      return { cafeId, wasLiked };
    },
    onMutate: async ({ cafeId, wasLiked }) => {
      await queryClient.cancelQueries({ queryKey: likeKeys.me() });
      const prev = queryClient.getQueryData<string[]>(likeKeys.me()) ?? [];
      const next = wasLiked
        ? prev.filter((id) => id !== cafeId)
        : [...prev, cafeId];
      queryClient.setQueryData(likeKeys.me(), next);
      patchLikeCount(cafeId, wasLiked ? -1 : 1);
      return { prev };
    },
    onError: (_err, { cafeId, wasLiked }, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(likeKeys.me(), ctx.prev);
      patchLikeCount(cafeId, wasLiked ? 1 : -1);
    },
  });

  const anonToggle = useMutation({
    mutationFn: async ({
      cafeId,
      wasLiked,
    }: {
      cafeId: string;
      wasLiked: boolean;
    }) => {
      if (wasLiked) await unlikeCafe(cafeId);
      else await likeCafe(cafeId);
      return { cafeId, wasLiked };
    },
    onMutate: ({ cafeId, wasLiked }) => {
      patchLikeCount(cafeId, wasLiked ? -1 : 1);
    },
    onError: (_err, { cafeId, wasLiked }) => {
      patchLikeCount(cafeId, wasLiked ? 1 : -1);
    },
  });

  const toggle = useCallback(
    (cafeId: string) => {
      const wasLiked = likedSet.has(cafeId);
      if (isAuthed) {
        serverToggle.mutate({ cafeId, wasLiked });
        return;
      }
      const next = wasLiked
        ? localLikes.filter((id) => id !== cafeId)
        : [...localLikes, cafeId];
      writeLikedCafeIds(next);
      setLocalLikes(next);
      anonToggle.mutate({ cafeId, wasLiked });
    },
    [isAuthed, likedSet, localLikes, serverToggle, anonToggle],
  );

  return {
    isLiked: useCallback((id: string) => likedSet.has(id), [likedSet]),
    toggle,
    count: liked.length,
    isAuthed,
    isPending: serverToggle.isPending || anonToggle.isPending,
  };
}
