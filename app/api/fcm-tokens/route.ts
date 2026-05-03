import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

async function resolveUserPk(oauthId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", oauthId)
    .maybeSingle();

  if (error) {
    console.error("[fcm-tokens] resolveUserPk error", error);
    return null;
  }

  return (data?.id as string | undefined) ?? null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;
  if (!oauthId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const userPk = await resolveUserPk(oauthId);
  if (!userPk) {
    return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as
    | { token?: string; userAgent?: string }
    | null;
  const token = body?.token?.trim();
  if (!token) {
    return NextResponse.json({ message: "token이 필요합니다." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("fcm_tokens").upsert(
    {
      user_id: userPk,
      token,
      user_agent: body?.userAgent ?? null,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  );

  if (error) {
    console.error("[POST /api/fcm-tokens] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;
  if (!oauthId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const userPk = await resolveUserPk(oauthId);
  if (!userPk) return NextResponse.json({ ok: true });

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ message: "token이 필요합니다." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("fcm_tokens")
    .delete()
    .eq("user_id", userPk)
    .eq("token", token);

  if (error) {
    console.error("[DELETE /api/fcm-tokens] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
