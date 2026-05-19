import { useEffect, useRef, useState } from "react";
import { CafeMarkerClusterer } from "@/components/map/CafeMarkerClusterer";
import { MapWithBounds } from "@/types/naverMap";

type Bounds = { ne: naver.maps.LatLng; sw: naver.maps.LatLng };

interface UseNaverMapOptions {
  containerId: string;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  onBoundsChange?: (bounds: Bounds) => void;
}

export function useNaverMap({
  containerId,
  defaultCenter = { lat: 37.5005, lng: 127.038 },
  defaultZoom = 15,
  onBoundsChange,
}: UseNaverMapOptions) {
  const mapRef = useRef<naver.maps.Map | null>(null);
  const clustererRef = useRef<CafeMarkerClusterer | null>(null);
  const initialized = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function initMap() {
      if (initialized.current) return;
      initialized.current = true;

      mapRef.current = new naver.maps.Map(containerId, {
        center: new naver.maps.LatLng(defaultCenter.lat, defaultCenter.lng),
        zoom: defaultZoom,
        minZoom: 10,
        maxZoom: 19,
        logoControl: true,
        logoControlOptions: { position: naver.maps.Position.BOTTOM_LEFT },
        mapDataControl: true,
        mapDataControlOptions: { position: naver.maps.Position.BOTTOM_LEFT },
        scaleControl: true,
        scaleControlOptions: { position: naver.maps.Position.BOTTOM_RIGHT },
      });

      naver.maps.Event.addListener(mapRef.current, "idle", () => {
        const b = (mapRef.current as MapWithBounds).getBounds();
        onBoundsChange?.({ ne: b.getNE(), sw: b.getSW() });
      });

      clustererRef.current = new CafeMarkerClusterer(mapRef.current);
      setReady(true);
    }

    let interval: ReturnType<typeof setInterval> | null = null;

    if (
      typeof window !== "undefined" &&
      (window as Window & { naver?: typeof naver }).naver?.maps
    ) {
      initMap();
    } else {
      interval = setInterval(() => {
        if ((window as Window & { naver?: typeof naver }).naver?.maps) {
          if (interval) clearInterval(interval);
          interval = null;
          initMap();
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
      clustererRef.current?.destroy();
      clustererRef.current = null;
      initialized.current = false;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mapRef, clustererRef, ready };
}
