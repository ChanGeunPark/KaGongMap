import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/stores/userStore";
import { DbUser } from "@/types/db";

// ── Query Keys ──────────────────────────────────────────────────────────────
export const userKeys = {
  all: ["users"] as const,
  detail: (userId: string) => [...userKeys.all, "detail", userId] as const,
};

export async function fetchUser(userId: string) {
  const res = await fetch(`/api/users?userId=${encodeURIComponent(userId)}`);

  if (!res.ok) {
    const json = (await res.json()) as { message?: string };
    throw new Error(json.message ?? "유저 조회 중 오류가 발생했습니다.");
  }

  const json = (await res.json()) as { user: DbUser | null };
  return json.user;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

// 닉네임은 서버에서 랜덤 생성. 신규 유저면 INSERT, 있으면 avatar_url만 갱신.
export async function createUser(
  userId: string,
  avatar_url: string | null,
) {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, avatar_url }),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = "유저 생성 중 오류가 발생했습니다.";
    try {
      const json = JSON.parse(text) as { message?: string };
      if (json.message) message = json.message;
    } catch {
      // non-JSON error body
    }
    throw new Error(message);
  }

  return null;
}

export async function updateNickname(nickname: string): Promise<DbUser> {
  const res = await fetch("/api/users/me/nickname", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}) as { message?: string });
    throw new Error(json.message ?? "닉네임 변경 중 오류가 발생했습니다.");
  }
  const json = (await res.json()) as { user: DbUser };
  return json.user;
}

export async function deleteUser(userId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("users").delete().eq("user_id", userId);

  if (error) throw new Error(error.message);
  return null;
}

// ── React Query Hooks ───────────────────────────────────────────────────────

interface CreateUserPayload {
  userId: string;
  avatar_url: string | null;
}

export function useUser(userId: string | null) {
  return useQuery({
    queryKey: userKeys.detail(userId ?? ""),
    queryFn: () => fetchUser(userId!),
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, avatar_url }: CreateUserPayload) =>
      createUser(userId, avatar_url),
    retry: 0,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.userId),
      });
    },
  });
}

export function useUpdateNickname() {
  const queryClient = useQueryClient();
  const setDbUser = useUserStore((s) => s.setDbUser);

  return useMutation({
    mutationFn: (nickname: string) => updateNickname(nickname),
    onSuccess: (user) => {
      setDbUser(user);
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
    },
  });
}
