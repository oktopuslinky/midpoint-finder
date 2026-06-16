import { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import type { PlaceDetails } from '../types';

interface UsePlaceDetailsResult {
  details: PlaceDetails | null;
  loading: boolean;
  error: string | null;
}

const DETAIL_FIELDS = [
  'place_id',
  'name',
  'geometry',
  'formatted_address',
  'formatted_phone_number',
  'website',
  'url',
  'rating',
  'user_ratings_total',
  'price_level',
  'opening_hours',
  'reviews',
  'photos',
  'editorial_summary',
  'types',
];

/**
 * Lazily fetches the full detail set for a single place once `placeId` is set
 * (i.e. when the user opens its card). Returns null until loaded. Uses a
 * detached PlacesService so no live map instance is required.
 */
export function usePlaceDetails(placeId: string | null): UsePlaceDetailsResult {
  const placesLib = useMapsLibrary('places');
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null);

  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placesLib) return;
    serviceRef.current = new placesLib.PlacesService(
      document.createElement('div'),
    );
  }, [placesLib]);

  useEffect(() => {
    const service = serviceRef.current;
    if (!service || !placeId) {
      setDetails(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetails(null);

    service.getDetails(
      { placeId, fields: DETAIL_FIELDS },
      (result, status) => {
        if (cancelled) return;
        setLoading(false);

        const { PlacesServiceStatus } = google.maps.places;
        if (status !== PlacesServiceStatus.OK || !result) {
          setError('Could not load details for this place.');
          return;
        }

        const loc = result.geometry?.location;
        // editorial_summary isn't in the published typings; read it loosely.
        const editorial = (
          result as unknown as {
            editorial_summary?: { overview?: string };
          }
        ).editorial_summary?.overview;

        setDetails({
          id: result.place_id ?? placeId,
          name: result.name ?? '',
          location: loc
            ? { lat: loc.lat(), lng: loc.lng() }
            : { lat: 0, lng: 0 },
          address: result.formatted_address,
          phone: result.formatted_phone_number,
          website: result.website,
          googleMapsUrl: result.url,
          rating: result.rating,
          userRatingsTotal: result.user_ratings_total,
          priceLevel: result.price_level,
          openNow:
            typeof result.opening_hours?.isOpen === 'function'
              ? result.opening_hours.isOpen()
              : undefined,
          weekdayText: result.opening_hours?.weekday_text,
          editorialSummary: editorial,
          reviews: (result.reviews ?? []).map((r) => ({
            author: r.author_name,
            authorPhotoUrl: r.profile_photo_url,
            rating: r.rating,
            text: r.text,
            relativeTime: r.relative_time_description,
          })),
          photoUrls: (result.photos ?? [])
            .slice(0, 10)
            .map((p) => p.getUrl({ maxWidth: 800, maxHeight: 500 })),
          types: result.types ?? [],
        });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  return { details, loading, error };
}
