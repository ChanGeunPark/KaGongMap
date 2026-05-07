export type MapWithMorph = naver.maps.Map & {
  morph(
    latlng: naver.maps.Coord,
    zoom?: number,
    options?: { duration: number; easing?: string },
  ): void;
  getMaxZoom(): number;
};

export type MapWithBounds = naver.maps.Map & {
  getBounds(): naver.maps.LatLngBounds;
  getProjection(): naver.maps.MapSystemProjection;
};

export type EventWithRemove = typeof naver.maps.Event & {
  removeListener(listener: naver.maps.MapEventListener): void;
};

export type MarkerWithMutableMeta = naver.maps.Marker & {
  setPosition(position: naver.maps.Coord | naver.maps.CoordLiteral): void;
  setTitle(title: string): void;
  setZIndex(zIndex: number): void;
};
