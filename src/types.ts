export interface LatLng {
  lat: number;
  lng: number;
}

/** A resolved location chosen by one of the two users. */
export interface UserLocation {
  /** Human-readable address shown in the input. */
  address: string;
  location: LatLng;
}

/** A "thing to do" returned from the Places nearby search. */
export interface PlaceResult {
  id: string;
  name: string;
  location: LatLng;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  /** True while the place is open, undefined if unknown. */
  openNow?: boolean;
  photoUrl?: string;
  types: string[];
}

/** A single user review attached to a place. */
export interface PlaceReview {
  author: string;
  authorPhotoUrl?: string;
  rating?: number;
  text: string;
  /** e.g. "2 months ago" */
  relativeTime?: string;
}

/**
 * The richer detail set fetched lazily when a user opens a place. Superset of
 * `PlaceResult` with the fields a person actually needs to decide and go.
 */
export interface PlaceDetails {
  id: string;
  name: string;
  location: LatLng;
  address?: string;
  phone?: string;
  website?: string;
  /** Canonical Google Maps URL for the place. */
  googleMapsUrl?: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  openNow?: boolean;
  /** Human-readable opening hours, one line per day. */
  weekdayText?: string[];
  /** Google's editorial overview — "what this place is known for". */
  editorialSummary?: string;
  reviews: PlaceReview[];
  photoUrls: string[];
  types: string[];
}

/** A searchable category of activity, mapped to a Google Places `type`. */
export interface Category {
  /** Stable id; also the key into the icon registry (see {@link Icon}). */
  id: string;
  label: string;
  /** Google Places nearby-search `type`. */
  placeType: string;
}
