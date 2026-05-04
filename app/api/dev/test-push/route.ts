import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/firebase/sendPush";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;
  if (!oauthId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", oauthId)
    .maybeSingle();

  if (userErr || !userRow) {
    return NextResponse.json(
      { message: "사용자를 찾을 수 없습니다.", error: userErr?.message },
      { status: 404 },
    );
  }

  const userPk = userRow.id as string;

  const { data: tokenRows } = await supabase
    .from("fcm_tokens")
    .select("token, user_agent, last_used_at")
    .eq("user_id", userPk);

  const tokenCount = tokenRows?.length ?? 0;

  const body = (await req.json().catch(() => null)) as
    | { title?: string; bodyText?: string; link?: string }
    | null;

  try {
    const result = await sendPushToUser(userPk, {
      title: body?.title ?? "카공맵 테스트 푸시",
      body: body?.bodyText ?? "이 메시지가 보이면 발송 경로는 정상입니다.",
      link: body?.link ?? "/mypage",
    });

    return NextResponse.json({
      ok: true,
      userPk,
      tokenCount,
      tokens: tokenRows,
      result,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        userPk,
        tokenCount,
        tokens: tokenRows,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
