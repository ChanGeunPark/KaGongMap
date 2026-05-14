import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { ContactInquiryCategory } from "@/types/db";

const VALID_CATEGORIES: ContactInquiryCategory[] = [
  "service",
  "report",
  "account",
  "privacy",
  "other",
];

const EMAIL_MAX = 254;
const CONTENT_MIN = 10;
const CONTENT_MAX = 2000;

interface ContactBody {
  category?: string;
  email?: string;
  content?: string;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// POST /api/contact — 사용자 문의 접수
export async function POST(req: NextRequest) {
  let body: ContactBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const category = body.category as ContactInquiryCategory | undefined;
  const email = body.email?.trim();
  const content = body.content?.trim();

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { message: "문의 유형을 선택해주세요." },
      { status: 400 },
    );
  }
  if (!email || email.length > EMAIL_MAX || !isValidEmail(email)) {
    return NextResponse.json(
      { message: "답변 받을 이메일을 올바르게 입력해주세요." },
      { status: 400 },
    );
  }
  if (!content || content.length < CONTENT_MIN || content.length > CONTENT_MAX) {
    return NextResponse.json(
      { message: `문의 내용은 ${CONTENT_MIN}~${CONTENT_MAX}자여야 합니다.` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  let userId: string | null = null;

  const session = await getServerSession(authOptions);
  const oauthId = (session?.user as { id?: string } | undefined)?.id;
  if (oauthId) {
    const { data: dbUser } = await supabase
      .from("users")
      .select("id")
      .eq("user_id", oauthId)
      .maybeSingle();
    userId = (dbUser?.id as string | undefined) ?? null;
  }

  const { error } = await supabase.from("contact_inquiries").insert({
    user_id: userId,
    category,
    email,
    content,
  });

  if (error) {
    console.error("[POST /api/contact] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
