import { useCallback, useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { distanceMeters } from '../lib/geo';
import type { LatLng, PlaceResult } from '../types';

interface UseNearbyPlacesResult {
  places: PlaceResult[];
  loading: boolean;
  /** True while a "see more" page is being fetched. */
  loadingMore: boolean;
  /** True when another page of results can be fetched. */
  hasMore: boolean;
  /** Fetch the next page (~20 more results) from the same search. */
  loadMore: () => void;
  error: string | null;
}

type RawPlace = { place: PlaceResult; distance: number };

function mapResults(
  results: google.maps.places.PlaceResult[],
  origin: LatLng,
): RawPlace[] {
  return results
    .filter((r) => r.geometry?.location && r.place_id && r.name)
    .map((r) => {
      const loc = r.geometry!.location!;
      const openNow =
        typeof r.opening_hours?.isOpen === 'function'
          ? r.opening_hours.isOpen()
          : undefined;
      const place: PlaceResult = {
        id: r.place_id!,
        name: r.name!,
        location: { lat: loc.lat(), lng: loc.lng() },
        address: r.vicinity,
        rating: r.rating,
        userRatingsTotal: r.user_ratings_total,
        priceLevel: r.price_level,
        openNow,
        photoUrl: r.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 240 }),
        types: r.types ?? [],
      };
      return { place, distance: distanceMeters(origin, place.location) };
    });
}

/**
 * Runs a Places "nearby search" around `center` for the given Google place
 * `type`. Re-queries whenever the center or type changes.
 *
 * Results arrive in pages of up to 20 (Google returns at most 60 across 3
 * pages). The first page loads automatically; `loadMore` pulls the next page
 * from the same search via the pagination token, accumulating into one list.
 *
 * Uses a detached PlacesService (constructed with a throwaway <div>) so it does
 * not need a live map instance.
 */
export function useNearbyPlaces(
  center: LatLng | null,
  placeType: string,
  radiusMeters: number,
): UseNearbyPlacesResult {
  const placesLib = useMapsLibrary('places');
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null);
  const paginationRef =
    useRef<google.maps.places.PlaceSearchPagination | null>(null);

  const [raw, setRaw] = useState<RawPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build the service once the library is ready.
  useEffect(() => {
    if (!placesLib) return;
    serviceRef.current = new placesLib.PlacesService(
      document.createElement('div'),
    );
  }, [placesLib]);

  // Initial fetch on center/type change. The callback below is reused by
  // pagination.nextPage(): the first invocation replaces the list, later ones
  // append. `firstPage` tracks which case we're in for this search.
  useEffect(() => {
    const service = serviceRef.current;
    if (!service || !center) {
      setRaw([]);
      setHasMore(false);
      paginationRef.current = null;
      return;
    }

    const origin = center;
    let cancelled = false;
    let firstPage = true;
    setLoading(true);
    setError(null);
    setRaw([]);
    paginationRef.current = null;

    // `rankBy: DISTANCE` returns results ordered closest-first (and forbids a
    // `radius`), so we keep the raw list with each place's distance and apply
    // the radius filter separately — dragging the radius slider then re-filters
    // instantly without new API calls.
    const request: google.maps.places.PlaceSearchRequest = {
      location: origin,
      type: placeType,
      rankBy: google.maps.places.RankBy.DISTANCE,
    };

    // Inline so the callback params are contextually typed by nearbySearch.
    // pagination.nextPage() re-invokes this same callback with the next page.
    service.nearbySearch(request, (results, status, pagination) => {
      if (cancelled) return;
      setLoading(false);
      setLoadingMore(false);

      paginationRef.current = pagination;
      setHasMore(Boolean(pagination?.hasNextPage));

      const { PlacesServiceStatus } = google.maps.places;
      if (status === PlacesServiceStatus.ZERO_RESULTS) {
        if (firstPage) setRaw([]);
        firstPage = false;
        return;
      }
      if (status !== PlacesServiceStatus.OK || !results) {
        if (firstPage) {
          setError('Could not load places. Check your API key and billing.');
          setRaw([]);
        }
        firstPage = false;
        return;
      }

      const mapped = mapResults(results, origin);
      if (firstPage) {
        setRaw(mapped);
      } else {
        // Dedupe by id in case pages overlap.
        setRaw((prev) => {
          const seen = new Set(prev.map((x) => x.place.id));
          return [...prev, ...mapped.filter((x) => !seen.has(x.place.id))];
        });
      }
      firstPage = false;
    });

    return () => {
      cancelled = true;
    };
  }, [center?.lat, center?.lng, placeType]);

  const loadMore = useCallback(() => {
    const pagination = paginationRef.current;
    if (!pagination || !pagination.hasNextPage) return;
    setLoadingMore(true);
    // Re-invokes the same callback registered above with the next page.
    pagination.nextPage();
  }, []);

  // Closest-first, limited to the selected radius. Left unmemoized — the React
  // Compiler memoizes this automatically from the dependencies it infers.
  const places = raw
    .filter((x) => x.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance)
    .map((x) => x.place);

  return { places, loading, loadingMore, hasMore, loadMore, error };
}
