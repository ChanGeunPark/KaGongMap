declare namespace naver {
  namespace maps {
    class Map {
      constructor(el: string | HTMLElement, options?: MapOptions);
      setCenter(latlng: LatLng): void;
      setZoom(zoom: number): void;
      getCenter(): LatLng;
      getZoom(): number;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      setIcon(icon: string | MarkerIcon): void;
      getPosition(): LatLng;
    }

    class Point {
      constructor(x: number, y: number);
    }

    namespace Event {
      function addListener(
        target: object,
        event: string,
        listener: (...args: unknown[]) => void,
      ): void;
    }

    interface MapOptions {
      center?: LatLng;
      zoom?: number;
      minZoom?: number;
      maxZoom?: number;
    }

    interface MarkerOptions {
      position: LatLng;
      map?: Map | null;
      icon?: string | MarkerIcon;
      title?: string;
    }

    interface MarkerIcon {
      content?: string;
      anchor?: Point;
    }
  }
}
