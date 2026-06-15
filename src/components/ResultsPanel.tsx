import type { LatLng, PlaceResult } from '../types';
import { distanceMeters, formatDistance } from '../lib/geo';

interface ResultsPanelProps {
  places: PlaceResult[];
  loading: boolean;
  error: string | null;
  ready: boolean;
  midpoint: LatLng | null;
  selectedId: string | null;
  /** Open the full detail card for a place. */
  onOpenDetails: (place: PlaceResult) => void;
  /** Whether another page of results is available. */
  hasMore: boolean;
  /** True while the next page is loading. */
  loadingMore: boolean;
  /** Fetch the next page of results. */
  onLoadMore: () => void;
}

function priceLabel(level?: number): string | null {
  if (level == null) return null;
  return '$'.repeat(Math.max(1, level));
}

function directionsUrl(place: PlaceResult): string {
  const q = encodeURIComponent(place.name);
  return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${place.id}`;
}

export function ResultsPanel({
  places,
  loading,
  error,
  ready,
  midpoint,
  selectedId,
  onOpenDetails,
  hasMore,
  loadingMore,
  onLoadMore,
}: ResultsPanelProps) {
  if (!ready) {
    return (
      <div className="results-empty">
        <span className="results-empty-icon">📍</span>
        <p>Enter both locations to discover things to do in the middle.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="results-status">
        <span className="spinner" /> Finding places…
      </div>
    );
  }

  if (error) {
    return <div className="results-status results-error">{error}</div>;
  }

  if (places.length === 0) {
    return (
      <div className="results-empty">
        <span className="results-empty-icon">🤷</span>
        <p>No spots found here. Try another category or widen the radius.</p>
      </div>
    );
  }

  return (
    <>
    <ul className="results-list">
      {places.map((place) => {
        const price = priceLabel(place.priceLevel);
        const dist =
          midpoint && place.location
            ? formatDistance(distanceMeters(midpoint, place.location))
            : null;
        return (
          <li key={place.id}>
            <button
              type="button"
              className={
                place.id === selectedId
                  ? 'place-card place-card--active'
                  : 'place-card'
              }
              onClick={() => onOpenDetails(place)}
            >
              {place.photoUrl ? (
                <img
                  className="place-thumb"
                  src={place.photoUrl}
                  alt=""
                  loading="lazy"
                />
              ) : (
                <div className="place-thumb place-thumb--empty">🏙️</div>
              )}
              <div className="place-info">
                <div className="place-name">{place.name}</div>
                <div className="place-meta">
                  {place.rating != null && (
                    <span className="place-rating">
                      ⭐ {place.rating.toFixed(1)}
                      {place.userRatingsTotal
                        ? ` · ${place.userRatingsTotal}`
                        : ''}
                    </span>
                  )}
                  {price && <span className="place-price">{price}</span>}
                  {place.openNow != null && (
                    <span
                      className={
                        place.openNow ? 'place-open' : 'place-closed'
                      }
                    >
                      {place.openNow ? 'Open' : 'Closed'}
                    </span>
                  )}
                </div>
                {place.address && (
                  <div className="place-address">{place.address}</div>
                )}
                <div className="place-footer">
                  {dist && <span className="place-distance">{dist} from midpoint</span>}
                  <a
                    href={directionsUrl(place)}
                    target="_blank"
                    rel="noreferrer"
                    className="place-directions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Directions ↗
                  </a>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
    {hasMore && (
      <button
        type="button"
        className="see-more"
        onClick={onLoadMore}
        disabled={loadingMore}
      >
        {loadingMore ? (
          <>
            <span className="spinner" /> Loading more…
          </>
        ) : (
          'See more places'
        )}
      </button>
    )}
    </>
  );
}
