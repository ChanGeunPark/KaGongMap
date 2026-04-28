import { NextRequest, NextResponse } from "next/server";

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_IMAGES_API_TOKEN;
const CF_IMAGES_ENDPOINT = CF_ACCOUNT_ID
  ? `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`
  : null;

function ensureEnv() {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !CF_IMAGES_ENDPOINT) {
    return NextResponse.json(
      {
        message:
          "CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_IMAGES_API_TOKEN 환경변수가 설정되지 않았습니다.",
      },
      { status: 500 },
    );
  }
  return null;
}

export async function GET(req: NextRequest) {
  const envError = ensureEnv();
  if (envError) return envError;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "id가 필요합니다." }, { status: 400 });
  }

  const res = await fetch(`${CF_IMAGES_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    console.error("[GET /api/cloudflare/image] cloudflare error:", json);
    return NextResponse.json(
      { message: "Cloudflare 이미지 조회 실패", detail: json },
      { status: res.status || 500 },
    );
  }

  const result = json.result;
  return NextResponse.json({
    id: result.id,
    filename: result.filename,
    uploaded: result.uploaded,
    variants: result.variants ?? [],
    url: result.variants?.[0] ?? null,
  });
}

export async function POST(req: NextRequest) {
  const envError = ensureEnv();
  if (envError) return envError;

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { message: "multipart/form-data 형식으로 요청해주세요." },
      { status: 400 },
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const metadata = formData.get("metadata");

  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { message: "file 필드가 필요합니다." },
      { status: 400 },
    );
  }

  const originalName = (file as File).name ?? "";
  const dot = originalName.lastIndexOf(".");
  const ext = dot >= 0 ? originalName.slice(dot + 1).toLowerCase() : "";
  const uniqueName = ext
    ? `${crypto.randomUUID()}.${ext}`
    : crypto.randomUUID();

  const cfForm = new FormData();
  cfForm.append("file", file, uniqueName);
  if (typeof metadata === "string") {
    cfForm.append("metadata", metadata);
  }

  const res = await fetch(CF_IMAGES_ENDPOINT!, {
    method: "POST",
    headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
    body: cfForm,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    console.error("[POST /api/cloudflare/image] cloudflare error:", json);
    return NextResponse.json(
      { message: "Cloudflare 업로드 실패", detail: json },
      { status: res.status || 500 },
    );
  }

  const result = json.result;
  return NextResponse.json({
    id: result.id,
    filename: result.filename,
    uploaded: result.uploaded,
    variants: result.variants ?? [],
    url: result.variants?.[0] ?? null,
  });
}

export async function DELETE(req: NextRequest) {
  const envError = ensureEnv();
  if (envError) return envError;

  const id =
    req.nextUrl.searchParams.get("id") ??
    (await req
      .json()
      .then((b: { id?: string }) => b?.id)
      .catch(() => undefined));

  if (!id) {
    return NextResponse.json({ message: "id가 필요합니다." }, { status: 400 });
  }

  const res = await fetch(`${CF_IMAGES_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    console.error("[DELETE /api/cloudflare/image] cloudflare error:", json);
    return NextResponse.json(
      { message: "Cloudflare 삭제 실패", detail: json },
      { status: res.status || 500 },
    );
  }

  return NextResponse.json({ ok: true, id });
}
