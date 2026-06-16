import { useEffect } from 'react';
import {
  AdvancedMarker,
  InfoWindow,
  Map,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import type { LatLng, PlaceResult, UserLocation } from '../types';
import { Icon } from './Icon';

interface MapViewProps {
  mapId: string;
  locationA: UserLocation | null;
  locationB: UserLocation | null;
  midpoint: LatLng | null;
  places: PlaceResult[];
  selectedId: string | null;
  onSelectPlace: (id: string | null) => void;
  onOpenDetails: (place: PlaceResult) => void;
}

const DEFAULT_CENTER: LatLng = { lat: 39.5, lng: -98.35 }; // continental US
const DEFAULT_ZOOM = 4;

/** Keeps every relevant marker in view as the data changes. */
function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(13);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 80);
  }, [map, JSON.stringify(points)]);

  return null;
}

export function MapView({
  mapId,
  locationA,
  locationB,
  midpoint,
  places,
  selectedId,
  onSelectPlace,
  onOpenDetails,
}: MapViewProps) {
  const boundsPoints: LatLng[] = [
    locationA?.location,
    locationB?.location,
    midpoint ?? undefined,
    ...places.map((p) => p.location),
  ].filter(Boolean) as LatLng[];

  const selected = places.find((p) => p.id === selectedId) ?? null;

  return (
    <Map
      mapId={mapId}
      defaultCenter={DEFAULT_CENTER}
      defaultZoom={DEFAULT_ZOOM}
      gestureHandling="greedy"
      disableDefaultUI={false}
      clickableIcons={false}
      className="map-canvas"
      onClick={() => onSelectPlace(null)}
    >
      <FitBounds points={boundsPoints} />

      {locationA && (
        <AdvancedMarker position={locationA.location} title={locationA.address}>
          <Pin background="#6366f1" borderColor="#4338ca" glyphColor="#fff">
            A
          </Pin>
        </AdvancedMarker>
      )}

      {locationB && (
        <AdvancedMarker position={locationB.location} title={locationB.address}>
          <Pin background="#ec4899" borderColor="#be185d" glyphColor="#fff">
            B
          </Pin>
        </AdvancedMarker>
      )}

      {midpoint && (
        <AdvancedMarker position={midpoint} title="Midpoint">
          <div className="midpoint-marker" aria-label="Midpoint">
            <Icon name="star" filled size={18} />
          </div>
        </AdvancedMarker>
      )}

      {places.map((place) => (
        <AdvancedMarker
          key={place.id}
          position={place.location}
          title={place.name}
          onClick={() => onSelectPlace(place.id)}
        >
          <div
            className={
              place.id === selectedId
                ? 'place-marker place-marker--active'
                : 'place-marker'
            }
          />
        </AdvancedMarker>
      ))}

      {selected && (
        <InfoWindow
          position={selected.location}
          pixelOffset={[0, -12]}
          onCloseClick={() => onSelectPlace(null)}
        >
          <div className="info-window">
            <div className="info-window-header">
              <strong className="info-window-name">{selected.name}</strong>
              <button
                type="button"
                className="info-window-info-btn"
                aria-label={`View details for ${selected.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(selected);
                }}
              >
                <Icon name="info" size={15} />
              </button>
            </div>
            {selected.address && (
              <div className="info-window-address">{selected.address}</div>
            )}
          </div>
        </InfoWindow>
      )}
    </Map>
  );
}
