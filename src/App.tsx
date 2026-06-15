import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { LocationInput } from './components/LocationInput';
import { MapView } from './components/MapView';
import { ResultsPanel } from './components/ResultsPanel';
import { PlaceDetailsModal } from './components/PlaceDetailsModal';
import { useNearbyPlaces } from './hooks/useNearbyPlaces';
import { CATEGORIES, geographicMidpoint } from './lib/geo';
import type { PlaceResult, UserLocation } from './types';
import './App.css';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const MAP_ID =
  (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined) ||
  'DEMO_MAP_ID';

const DEFAULT_RADIUS_KM = 5;

type MobileView = 'list' | 'map';

/** Inner app — must live under APIProvider so map hooks work. */
function Finder() {
  const [locationA, setLocationA] = useState<UserLocation | null>(null);
  const [locationB, setLocationB] = useState<UserLocation | null>(null);
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsPlace, setDetailsPlace] = useState<PlaceResult | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [wasReady, setWasReady] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('list');

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
    useNearbyPlaces(midpoint, category.placeType, radiusKm * 1000);

  const ready = Boolean(midpoint);

  // Collapse the search panel automatically once both locations resolve, so the
  // results have room. Done during render via the "previous value" pattern
  // (https://react.dev/learn/you-might-not-need-an-effect) rather than an
  // effect, so it stays a single render with no cascading update. The user can
  // reopen the panel from its header at any time.
  if (ready !== wasReady) {
    setWasReady(ready);
    if (ready) setPanelOpen(false);
  }

  // Stable callbacks so LocationInput's effect doesn't re-bind each render.
  const handleSelectA = useCallback((loc: UserLocation | null) => {
    setLocationA(loc);
    setSelectedId(null);
  }, []);
  const handleSelectB = useCallback((loc: UserLocation | null) => {
    setLocationB(loc);
    setSelectedId(null);
  }, []);

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
          <span className="brand-mark">🧭</span>
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
            <span className="panel-toggle-label">
              {panelOpen ? 'Search settings' : 'Edit search'}
            </span>
            {!panelOpen && ready && (
              <span className="panel-toggle-summary">
                <span aria-hidden>{category.icon}</span> {category.label} ·{' '}
                {radiusKm} km
              </span>
            )}
            <span className="chevron" aria-hidden>
              {panelOpen ? '▾' : '▸'}
            </span>
          </button>

          {!panelOpen && ready && (
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
                open={sectionOpen.categories}
                onToggle={() => setSectionOpen((s) => ({ ...s, categories: !s.categories }))}
                summary={
                  <span className="summary-row-inline">
                    <span aria-hidden>{category.icon}</span> {category.label}
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
                        <span aria-hidden>{c.icon}</span> {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>

              {/* Radius Section */}
              <CollapsibleSection
                id="radius"
                label="Search radius"
                open={sectionOpen.radius}
                onToggle={() => setSectionOpen((s) => ({ ...s, radius: !s.radius }))}
                summary={
                  <span className="summary-row-inline"><strong>{radiusKm} km</strong></span>
                }
              >
                <div className="controls">
                  <div className="radius">
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      aria-label="Search radius in kilometres"
                    />
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          )}
        </section>

        <section className="results">
          <ResultsPanel
            places={places}
            loading={loading}
            error={error}
            ready={ready}
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
        />
      </main>

      <nav className="mobile-nav" aria-label="View switcher">
        <button
          type="button"
          className={mobileView === 'list' ? 'mobile-tab mobile-tab--active' : 'mobile-tab'}
          aria-pressed={mobileView === 'list'}
          onClick={() => setMobileView('list')}
        >
          📋 List
          {ready && places.length > 0 && (
            <span className="mobile-count">{places.length}</span>
          )}
        </button>
        <button
          type="button"
          className={mobileView === 'map' ? 'mobile-tab mobile-tab--active' : 'mobile-tab'}
          aria-pressed={mobileView === 'map'}
          onClick={() => setMobileView('map')}
        >
          🗺️ Map
        </button>
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
        <span className="section-label">{label}</span>
        {!open && <span className="section-summary">{summary}</span>}
        <span className="chevron" aria-hidden>
          {open ? '▾' : '▸'}
        </span>
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
        <h1>🔑 API key required</h1>
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
