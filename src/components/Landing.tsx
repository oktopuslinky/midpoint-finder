import { useState } from 'react';
import { LocationInput } from './LocationInput';
import { ConvergenceLine } from './ConvergenceLine';
import { Icon, type IconName } from './Icon';
import { useFinder } from '../state/FinderContext';
import { useHashRoute } from '../hooks/useHashRoute';
import { CATEGORIES } from '../lib/geo';
import '../Landing.css';

const STEPS: { n: string; icon: IconName; title: string; body: string }[] = [
  {
    n: '01',
    icon: 'pin',
    title: 'Drop two pins',
    body: 'Type where each person is starting from — autocomplete does the rest, or tap to use your current location.',
  },
  {
    n: '02',
    icon: 'compass',
    title: 'Find the true middle',
    body: 'We compute the great-circle midpoint: the real halfway point on a sphere, not a naive average that drifts over distance.',
  },
  {
    n: '03',
    icon: 'star',
    title: 'Pick your spot',
    body: 'Browse rated, photographed places around the midpoint — open hours, reviews, and one-tap directions for both of you.',
  },
];

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'compass',
    title: 'Great-circle midpoint',
    body: 'A genuinely fair halfway point, accurate even across long distances and time zones — never a lopsided average.',
  },
  {
    icon: 'grid',
    title: 'Ten everyday categories',
    body: 'Restaurants, cafés, bars, parks, museums, cinemas, shopping, attractions, nightlife and gyms.',
  },
  {
    icon: 'radius',
    title: 'Adjustable radius',
    body: 'Tighten or widen the search from 1 to 50 km. Results refilter instantly as you drag — no waiting.',
  },
  {
    icon: 'building',
    title: 'Rich place cards',
    body: 'Photos, ratings, price, open or closed right now, opening hours, recent reviews and editorial blurbs.',
  },
  {
    icon: 'map',
    title: 'A live, synced map',
    body: 'A, B and midpoint markers with clickable pins that stay in lockstep with the list as you browse.',
  },
  {
    icon: 'directions',
    title: 'One-tap directions',
    body: 'Hand off straight to Google or Apple Maps for whoever is heading out the door first.',
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Do I need an account?',
    a: 'No. There is nothing to sign up for — open it, enter two locations and search.',
  },
  {
    q: 'Is it free?',
    a: 'Yes. The whole thing runs in your browser on top of the Google Maps Platform.',
  },
  {
    q: 'How accurate is the midpoint?',
    a: 'It is the great-circle midpoint — the true halfway point on the globe — rather than an averaged guess that drifts as the two points get further apart.',
  },
  {
    q: 'Do you track my location?',
    a: 'Only if you tap “use my current location”. Everything happens client-side; your locations are used to look up places and nothing more.',
  },
  {
    q: 'What kinds of places can it find?',
    a: 'Ten everyday categories, from restaurants and cafés to parks, museums, cinemas and gyms — whatever the two of you are in the mood for.',
  },
  {
    q: 'Can I get directions?',
    a: 'Every place links straight out to Google Maps or Apple Maps, so each person can navigate from their own side.',
  },
];

const STATS = [
  { value: '10', label: 'categories' },
  { value: '1–50', label: 'km radius' },
  { value: 'Great-circle', label: 'accuracy' },
  { value: 'No', label: 'sign-up' },
];

/**
 * The marketing front door. Its hero is the real product — the A/B location
 * inputs are live, and "Find the middle" commits the search and drops the user
 * straight into the finder. Everything below sells the idea without burying the
 * tool: how it works, what it does, and honest answers.
 */
