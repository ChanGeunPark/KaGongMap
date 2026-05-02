import { NextResponse } from "next/server";
import { getAdminSessionStatus } from "@/lib/adminAuth";

export async function GET() {
  const { isAdmin } = await getAdminSessionStatus();

  return NextResponse.json(
    { isAdmin },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
