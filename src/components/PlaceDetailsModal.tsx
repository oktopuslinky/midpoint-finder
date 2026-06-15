import { useEffect } from 'react';
import { usePlaceDetails } from '../hooks/usePlaceDetails';
import type { PlaceResult } from '../types';

interface PlaceDetailsModalProps {
  /** The list item the user clicked — used for an instant header while details load. */
  place: PlaceResult;
  onClose: () => void;
}

function priceLabel(level?: number): string | null {
  if (level == null) return null;
  return '$'.repeat(Math.max(1, level));
}

function googleMapsUrl(place: PlaceResult, url?: string): string {
  if (url) return url;
  const q = encodeURIComponent(place.name);
  return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${place.id}`;
}

function appleMapsUrl(name: string, lat: number, lng: number): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(name)}&ll=${lat},${lng}`;
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="stars" aria-label={`${rating.toFixed(1)} out of 5`}>
      {'★'.repeat(rounded)}
      <span className="stars-empty">{'★'.repeat(5 - rounded)}</span>
    </span>
  );
}

/**
 * A modal "detail card" for a single place: hero photos, key facts, opening
 * hours, an editorial blurb, recent reviews, and quick links out to Google /
 * Apple Maps and the venue website. Closes on backdrop click or Escape.
 */
export function PlaceDetailsModal({ place, onClose }: PlaceDetailsModalProps) {
  const { details, loading, error } = usePlaceDetails(place.id);

  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const price = priceLabel(details?.priceLevel ?? place.priceLevel);
  const rating = details?.rating ?? place.rating;
  const ratingsTotal = details?.userRatingsTotal ?? place.userRatingsTotal;
  const openNow = details?.openNow ?? place.openNow;
  const photos = details?.photoUrls?.length
    ? details.photoUrls
    : place.photoUrl
      ? [place.photoUrl]
      : [];

  const mapsUrl = googleMapsUrl(place, details?.googleMapsUrl);
  const lat = details?.location.lat ?? place.location.lat;
  const lng = details?.location.lng ?? place.location.lng;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={place.name}
      onClick={onClose}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          aria-label="Close"
          onClick={onClose}
        >
          ✕
        </button>

        {photos.length > 0 && (
          <div className="modal-hero">
            <div className="modal-gallery">
              {photos.map((url, i) => (
                <img key={i} src={url} alt="" loading="lazy" />
              ))}
            </div>
          </div>
        )}

        <div className="modal-body">
          <h2 className="modal-title">{place.name}</h2>

          <div className="modal-meta">
            {rating != null && (
              <span className="modal-rating">
                <Stars rating={rating} />
                <strong>{rating.toFixed(1)}</strong>
                {ratingsTotal ? (
                  <span className="modal-rating-count">
                    ({ratingsTotal.toLocaleString()})
                  </span>
                ) : null}
              </span>
            )}
            {price && <span className="modal-price">{price}</span>}
            {openNow != null && (
              <span className={openNow ? 'modal-open' : 'modal-closed'}>
                {openNow ? 'Open now' : 'Closed'}
              </span>
            )}
          </div>

          {(details?.address || place.address) && (
            <p className="modal-address">{details?.address ?? place.address}</p>
          )}

          {/* Quick actions */}
          <div className="modal-actions">
            <a
              className="modal-action modal-action--primary"
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span aria-hidden>🗺️</span> Google Maps
            </a>
            <a
              className="modal-action"
              href={appleMapsUrl(place.name, lat, lng)}
              target="_blank"
              rel="noreferrer"
            >
              <span aria-hidden>📍</span> Apple Maps
            </a>
            {details?.website && (
              <a
                className="modal-action"
                href={details.website}
                target="_blank"
                rel="noreferrer"
              >
                <span aria-hidden>🌐</span> Website
              </a>
            )}
            {details?.phone && (
              <a className="modal-action" href={`tel:${details.phone}`}>
                <span aria-hidden>📞</span> Call
              </a>
            )}
          </div>

          {loading && (
            <div className="modal-loading">
              <span className="spinner" /> Loading details…
            </div>
          )}
          {error && <div className="modal-error">{error}</div>}

          {details?.editorialSummary && (
            <p className="modal-summary">{details.editorialSummary}</p>
          )}

          {details?.weekdayText && details.weekdayText.length > 0 && (
            <section className="modal-section">
              <h3>Hours</h3>
              <ul className="modal-hours">
                {details.weekdayText.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          )}

          {details?.reviews && details.reviews.length > 0 && (
            <section className="modal-section">
              <h3>What people say</h3>
              <ul className="modal-reviews">
                {details.reviews.slice(0, 5).map((r, i) => (
                  <li key={i} className="modal-review">
                    <div className="modal-review-head">
                      {r.authorPhotoUrl ? (
                        <img
                          className="modal-review-avatar"
                          src={r.authorPhotoUrl}
                          alt=""
                          loading="lazy"
                        />
                      ) : (
                        <span className="modal-review-avatar modal-review-avatar--empty">
                          {r.author.charAt(0)}
                        </span>
                      )}
                      <div className="modal-review-by">
                        <span className="modal-review-author">{r.author}</span>
                        <span className="modal-review-sub">
                          {r.rating != null && <Stars rating={r.rating} />}
                          {r.relativeTime && (
                            <span className="modal-review-time">
                              {r.relativeTime}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <p className="modal-review-text">{r.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
