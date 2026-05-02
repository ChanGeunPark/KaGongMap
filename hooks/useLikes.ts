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
import {
  readLikedCafeIds,
  writeLikedCafeIds,
} from "@/hooks/storage/likedStorage";

interface UseLikesReturn {
  isLiked: (cafeId: string) => boolean;
  toggle: (cafeId: string) => void;
  count: number;
  isAuthed: boolean;
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
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(likeKeys.me(), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: likeKeys.me() });
      queryClient.invalidateQueries({ queryKey: cafeKeys.markers() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cafeKeys.markers() });
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
  };
}
