import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNearbyPlaces } from '../hooks/useNearbyPlaces';
import { CATEGORIES, geographicMidpoint } from '../lib/geo';
import type { Category, LatLng, PlaceResult, UserLocation } from '../types';

export const DEFAULT_RADIUS_KM = 5;

export type MobileView = 'list' | 'map';

interface SectionOpenState {
  locations: boolean;
  categories: boolean;
  radius: boolean;
}

/**
 * A committed search. The editable form is snapshotted into this when the user
 * commits a search; only this drives the results. Editing the form afterwards
 * changes nothing until they search again.
 */
interface SearchQuery {
  midpoint: LatLng;
  placeType: string;
  radiusKm: number;
}

interface FinderContextValue {
  // Editable form state.
  locationA: UserLocation | null;
  locationB: UserLocation | null;
  categoryId: string;
  radiusKm: number;
  category: Category;
  midpoint: LatLng | null;

  // Derived flags.
  canSearch: boolean;
  hasSearched: boolean;
  dirty: boolean;

  // Results.
  places: PlaceResult[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;

  // Selection & details.
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  detailsPlace: PlaceResult | null;
  setDetailsPlace: (place: PlaceResult | null) => void;
  openDetails: (place: PlaceResult) => void;

  // Finder UI chrome.
  panelOpen: boolean;
  setPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mobileView: MobileView;
  setMobileView: (v: MobileView) => void;
  sectionOpen: SectionOpenState;
  setSectionOpen: React.Dispatch<React.SetStateAction<SectionOpenState>>;

  // Actions.
  selectA: (loc: UserLocation | null) => void;
  selectB: (loc: UserLocation | null) => void;
  setCategoryId: (id: string) => void;
  setRadiusKm: (km: number) => void;
  /** Commit the current form as the active search and reset finder chrome. */
  commitSearch: () => void;
}

const FinderContext = createContext<FinderContextValue | null>(null);

/**
 * Owns every piece of search state so the landing hero and the finder screen
 * operate on one shared model — entering locations on the landing page and
 * pressing "Find the middle" lands the user in the finder with results already
 * loading, no state lost across the route change.
 */
export function FinderProvider({ children }: { children: ReactNode }) {
  const [locationA, setLocationA] = useState<UserLocation | null>(null);
  const [locationB, setLocationB] = useState<UserLocation | null>(null);
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsPlace, setDetailsPlace] = useState<PlaceResult | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [sectionOpen, setSectionOpen] = useState<SectionOpenState>({
    locations: true,
    categories: true,
    radius: true,
  });
  const [query, setQuery] = useState<SearchQuery | null>(null);

  const category = CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[0];

  const midpoint = useMemo(() => {
    if (!locationA || !locationB) return null;
    return geographicMidpoint(locationA.location, locationB.location);
  }, [locationA, locationB]);

  const { places, loading, loadingMore, hasMore, loadMore, error } =
    useNearbyPlaces(
      query?.midpoint ?? null,
      query?.placeType ?? '',
      (query?.radiusKm ?? DEFAULT_RADIUS_KM) * 1000,
    );

  const canSearch = Boolean(midpoint);
  const hasSearched = query !== null;
  const dirty =
    !query ||
    query.midpoint.lat !== midpoint?.lat ||
    query.midpoint.lng !== midpoint?.lng ||
    query.placeType !== category.placeType ||
    query.radiusKm !== radiusKm;

  const selectA = useCallback((loc: UserLocation | null) => {
    setLocationA(loc);
    setSelectedId(null);
  }, []);
  const selectB = useCallback((loc: UserLocation | null) => {
    setLocationB(loc);
    setSelectedId(null);
  }, []);

  const commitSearch = useCallback(() => {
    if (!midpoint) return;
    setQuery({ midpoint, placeType: category.placeType, radiusKm });
    setSelectedId(null);
    setPanelOpen(false);
    setMobileView('list');
  }, [midpoint, category.placeType, radiusKm]);

  const openDetails = useCallback((place: PlaceResult) => {
    setDetailsPlace(place);
    setSelectedId(place.id);
  }, []);

  const value: FinderContextValue = {
    locationA,
    locationB,
    categoryId,
    radiusKm,
    category,
    midpoint,
    canSearch,
    hasSearched,
    dirty,
    places,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    selectedId,
    setSelectedId,
    detailsPlace,
    setDetailsPlace,
    openDetails,
    panelOpen,
    setPanelOpen,
    mobileView,
    setMobileView,
    sectionOpen,
    setSectionOpen,
    selectA,
    selectB,
    setCategoryId,
    setRadiusKm,
    commitSearch,
  };

  return (
    <FinderContext.Provider value={value}>{children}</FinderContext.Provider>
  );
}

export function useFinder(): FinderContextValue {
  const ctx = useContext(FinderContext);
  if (!ctx) throw new Error('useFinder must be used within a FinderProvider');
  return ctx;
}
