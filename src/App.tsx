import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { LocationInput } from './components/LocationInput';
import { MapView } from './components/MapView';
import { ResultsPanel } from './components/ResultsPanel';
import { PlaceDetailsModal } from './components/PlaceDetailsModal';
import { Icon, type IconName } from './components/Icon';
import { useNearbyPlaces } from './hooks/useNearbyPlaces';
import { CATEGORIES, geographicMidpoint } from './lib/geo';
import type { LatLng, PlaceResult, UserLocation } from './types';
import './App.css';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const MAP_ID =
  (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined) ||
  'DEMO_MAP_ID';

const DEFAULT_RADIUS_KM = 5;

type MobileView = 'list' | 'map';

/**
 * A committed search. The editable form is snapshotted into this when the user
 * presses "Find places"; only this drives the results. Editing the form
 * afterwards changes nothing until they search again.
 */
interface SearchQuery {
  midpoint: LatLng;
  placeType: string;
  radiusKm: number;
}

/** Inner app — must live under APIProvider so map hooks work. */
function Finder() {
  const [locationA, setLocationA] = useState<UserLocation | null>(null);
  const [locationB, setLocationB] = useState<UserLocation | null>(null);
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsPlace, setDetailsPlace] = useState<PlaceResult | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>('list');

  // The committed search. Results load only for what the user has explicitly
  // searched — editing the form below does nothing until they press the search
  // button, which snapshots the current locations/category/radius into here.
  const [query, setQuery] = useState<SearchQuery | null>(null);

  // Collapsible sections state
  const [sectionOpen, setSectionOpen] = useState({
    locations: true,
    categories: true,
    radius: true,
  });

  const category =
    CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[0];

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

  // Both locations are resolved, so a search can run.
  const canSearch = Boolean(midpoint);
  // A search has been committed — the results column reflects it.
  const hasSearched = query !== null;
  // The editable form has drifted from the committed search, so pressing the
  // button would change the results.
  const dirty =
    !query ||
    query.midpoint.lat !== midpoint?.lat ||
    query.midpoint.lng !== midpoint?.lng ||
    query.placeType !== category.placeType ||
    query.radiusKm !== radiusKm;

  // Stable callbacks so LocationInput's effect doesn't re-bind each render.
  const handleSelectA = useCallback((loc: UserLocation | null) => {
    setLocationA(loc);
    setSelectedId(null);
  }, []);
  const handleSelectB = useCallback((loc: UserLocation | null) => {
    setLocationB(loc);
    setSelectedId(null);
  }, []);

  // Commit the current form as the active search. Collapsing the panel gives
  // the results room, and on mobile we drop the user onto the list.
  const handleSearch = useCallback(() => {
    if (!midpoint) return;
    setQuery({ midpoint, placeType: category.placeType, radiusKm });
    setSelectedId(null);
    setPanelOpen(false);
    setMobileView('list');
  }, [midpoint, category.placeType, radiusKm]);

  // Opening a card's details also highlights it on the map underneath, but
  // doesn't switch mobile views — the modal covers the screen anyway.
  const handleOpenDetails = useCallback((place: PlaceResult) => {
    setDetailsPlace(place);
    setSelectedId(place.id);
  }, []);

  return (
    <div className={`app app--${mobileView}`}>
      <aside className="sidebar">
        <header className="brand">
          <span className="brand-mark">
            <Icon name="brand" size={24} />
          </span>
          <div>
            <h1>Meet in the Middle</h1>
            <p>Find things to do between two locations.</p>
          </div>
        </header>

        <section className="search-panel">
          <button
            type="button"
            className="panel-toggle"
            aria-expanded={panelOpen}
            onClick={() => setPanelOpen((v) => !v)}
          >
            <span className="panel-toggle-icon">
              <Icon name="radius" size={17} />
            </span>
            <span className="panel-toggle-label">
              {panelOpen ? 'Search settings' : 'Edit search'}
            </span>
            {!panelOpen && hasSearched && (
              <span className="panel-toggle-summary">
                <Icon name={category.id as IconName} size={14} />{' '}
                {category.label} · {radiusKm} km
              </span>
            )}
            <Icon
              name="chevronDown"
              size={16}
              className={panelOpen ? 'chevron' : 'chevron chevron--closed'}
            />
          </button>

          {!panelOpen && hasSearched && (
            <div
              className="panel-summary"
              role="button"
              tabIndex={0}
              onClick={() => setPanelOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setPanelOpen(true);
              }}
            >
              <span className="summary-row">
                <span className="summary-dot summary-dot--a">A</span>
                <span className="summary-text">{locationA?.address}</span>
              </span>
              <span className="summary-row">
                <span className="summary-dot summary-dot--b">B</span>
                <span className="summary-text">{locationB?.address}</span>
              </span>
            </div>
          )}

          {panelOpen && (
            <div className="panel-body">
              {/* Locations Section */}
              <CollapsibleSection
                id="locations"
                label="Locations"
                icon="pin"
                open={sectionOpen.locations}
                onToggle={() => setSectionOpen((s) => ({ ...s, locations: !s.locations }))}
                summary={
                  <>
                    {locationA && (
                      <span className="summary-row-inline">
                        <span className="summary-dot summary-dot--a">A</span>
                        <span className="summary-text-inline">{locationA.address}</span>
                      </span>
                    )}
                    {locationB && (
                      <span className="summary-row-inline">
                        <span className="summary-dot summary-dot--b">B</span>
                        <span className="summary-text-inline">{locationB.address}</span>
                      </span>
                    )}
                    {!locationA && !locationB && <span className="summary-empty">Add two locations to begin</span>}
                  </>
                }
              >
                <div className="inputs">
                  <LocationInput
                    label="First location"
                    badge="A"
                    accent="#6366f1"
                    placeholder="e.g. Brooklyn, NY"
                    value={locationA}
                    onSelect={handleSelectA}
                  />
                  <div className="inputs-divider">
                    <span>between</span>
                  </div>
                  <LocationInput
                    label="Second location"
                    badge="B"
                    accent="#ec4899"
                    placeholder="e.g. Jersey City, NJ"
                    value={locationB}
                    onSelect={handleSelectB}
                  />
                </div>
              </CollapsibleSection>

              {/* Categories Section */}
              <CollapsibleSection
                id="categories"
                label="Category"
                icon="grid"
                open={sectionOpen.categories}
                onToggle={() => setSectionOpen((s) => ({ ...s, categories: !s.categories }))}
                summary={
                  <span className="summary-row-inline">
                    <Icon name={category.id as IconName} size={14} />{' '}
                    {category.label}
                  </span>
                }
              >
                <div className="controls">
                  <div className="chips">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={
                          c.id === categoryId ? 'chip chip--active' : 'chip'
                        }
                        onClick={() => {
                          setCategoryId(c.id);
                          setSelectedId(null);
                        }}
                      >
                        <Icon name={c.id as IconName} size={15} />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>

              {/* Radius Section */}
              <CollapsibleSection
                id="radius"
                label="Search radius"
                icon="radius"
                open={sectionOpen.radius}
                onToggle={() => setSectionOpen((s) => ({ ...s, radius: !s.radius }))}
                summary={
                  <span className="summary-row-inline"><strong>{radiusKm} km</strong></span>
                }
              >
                <div className="controls">
                  <div className="radius">
                    <div className="radius-value">
                      <strong>{radiusKm}</strong> km
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      aria-label="Search radius in kilometres"
                      style={
                        {
                          '--pct': `${((radiusKm - 1) / 49) * 100}%`,
                        } as CSSProperties
                      }
                    />
                    <div className="radius-scale">
                      <span>1 km</span>
                      <span>50 km</span>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          )}

          {panelOpen && (
            <div className="panel-actions">
              <button
                type="button"
                className={
                  hasSearched && !dirty
                    ? 'search-btn search-btn--ghost'
                    : 'search-btn'
                }
                disabled={!canSearch}
                onClick={handleSearch}
              >
                <Icon name="search" size={17} />
                <span>
                  {!hasSearched
                    ? 'Find places'
                    : dirty
                      ? 'Update results'
                      : 'Search again'}
                </span>
              </button>
              {!canSearch && (
                <p className="panel-actions-hint">
                  Add two locations to search.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="results">
          <ResultsPanel
            places={places}
            loading={loading}
            error={error}
            ready={hasSearched}
            midpoint={midpoint}
            selectedId={selectedId}
            onOpenDetails={handleOpenDetails}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        </section>
      </aside>

      <main className="map-wrap">
        <MapView
          mapId={MAP_ID}
          locationA={locationA}
          locationB={locationB}
          midpoint={midpoint}
          places={places}
          selectedId={selectedId}
          onSelectPlace={setSelectedId}
          onOpenDetails={handleOpenDetails}
        />
      </main>

      <nav className="mobile-nav" aria-label="View switcher">
        <div className="mobile-switch" data-active={mobileView}>
          <span className="mobile-switch-thumb" aria-hidden="true" />
          <button
            type="button"
            className={
              mobileView === 'list'
                ? 'mobile-tab mobile-tab--active'
                : 'mobile-tab'
            }
            aria-pressed={mobileView === 'list'}
            onClick={() => setMobileView('list')}
          >
            <Icon name="list" size={19} />
            <span>List</span>
            {hasSearched && places.length > 0 && (
              <span className="mobile-count">{places.length}</span>
            )}
          </button>
          <button
            type="button"
            className={
              mobileView === 'map'
                ? 'mobile-tab mobile-tab--active'
                : 'mobile-tab'
            }
            aria-pressed={mobileView === 'map'}
            onClick={() => setMobileView('map')}
          >
            <Icon name="map" size={19} />
            <span>Map</span>
          </button>
        </div>
      </nav>

      {detailsPlace && (
        <PlaceDetailsModal
          place={detailsPlace}
          onClose={() => setDetailsPlace(null)}
        />
      )}
    </div>
  );
}

interface CollapsibleSectionProps {
  id: string;
  label: string;
  /** Leading icon shown in the section header. */
  icon: IconName;
  open: boolean;
  onToggle: () => void;
  /** Compact preview shown in the header while the section is collapsed. */
  summary: ReactNode;
  children: ReactNode;
}

/** A labelled, collapsible block in the search panel. */
function CollapsibleSection({
  id,
  label,
  icon,
  open,
  onToggle,
  summary,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="section">
      <button
        type="button"
        className="section-header"
        aria-expanded={open}
        aria-controls={`section-${id}`}
        onClick={onToggle}
      >
        <span className="section-icon">
          <Icon name={icon} size={17} />
        </span>
        <span className="section-label">{label}</span>
        {!open && <span className="section-summary">{summary}</span>}
        <Icon
          name="chevronDown"
          size={16}
          className={open ? 'chevron' : 'chevron chevron--closed'}
        />
      </button>
      {open && (
        <div className="section-body" id={`section-${id}`}>
          {children}
        </div>
      )}
    </div>
  );
}

function MissingKey() {
  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1>API key required</h1>
        <p>
          Create a <code>.env</code> file in the project root with your Google
          Maps key:
        </p>
        <pre>VITE_GOOGLE_MAPS_API_KEY=your_key_here</pre>
        <p>
          Enable the <strong>Maps JavaScript API</strong>,{' '}
          <strong>Places API</strong>, and <strong>Geocoding API</strong> in the
          Google Cloud Console, then restart the dev server.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  if (!API_KEY) return <MissingKey />;
  return (
    <APIProvider apiKey={API_KEY} libraries={['places', 'geocoding', 'marker']}>
      <Finder />
    </APIProvider>
  );
}
