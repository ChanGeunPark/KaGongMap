import { clusterIcon } from "./markerIcons";
import { EventWithRemove, MapWithBounds, MapWithMorph } from "@/types/naverMap";

const MAX_VISIBLE_CAFE_MARKERS = 30;
const MARKER_CLUSTER_MAX_ZOOM = 16;
const MARKER_CLUSTER_GRID_SIZE = 96;

type Cluster = {
  center: naver.maps.LatLng;
  bounds: naver.maps.LatLngBounds;
  markers: naver.maps.Marker[];
};

type ProjectedPoint = naver.maps.Point & {
  x: number;
  y: number;
};

export class CafeMarkerClusterer {
  private map: MapWithBounds;
  private markers: naver.maps.Marker[] = [];
  private clusterMarkers: naver.maps.Marker[] = [];
  private idleListener: naver.maps.MapEventListener | null = null;

  constructor(map: naver.maps.Map) {
    this.map = map as MapWithBounds;
    this.idleListener = naver.maps.Event.addListener(map, "idle", () => {
      this.redraw();
    });
  }

  setMarkers(markers: naver.maps.Marker[]) {
    this.markers = markers;
    this.redraw();
  }

  redraw() {
    this.clearClusterMarkers();

    const map = this.map;
    const bounds = map.getBounds();
    const visibleMarkers = this.markers.filter((marker) =>
      bounds.hasLatLng(marker.getPosition()),
    );
    const hiddenMarkers = this.markers.filter(
      (marker) => !bounds.hasLatLng(marker.getPosition()),
    );

    hiddenMarkers.forEach((marker) => marker.setMap(null));

    if (map.getZoom() >= MARKER_CLUSTER_MAX_ZOOM) {
      this.showLimitedMarkers(visibleMarkers);
      return;
    }

    const clusters = this.createClusters(visibleMarkers);
    let shownCafeMarkers = 0;

    clusters.forEach((cluster) => {
      if (cluster.markers.length < 2) {
        if (shownCafeMarkers < MAX_VISIBLE_CAFE_MARKERS) {
          cluster.markers[0]?.setMap(map);
          shownCafeMarkers += 1;
        } else {
          cluster.markers[0]?.setMap(null);
        }
        return;
      }

      cluster.markers.forEach((marker) => marker.setMap(null));
      this.addClusterMarker(cluster);
    });
  }

  destroy() {
    this.clearClusterMarkers();
    this.markers.forEach((marker) => marker.setMap(null));
    if (this.idleListener) {
      (naver.maps.Event as EventWithRemove).removeListener(this.idleListener);
      this.idleListener = null;
    }
  }

  private createClusters(markers: naver.maps.Marker[]) {
    const clusters: Cluster[] = [];

    markers.forEach((marker) => {
      const position = marker.getPosition() as naver.maps.LatLng;
      let closestIndex = -1;
      let closestDistance = Infinity;

      for (let index = 0; index < clusters.length; index += 1) {
        const cluster = clusters[index];
        if (!cluster) continue;
        if (!cluster.bounds.hasLatLng(position)) continue;

        const distance = this.map
          .getProjection()
          .getDistance(cluster.center, position);
        if (distance < closestDistance) {
          closestIndex = index;
          closestDistance = distance;
        }
      }

      if (closestIndex >= 0) {
        clusters[closestIndex]?.markers.push(marker);
        return;
      }

      clusters.push({
        center: position,
        bounds: this.createClusterBounds(position),
        markers: [marker],
      });
    });

    return clusters;
  }

  private createClusterBounds(position: naver.maps.LatLng) {
    const projection = this.map.getProjection();
    const point = projection.fromCoordToOffset(position) as ProjectedPoint;
    const halfGrid = MARKER_CLUSTER_GRID_SIZE / 2;
    const sw = projection.fromOffsetToCoord(
      new naver.maps.Point(point.x - halfGrid, point.y + halfGrid),
    ) as naver.maps.LatLng;
    const ne = projection.fromOffsetToCoord(
      new naver.maps.Point(point.x + halfGrid, point.y - halfGrid),
    ) as naver.maps.LatLng;

    return new naver.maps.LatLngBounds(sw, ne);
  }

  private addClusterMarker(cluster: Cluster) {
    const marker = new naver.maps.Marker({
      position: cluster.center,
      map: this.map,
      icon: clusterIcon(cluster.markers.length),
      title: `${cluster.markers.length}개 카페`,
    });

    naver.maps.Event.addListener(marker, "click", () => {
      const map = this.map as unknown as MapWithMorph;
      map.morph(cluster.center, Math.min(map.getZoom() + 1, map.getMaxZoom()), {
        duration: 250,
        easing: "easeOutCubic",
      });
    });

    this.clusterMarkers.push(marker);
  }

  private showLimitedMarkers(markers: naver.maps.Marker[]) {
    markers.forEach((marker, index) => {
      marker.setMap(index < MAX_VISIBLE_CAFE_MARKERS ? this.map : null);
    });
  }

  private clearClusterMarkers() {
    this.clusterMarkers.forEach((marker) => marker.setMap(null));
    this.clusterMarkers = [];
  }
}
