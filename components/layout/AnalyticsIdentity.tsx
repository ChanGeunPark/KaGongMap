"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { setAnalyticsUser } from "@/lib/firebase/analytics";

export default function AnalyticsIdentity() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      const user = session?.user as
        | { id?: string; provider?: string }
        | undefined;
      setAnalyticsUser(user?.id ?? null, {
        auth_provider: user?.provider ?? "authenticated",
      });
    } else {
      setAnalyticsUser(null, { auth_provider: "guest" });
    }
  }, [session, status]);

  return null;
}
