import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

// 마이페이지 활동 카운트.
// - 승인된 카페 등록: cafes.user_id (UUID, users.id) 기준
// - 대기/반려 제보: cafe_submissions / cafe_image_submissions / cafe_edit_submissions
//   각 테이블의 user_id (TEXT, NextAuth OAuth ID = users.user_id) 기준
export async function GET() {
  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;
  if (!oauthId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const supabase = createAdminClient();

  // OAuth ID(TEXT) → users.id(UUID) lookup. cafes.user_id는 UUID FK.
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", oauthId)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ message: userError.message }, { status: 500 });
  }
  const userUuid = userRow?.id ?? null;

  type StatusCount = { pending: number; rejected: number };
  type Summary = {
    cafes_registered: number;
    cafe_submissions: StatusCount;
    cafe_image_submissions: StatusCount;
    cafe_edit_submissions: StatusCount;
  };

  const summary: Summary = {
    cafes_registered: 0,
    cafe_submissions: { pending: 0, rejected: 0 },
    cafe_image_submissions: { pending: 0, rejected: 0 },
    cafe_edit_submissions: { pending: 0, rejected: 0 },
  };

  const submissionTables = [
    "cafe_submissions",
    "cafe_image_submissions",
    "cafe_edit_submissions",
  ] as const;
  const statuses = ["pending", "rejected"] as const;

  const tasks: Promise<void>[] = [];

  if (userUuid) {
    tasks.push(
      (async () => {
        const { count, error } = await supabase
          .from("cafes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userUuid);
        if (error) throw new Error(`cafes: ${error.message}`);
        summary.cafes_registered = count ?? 0;
      })(),
    );
  }

  for (const table of submissionTables) {
    for (const status of statuses) {
      tasks.push(
        (async () => {
          const { count, error } = await supabase
            .from(table)
            .select("id", { count: "exact", head: true })
            .eq("user_id", oauthId)
            .eq("status", status);
          if (error) throw new Error(`${table}.${status}: ${error.message}`);
          summary[table][status] = count ?? 0;
        })(),
      );
    }
  }

  try {
    await Promise.all(tasks);
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "집계 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ summary });
}
