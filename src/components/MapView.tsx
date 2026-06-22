import { useEffect } from 'react';
import { InfoWindow, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import type { LatLng, PlaceResult, UserLocation } from '../types';
import { Icon } from './Icon';

interface MapViewProps {
  locationA: UserLocation | null;
  locationB: UserLocation | null;
  midpoint: LatLng | null;
  /** Search radius in km — drawn as the gold ring around the midpoint. */
  radiusKm: number;
  places: PlaceResult[];
  selectedId: string | null;
  onSelectPlace: (id: string | null) => void;
  onOpenDetails: (place: PlaceResult) => void;
}

const DEFAULT_CENTER: LatLng = { lat: 39.5, lng: -98.35 }; // continental US
const DEFAULT_ZOOM = 4;

/**
 * "Editorial Atlas" map theme — warm paper land, muted greyed-teal water, and
 * hushed roads with POI clutter removed so the A/B/midpoint markers carry the
 * eye. Applied as inline JSON styles (which require *no* cloud Map ID), keeping
 * the app a zero-config static bundle.
 */
const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f1ead9' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  // Darker labels with a soft paper halo read clearly without shouting.
  { elementType: 'labels.text.fill', stylers: [{ color: '#5d5442' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f7f2e7' }, { weight: 2 }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d3c7af' }],
  },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'administrative.province',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#cabd9f' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#bfae89' }],
  },
  // Subtle tonal variation in the land so it reads as terrain, not a blank.
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#ece3cf' }] },
  {
    featureType: 'landscape.natural.terrain',
    elementType: 'geometry',
    stylers: [{ color: '#e6dcc5' }],
  },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#cdd9b6' }] },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7f8a5c' }, { visibility: 'on' }],
  },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#fbf7ef' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e6dbc4' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#fdfbf5' }] },
  // A faint warm tone gives the highways an "atlas route" character.
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ecdcbb' }] },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#ddc8a2' }],
  },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  // A real muted teal — reads as water, not the old grey.
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#b6cec9' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6c8e89' }] },
];

const encodeSvg = (svg: string) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

/** Teardrop pin in a brand colour with a letter — for the two endpoints. */
function pinIcon(bg: string, letter: string): google.maps.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40"><path d="M15 1C7.8 1 2 6.7 2 13.8 2 23.3 15 39 15 39s13-15.7 13-25.2C28 6.7 22.2 1 15 1Z" fill="${bg}" stroke="#ffffff" stroke-width="2.5"/><circle cx="15" cy="14" r="8.5" fill="rgba(255,255,255,0.16)"/><text x="15" y="18.6" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff">${letter}</text></svg>`;
  return {
    url: encodeSvg(svg),
    scaledSize: new google.maps.Size(30, 40),
    anchor: new google.maps.Point(15, 39),
  };
}

/** Brass disc with a white star — the midpoint, the product's signature. A soft
 *  gold halo behind the disc makes it the clear focal point of the map. */
function midpointIcon(): google.maps.Icon {
  const star =
    'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 46"><circle cx="23" cy="23" r="20" fill="#bd8729" fill-opacity="0.16"/><circle cx="23" cy="23" r="15" fill="#bd8729" stroke="#ffffff" stroke-width="2.5"/><g transform="translate(11 11)"><path d="${star}" fill="#ffffff"/></g></svg>`;
  return {
    url: encodeSvg(svg),
    scaledSize: new google.maps.Size(46, 46),
    anchor: new google.maps.Point(23, 23),
  };
}

/** A simple dot for a result, enlarged + recoloured when selected. */
function placeSymbol(active: boolean): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: active ? 8 : 5.5,
    fillColor: active ? '#dd4b2a' : '#bd8729',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  };
}

/**
 * Draws the convergence onto the geography itself: a coral spoke from Person A
 * and a teal spoke from Person B that meet at the gold midpoint, plus the gold
 * ring marking the search radius. This is the brand's signature mark rendered on
 * the map — at a glance you see who is meeting, where the fair middle lands, and
 * how wide the net is cast. Drawn with the imperative Maps API (no Map ID, no
 * extra component deps) and torn down on every change.
 */
function SpatialOverlay({
  locationA,
  locationB,
  midpoint,
  radiusKm,
}: {
  locationA: UserLocation | null;
  locationB: UserLocation | null;
  midpoint: LatLng | null;
  radiusKm: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !locationA || !locationB || !midpoint) return;

    const a = locationA.location;
    const b = locationB.location;

    const spoke = (
      path: LatLng[],
      color: string,
      weight: number,
      opacity: number,
      zIndex: number,
    ) =>
      new google.maps.Polyline({
        map,
        path,
        geodesic: true,
        clickable: false,
        strokeColor: color,
        strokeOpacity: opacity,
        strokeWeight: weight,
        zIndex,
      });

    const overlays: Array<google.maps.Polyline | google.maps.Circle> = [
      // The search area — a soft gold wash that tracks the radius slider live.
      new google.maps.Circle({
        map,
        center: midpoint,
        radius: radiusKm * 1000,
        clickable: false,
        strokeColor: '#bd8729',
        strokeOpacity: 0.5,
        strokeWeight: 1.5,
        fillColor: '#bd8729',
        fillOpacity: 0.06,
        zIndex: 0,
      }),
      // A wider, faint halo under each spoke gives the thin line depth.
      spoke([a, midpoint], '#dd4b2a', 10, 0.16, 1),
      spoke([midpoint, b], '#0e7c86', 10, 0.16, 1),
      // The duotone spokes: coral from A, teal from B, meeting at the star.
      spoke([a, midpoint], '#dd4b2a', 3, 0.95, 3),
      spoke([midpoint, b], '#0e7c86', 3, 0.95, 3),
    ];

    return () => overlays.forEach((o) => o.setMap(null));
  }, [map, locationA, locationB, midpoint, radiusKm]);

  return null;
}

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
  locationA,
  locationB,
  midpoint,
  radiusKm,
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
      defaultCenter={DEFAULT_CENTER}
      defaultZoom={DEFAULT_ZOOM}
      gestureHandling="greedy"
      disableDefaultUI={false}
      mapTypeControl={false}
      streetViewControl={false}
      clickableIcons={false}
      styles={MAP_STYLE}
      className="map-canvas"
      onClick={() => onSelectPlace(null)}
    >
      <FitBounds points={boundsPoints} />
      <SpatialOverlay
        locationA={locationA}
        locationB={locationB}
        midpoint={midpoint}
        radiusKm={radiusKm}
      />

      {locationA && (
        <Marker
          position={locationA.location}
          title={locationA.address}
          icon={pinIcon('#dd4b2a', 'A')}
        />
      )}

      {locationB && (
        <Marker
          position={locationB.location}
          title={locationB.address}
          icon={pinIcon('#0e7c86', 'B')}
        />
      )}

      {midpoint && (
        <Marker
          position={midpoint}
          title="Midpoint"
          icon={midpointIcon()}
          zIndex={1000}
        />
      )}

      {places.map((place) => (
        <Marker
          key={place.id}
          position={place.location}
          title={place.name}
          icon={placeSymbol(place.id === selectedId)}
          zIndex={place.id === selectedId ? 999 : undefined}
          onClick={() => onSelectPlace(place.id)}
        />
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
