import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlaceDetails } from '../hooks/usePlaceDetails';
import type { PlaceResult } from '../types';
import { Icon } from './Icon';

interface PlaceDetailsModalProps {
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
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={14}
          filled={n <= rounded}
          className={n <= rounded ? undefined : 'stars-empty'}
        />
      ))}
    </span>
  );
}

/** Tracks a downward touch drag on the card and calls onDismiss when threshold is met. */
function useSwipeToDismiss(
  cardRef: React.RefObject<HTMLDivElement | null>,
  scrollRef: React.RefObject<HTMLDivElement | null>,
  onDismiss: () => void,
) {
  const [dragY, setDragY] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);
  // Ref so the effect closure never goes stale when onDismiss identity changes.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // The body — not the card — is the scroll container, so only start a
    // dismiss drag when that inner region is scrolled to the very top.
    const scrollTop = () => scrollRef.current?.scrollTop ?? 0;
    const s = { startY: 0, startTime: 0, started: false, dragging: false, lastY: 0 };

    const onTouchStart = (e: TouchEvent) => {
      if (scrollTop() > 4) return;
      s.startY = e.touches[0].clientY;
      s.startTime = Date.now();
      s.started = true;
      s.dragging = false;
      s.lastY = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!s.started) return;
      if (scrollTop() > 4) { s.started = false; return; }
      const delta = e.touches[0].clientY - s.startY;
      if (delta > 0) {
        s.dragging = true;
        s.lastY = delta;
        e.preventDefault();
        setDragY(delta);
      }
    };

    const onTouchEnd = () => {
      if (!s.dragging) return;
      const elapsed = Date.now() - s.startTime;
      const velocity = s.lastY / Math.max(elapsed, 1);
      s.dragging = false;
      s.started = false;
      if (s.lastY > 80 || velocity > 0.5) {
        setIsDismissing(true);
        setTimeout(() => onDismissRef.current(), 220);
      } else {
        setDragY(0);
      }
    };

    card.addEventListener('touchstart', onTouchStart, { passive: true });
    card.addEventListener('touchmove', onTouchMove, { passive: false });
    card.addEventListener('touchend', onTouchEnd);
    return () => {
      card.removeEventListener('touchstart', onTouchStart);
      card.removeEventListener('touchmove', onTouchMove);
      card.removeEventListener('touchend', onTouchEnd);
    };
  }, [cardRef, scrollRef]);

  const cardStyle: React.CSSProperties = isDismissing
    ? { transform: 'translateY(120%)', transition: 'transform 0.22s cubic-bezier(0.4, 0, 1, 1)' }
    : dragY > 0
      ? { transform: `translateY(${dragY}px)`, transition: 'none' }
      : {};

  return { cardStyle };
}

const REVIEWS_INITIAL = 3;

/**
 * A modal "detail card" for a single place: hero photos, key facts, opening
 * hours, an editorial blurb, recent reviews, and quick links out to Google /
 * Apple Maps and the venue website. Closes on backdrop click, Escape, or a
 * downward swipe on mobile.
 */
export function PlaceDetailsModal({ place, onClose }: PlaceDetailsModalProps) {
  const { details, loading, error } = usePlaceDetails(place.id);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  // Whether the photo strip is pinned to its first / last frame, so the
  // matching arrow can fade out when there's nothing more in that direction.
  const [galleryEdges, setGalleryEdges] = useState({ atStart: true, atEnd: false });
  const { cardStyle } = useSwipeToDismiss(cardRef, scrollRef, onClose);

  const updateGalleryEdges = useCallback(() => {
    const el = galleryRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 8;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 8;
    setGalleryEdges({ atStart, atEnd });
  }, []);

  const scrollGallery = (dir: -1 | 1) => {
    const el = galleryRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  // Mirror the lightbox open-state in a ref so the Escape handler can read it
  // without re-binding the listener (and without side effects in a setter).
  const lightboxRef = useRef<string | null>(null);
  lightboxRef.current = lightboxUrl;

  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Escape backs out of the image lightbox first, then the modal.
      if (lightboxRef.current) {
        setLightboxUrl(null);
      } else {
        onClose();
      }
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

  // Recompute which carousel arrows to show whenever the photo set changes
  // (e.g. once the richer details payload swaps in its full gallery).
  useEffect(() => {
    updateGalleryEdges();
  }, [photos.length, updateGalleryEdges]);

  const mapsUrl = googleMapsUrl(place, details?.googleMapsUrl);
  const lat = details?.location.lat ?? place.location.lat;
  const lng = details?.location.lng ?? place.location.lng;

  const allReviews = details?.reviews ?? [];
  const visibleReviews = showAllReviews ? allReviews : allReviews.slice(0, REVIEWS_INITIAL);
  const hiddenCount = allReviews.length - REVIEWS_INITIAL;

  return (
    <>
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={place.name}
      onClick={onClose}
    >
      <div
        ref={cardRef}
        className="modal-card"
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-drag-handle" aria-hidden />

        <button
          type="button"
          className="modal-close"
          aria-label="Close"
          onClick={onClose}
        >
          <Icon name="close" size={17} />
        </button>

        {photos.length > 0 && (
          <div className="modal-hero">
            <div
              className="modal-gallery"
              ref={galleryRef}
              onScroll={updateGalleryEdges}
            >
              {photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  loading="lazy"
                  onClick={() => setLightboxUrl(url)}
                />
              ))}
            </div>
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  className="gallery-nav gallery-nav--prev"
                  aria-label="Previous photo"
                  disabled={galleryEdges.atStart}
                  onClick={() => scrollGallery(-1)}
                >
                  <Icon name="chevronLeft" size={20} />
                </button>
                <button
                  type="button"
                  className="gallery-nav gallery-nav--next"
                  aria-label="Next photo"
                  disabled={galleryEdges.atEnd}
                  onClick={() => scrollGallery(1)}
                >
                  <Icon name="chevronRight" size={20} />
                </button>
              </>
            )}
          </div>
        )}

        <div className="modal-scroll" ref={scrollRef}>
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

          <div className="modal-actions">
            <a
              className="modal-action modal-action--primary"
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="map" size={16} /> Google Maps
            </a>
            <a
              className="modal-action"
              href={appleMapsUrl(place.name, lat, lng)}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="navigate" size={16} /> Apple Maps
            </a>
            {details?.website && (
              <a
                className="modal-action"
                href={details.website}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="globe" size={16} /> Website
              </a>
            )}
            {details?.phone && (
              <a className="modal-action" href={`tel:${details.phone}`}>
                <Icon name="phone" size={16} /> Call
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

          {allReviews.length > 0 && (
            <section className="modal-section">
              <h3>What people say</h3>
              <ul className="modal-reviews">
                {visibleReviews.map((r, i) => (
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
              {hiddenCount > 0 && (
                <button
                  type="button"
                  className="modal-show-more-reviews"
                  onClick={() => setShowAllReviews((v) => !v)}
                >
                  {showAllReviews
                    ? 'Show fewer reviews'
                    : `Show ${hiddenCount} more ${hiddenCount === 1 ? 'review' : 'reviews'}`}
                </button>
              )}
            </section>
          )}
        </div>
        </div>
      </div>
    </div>

    {lightboxUrl && (
      <div
        className="lightbox-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Photo"
        onClick={() => setLightboxUrl(null)}
      >
        <button
          type="button"
          className="lightbox-close"
          aria-label="Close photo"
          onClick={() => setLightboxUrl(null)}
        >
          <Icon name="close" size={18} />
        </button>
        <img
          className="lightbox-img"
          src={lightboxUrl}
          alt=""
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
    </>
  );
}
