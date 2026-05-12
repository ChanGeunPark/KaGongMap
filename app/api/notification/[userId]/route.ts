import { sendPushToUsers } from "@/lib/firebase/sendPush";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  const result = await sendPushToUsers([userId], {
    title: "테스트 알림",
    body: "테스트 알림 내용",
  });

  return NextResponse.json(result);
}
