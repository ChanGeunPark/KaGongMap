import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
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

export async function createUser(
  userId: string,
  nickname: string,
  avatar_url: string | null,
) {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, nickname, avatar_url }),
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

export async function updateUser(
  userId: string,
  nickname: string,
  avatar_url: string | null,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .update({ nickname, avatar_url })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function deleteUser(userId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("users").delete().eq("user_id", userId);

  if (error) throw new Error(error.message);
  return null;
}

// ── React Query Hooks ───────────────────────────────────────────────────────

interface UpsertUserPayload {
  userId: string;
  nickname: string;
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
    mutationFn: ({ userId, nickname, avatar_url }: UpsertUserPayload) =>
      createUser(userId, nickname, avatar_url),
    retry: 0,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.userId),
      });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, nickname, avatar_url }: UpsertUserPayload) =>
      updateUser(userId, nickname, avatar_url),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.userId),
      });
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
