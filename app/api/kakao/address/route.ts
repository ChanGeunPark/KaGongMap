import { KakaoKeywordSearchResponse, PlaceSearchResult } from "@/types/kakao";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  if (!query) {
    return Response.json({ message: "query is required" }, { status: 400 });
  }
  const response = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
      },
    },
  );

  if (!response.ok) {
    return Response.json(
      {
        ok: false,
        message: "카카오 주소 검색에 실패했습니다.",
      },
      { status: response.status },
    );
  }

  const data = (await response.json()) as KakaoKeywordSearchResponse;

  const places: PlaceSearchResult[] = data.documents.map((place) => ({
    id: place.id,
    name: place.place_name,
    address: place.address_name,
    roadAddress: place.road_address_name,
    lat: Number(place.y),
    lng: Number(place.x),
    phone: place.phone || undefined,
    url: place.place_url || undefined,
  }));

  if (places.length === 0) {
    return Response.json({
      ok: false,
      data: [],
      message: "No places found",
    });
  }

  return Response.json({
    ok: true,
    data: places,
  });
}
