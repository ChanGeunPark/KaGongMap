import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToAdmins } from "@/lib/firebase/sendPush";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (
    !body ||
    typeof body.name !== "string" ||
    typeof body.address !== "string" ||
    typeof body.lat !== "number" ||
    typeof body.lng !== "number" ||
    !Array.isArray(body.images) ||
    !Array.isArray(body.tags)
  ) {
    return NextResponse.json(
      { message: "필수 항목(name, address, lat, lng, images, tags)을 확인해주세요." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("cafe_submissions")
    .insert({
      user_id: typeof body.user_id === "string" ? body.user_id : null,
      name: body.name,
      address: body.address,
      lat: body.lat,
      lng: body.lng,
      hours: typeof body.hours === "string" ? body.hours : null,
      min_order_amount:
        typeof body.min_order_amount === "number" ? body.min_order_amount : null,
      images: body.images,
      description:
        typeof body.description === "string" ? body.description : null,
      tags: body.tags,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[POST /api/cafes/submissions] error", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  after(async () => {
    try {
      await sendPushToAdmins({
        title: "새 카페 제보",
        body: `${body.name} 카페 제보가 들어왔어요.`,
        link: "/admin",
      });
    } catch (err) {
      console.error("[cafe-submissions] push 실패", err);
    }
  });

  return NextResponse.json({ id: data.id });
}
