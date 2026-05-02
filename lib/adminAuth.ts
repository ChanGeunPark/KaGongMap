import "server-only";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

type SessionUserWithId = {
  id?: string;
};

function getConfiguredAdminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isAdminUserId(userId: string): boolean {
  return getConfiguredAdminUserIds().includes(userId);
}

export async function getAdminSessionStatus(): Promise<{
  userId: string | null;
  isAdmin: boolean;
}> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as SessionUserWithId | undefined)?.id ?? null;

  return {
    userId,
    isAdmin: userId !== null && isAdminUserId(userId),
  };
}

export async function requireAdminApiAccess(): Promise<NextResponse | null> {
  const { userId, isAdmin } = await getAdminSessionStatus();

  if (!userId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ message: "관리자 권한이 없습니다." }, { status: 403 });
  }

  return null;
}
