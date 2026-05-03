import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface AdminStatusResponse {
  isAdmin: boolean;
}

export async function fetchAdminStatus(): Promise<AdminStatusResponse> {
  const res = await fetch("/api/admin/me", { cache: "no-store" });

  if (!res.ok) {
    return { isAdmin: false };
  }

  return (await res.json()) as AdminStatusResponse;
}

export function useAdminStatus() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["admin", "me"],
    queryFn: fetchAdminStatus,
    enabled: Boolean(session),
    staleTime: 60_000,
  });
}
