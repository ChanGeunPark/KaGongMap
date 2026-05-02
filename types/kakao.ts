export interface KakaoKeywordSearchResponse {
  documents: KakaoPlaceDocument[];
  meta: KakaoSearchMeta;
}

export interface KakaoPlaceDocument {
  id: string;
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string; // lng
  y: string; // lat
  place_url: string;
  distance: string;
}

export interface KakaoSearchMeta {
  total_count: number;
  pageable_count: number;
  is_end: boolean;
}

export interface PlaceSearchResult {
  id: string;
  name: string;
  address: string;
  roadAddress: string;
  lat: number;
  lng: number;
  phone?: string;
  url?: string;
}
