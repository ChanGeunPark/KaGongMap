"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyLikedCafeIds,
  likeCafe,
  likeKeys,
  syncLocalLikes,
  unlikeCafe,
} from "@/lib/api/likes";
import { cafeKeys } from "@/lib/api/cafes";
import {
  clearLikedCafeIds,
  readLikedCafeIds,
  writeLikedCafeIds,
} from "@/hooks/storage/likedStorage";

interface UseLikesReturn {
  isLiked: (cafeId: string) => boolean;
  toggle: (cafeId: string) => void;
  count: number;
  isAuthed: boolean;
}

// 로그인 시 localStorage(익명 좋아요) → DB로 합집합 머지 후 localStorage 비움.
// 비로그인 상태에서는 localStorage를 source-of-truth로 사용.
export function useLikes(): UseLikesReturn {
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const queryClient = useQueryClient();

  const [localLikes, setLocalLikes] = useState<string[]>(() => []);
  const mergedForSession = useRef(false);

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

  // 로그인되면 localStorage 머지 → 비우기
  useEffect(() => {
    if (!isAuthed) {
      mergedForSession.current = false;
      return;
    }
    if (mergedForSession.current) return;

    const local = readLikedCafeIds();
    if (local.length === 0) {
      mergedForSession.current = true;
      return;
    }

    mergedForSession.current = true;
    syncLocalLikes(local)
      .then((merged) => {
        clearLikedCafeIds();
        setLocalLikes([]);
        queryClient.setQueryData(likeKeys.me(), merged);
        queryClient.invalidateQueries({ queryKey: cafeKeys.markers() });
      })
      .catch(() => {
        mergedForSession.current = false;
      });
  }, [isAuthed, queryClient]);

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
