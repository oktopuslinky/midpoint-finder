import { type CSSProperties, type ReactNode } from 'react';
import { LocationInput } from './LocationInput';
import { MapView } from './MapView';
import { ResultsPanel } from './ResultsPanel';
import { PlaceDetailsModal } from './PlaceDetailsModal';
import { ConvergenceLine } from './ConvergenceLine';
import { Icon, type IconName } from './Icon';
import { useFinder } from '../state/FinderContext';
import { useHashRoute } from '../hooks/useHashRoute';
import { CATEGORIES, distanceMeters, formatDistance } from '../lib/geo';

/** The finder workspace: search panel + results rail beside a live map. */
export function Finder() {
  const { navigate } = useHashRoute();
  const {
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
  } = useFinder();

  return (
    <div className={`app app--${mobileView}`}>
      <aside className="sidebar">
        <header className="brand">
          <a
            className="brand-home"
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            aria-label="Back to home"
          >
            <span className="brand-mark">
              <Icon name="brand" size={22} />
            </span>
            <span className="brand-text">
              <span className="brand-name">Meet in the Middle</span>
              <span className="brand-tag">Find the fair halfway point</span>
            </span>
          </a>
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
              {/* Locations */}
              <CollapsibleSection
                id="locations"
                label="Locations"
                icon="pin"
                open={sectionOpen.locations}
                onToggle={() =>
                  setSectionOpen((s) => ({ ...s, locations: !s.locations }))
                }
                summary={
                  <>
                    {locationA && (
                      <span className="summary-row-inline">
                        <span className="summary-dot summary-dot--a">A</span>
                        <span className="summary-text-inline">
                          {locationA.address}
                        </span>
                      </span>
                    )}
                    {locationB && (
                      <span className="summary-row-inline">
                        <span className="summary-dot summary-dot--b">B</span>
                        <span className="summary-text-inline">
                          {locationB.address}
                        </span>
                      </span>
                    )}
                    {!locationA && !locationB && (
                      <span className="summary-empty">
                        Add two locations to begin
                      </span>
                    )}
                  </>
                }
              >
                <div className="inputs">
                  <LocationInput
                    label="First location"
                    badge="A"
                    accent="var(--coral)"
                    placeholder="e.g. Brooklyn, NY"
                    value={locationA}
                    onSelect={selectA}
                  />
                  <div className="inputs-divider">
                    <span>between</span>
                  </div>
                  <LocationInput
                    label="Second location"
                    badge="B"
                    accent="var(--teal)"
                    placeholder="e.g. Jersey City, NJ"
                    value={locationB}
                    onSelect={selectB}
                  />
                </div>
              </CollapsibleSection>

              {/* Category */}
              <CollapsibleSection
                id="categories"
                label="Category"
                icon="grid"
                open={sectionOpen.categories}
                onToggle={() =>
                  setSectionOpen((s) => ({ ...s, categories: !s.categories }))
                }
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

              {/* Radius */}
              <CollapsibleSection
                id="radius"
                label="Search radius"
                icon="radius"
                open={sectionOpen.radius}
                onToggle={() =>
                  setSectionOpen((s) => ({ ...s, radius: !s.radius }))
                }
                summary={
                  <span className="summary-row-inline">
                    <strong>{radiusKm} km</strong>
                  </span>
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
                onClick={commitSearch}
              >
                <Icon name="search" size={17} />
                <span>
                  {!hasSearched
                    ? 'Find the middle'
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
            onOpenDetails={openDetails}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        </section>
      </aside>

      <main className="map-wrap">
        <MapView
          locationA={locationA}
          locationB={locationB}
          midpoint={midpoint}
          radiusKm={radiusKm}
          places={places}
          selectedId={selectedId}
          onSelectPlace={setSelectedId}
          onOpenDetails={openDetails}
        />
        {midpoint && locationA && locationB && (
          <div
            className="map-insights"
            aria-label={`Each person travels about ${formatDistance(
              distanceMeters(locationA.location, midpoint),
            )}; the two locations are ${formatDistance(
              distanceMeters(locationA.location, locationB.location),
            )} apart.`}
          >
            <span className="map-insights-eyebrow">Even split</span>
            <span className="map-insights-figure">
              {formatDistance(distanceMeters(locationA.location, midpoint))}
              <span> each way</span>
            </span>
            <span className="map-insights-gap" aria-hidden="true">
              <span className="mi-dot mi-dot--a" />
              {formatDistance(
                distanceMeters(locationA.location, locationB.location),
              )}{' '}
              apart
              <span className="mi-dot mi-dot--b" />
            </span>
          </div>
        )}
      </main>

      <nav className="mobile-nav" aria-label="View switcher">
        <a
          className="mobile-home"
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          aria-label="Back to home"
        >
          <Icon name="brand" size={18} />
        </a>
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

      {/* Reuse the signature mark so the workspace still reads as the brand. */}
      <span className="finder-watermark" aria-hidden="true">
        <ConvergenceLine active={Boolean(midpoint)} compact />
      </span>

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