export function Landing() {
  const { navigate } = useHashRoute();
  const {
    locationA,
    locationB,
    midpoint,
    canSearch,
    selectA,
    selectB,
    commitSearch,
  } = useFinder();
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const launch = () => {
    if (canSearch) commitSearch();
    navigate('/app');
  };

  return (
    <div className="landing">
      {/* ---------- Top bar ---------- */}
      <header className="lnav">
        <a className="lnav-brand" href="#/" aria-label="Meet in the Middle">
          <span className="brand-mark">
            <Icon name="brand" size={20} />
          </span>
          <span className="lnav-name">Meet in the Middle</span>
        </a>
        <nav className="lnav-links" aria-label="Sections">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#faq">FAQ</a>
        </nav>
        <button type="button" className="lnav-cta" onClick={() => navigate('/app')}>
          Open the app
          <Icon name="chevronRight" size={15} />
        </button>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="eyebrow-rule" /> The fair meeting point
          </span>
          <h1 className="hero-title">
            Meet exactly
            <br />
            in the <em>middle</em>.
          </h1>
          <p className="hero-sub">
            Two people, two locations, one fair place to land. Drop both pins and
            we find the true geographic midpoint — then the best restaurants,
            cafés, parks and more right around it.
          </p>

          <div className="hero-form">
            <div className="hero-inputs">
              <LocationInput
                label="First location"
                badge="A"
                accent="var(--coral)"
                placeholder="Where's the first person?"
                value={locationA}
                onSelect={selectA}
              />
              <LocationInput
                label="Second location"
                badge="B"
                accent="var(--teal)"
                placeholder="And the second?"
                value={locationB}
                onSelect={selectB}
              />
            </div>

            <ConvergenceLine active={Boolean(midpoint)} className="hero-converge" />

            <button
              type="button"
              className="btn btn--primary btn--lg hero-go"
              onClick={launch}
            >
              <Icon name="search" size={18} />
              {canSearch ? 'Find the middle' : 'Open the app'}
            </button>
            <p className="hero-note">
              {midpoint ? (
                <>
                  <Icon name="star" filled size={13} /> Midpoint found — let's see
                  what's there.
                </>
              ) : (
                'No account. Nothing to install. Works right in your browser.'
              )}
            </p>
          </div>
        </div>

        {/* The signature hero composition — a stylised postcard of the job:
            A and B joined by a dashed great-circle arc meeting at the star. */}
        <div className="hero-art" aria-hidden="true">
          <div className="postcard">
            <div className="postcard-grid" />
            <svg className="postcard-arc" viewBox="0 0 320 240" fill="none">
              <path
                d="M44 196 Q160 36 276 92"
                stroke="url(#meet)"
                strokeWidth="2.5"
                strokeDasharray="6 7"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="meet" x1="44" y1="196" x2="276" y2="92">
                  <stop offset="0" stopColor="var(--coral)" />
                  <stop offset="0.5" stopColor="var(--gold)" />
                  <stop offset="1" stopColor="var(--teal)" />
                </linearGradient>
              </defs>
            </svg>
            <span className="pin pin--a">A</span>
            <span className="pin pin--b">B</span>
            <span className="pin pin--mid">
              <Icon name="star" filled size={16} />
            </span>

            <div className="postcard-card">
              <div className="postcard-thumb">
                <Icon name="cafe" size={20} />
              </div>
              <div className="postcard-card-body">
                <strong>Café Mercer</strong>
                <span className="postcard-meta">
                  <span className="postcard-star">
                    <Icon name="star" filled size={11} /> 4.6
                  </span>
                  <span className="postcard-open">Open now</span>
                  <span className="postcard-dist">0.3 km from middle</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Stats strip ---------- */}
      <section className="stats" aria-label="At a glance">
        {STATS.map((s) => (
          <div className="stat" key={s.label}>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ---------- How it works ---------- */}
      <section className="section how" id="how">
        <div className="section-head">
          <span className="eyebrow">
            <span className="eyebrow-rule" /> How it works
          </span>
          <h2 className="section-title">Three steps to a fair meeting spot.</h2>
        </div>
        <ol className="steps">
          {STEPS.map((s) => (
            <li className="step" key={s.n}>
              <span className="step-n">{s.n}</span>
              <span className="step-icon">
                <Icon name={s.icon} size={22} />
              </span>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-body">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Categories showcase ---------- */}
      <section className="categories-band">
        <p className="categories-lead">Whatever the two of you are in the mood for —</p>
        <ul className="categories-row">
          {CATEGORIES.map((c) => (
            <li className="cat-chip" key={c.id}>
              <Icon name={c.id as IconName} size={15} />
              {c.label}
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Features ---------- */}
      <section className="section features" id="features">
        <div className="section-head">
          <span className="eyebrow">
            <span className="eyebrow-rule" /> What's inside
          </span>
          <h2 className="section-title">
            Everything you need to decide and go.
          </h2>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <article className="feature" key={f.title}>
              <span className="feature-icon">
                <Icon name={f.icon} size={20} />
              </span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-body">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Manifesto pull-quote (the one aesthetic risk) ---------- */}
      <section className="manifesto">
        <ConvergenceLine active className="manifesto-mark" />
        <blockquote className="manifesto-quote">
          “Let's meet in the middle” shouldn't mean{' '}
          <em>one person always travels further.</em>
        </blockquote>
        <p className="manifesto-sub">
          The midpoint is the small, quiet act of fairness most map apps never
          bother to compute. We made the whole product about it.
        </p>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="section faq" id="faq">
        <div className="section-head">
          <span className="eyebrow">
            <span className="eyebrow-rule" /> Good to know
          </span>
          <h2 className="section-title">Questions, answered.</h2>
        </div>
        <ul className="faq-list">
          {FAQS.map((f, i) => {
            const open = faqOpen === i;
            return (
              <li className={open ? 'faq-item faq-item--open' : 'faq-item'} key={f.q}>
                <button
                  type="button"
                  className="faq-q"
                  aria-expanded={open}
                  onClick={() => setFaqOpen(open ? null : i)}
                >
                  <span>{f.q}</span>
                  <Icon
                    name="chevronDown"
                    size={17}
                    className={open ? 'chevron' : 'chevron chevron--closed'}
                  />
                </button>
                {open && <p className="faq-a">{f.a}</p>}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="cta-band">
        <h2 className="cta-title">Stop negotiating over where to meet.</h2>
        <p className="cta-sub">
          Find the spot that's fair to both of you — in about ten seconds.
        </p>
        <button type="button" className="btn btn--primary btn--lg" onClick={launch}>
          <Icon name="search" size={18} />
          {canSearch ? 'Find the middle' : 'Open the app'}
        </button>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="lfooter">
        <div className="lfooter-brand">
          <span className="brand-mark">
            <Icon name="brand" size={18} />
          </span>
          <span>Meet in the Middle</span>
        </div>
        <nav className="lfooter-links" aria-label="Footer">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#faq">FAQ</a>
          <a href="#/app" onClick={(e) => { e.preventDefault(); navigate('/app'); }}>
            Open the app
          </a>
        </nav>
        <p className="lfooter-fine">
          Built with the Google Maps Platform. © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
