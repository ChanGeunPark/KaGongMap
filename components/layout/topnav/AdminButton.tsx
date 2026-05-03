"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import KaGongButton from "@/components/button/KaGongButton";
import { useAdminStatus } from "@/lib/api/admin";

export default function AdminButton() {
  const { data: session } = useSession();
  const router = useRouter();
  const { data } = useAdminStatus();

  if (!session || !data?.isAdmin) {
    return null;
  }

  return (
    <KaGongButton
      buttonStyle="OUTLINED"
      buttonSize="MEDIUM"
      onClick={() => router.push("/admin")}
    >
      A
    </KaGongButton>
  );
}
