import { APIProvider } from '@vis.gl/react-google-maps';
import { Finder } from './components/Finder';
import { Landing } from './components/Landing';
import { Icon } from './components/Icon';
import { FinderProvider } from './state/FinderContext';
import { useHashRoute } from './hooks/useHashRoute';
import './App.css';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

/** Picks the screen for the current hash route. */
function Root() {
  const { route } = useHashRoute();
  return route === '/app' ? <Finder /> : <Landing />;
}

/** Shown when no Maps key is configured, so the app explains itself rather
    than crashing. */
function MissingKey() {
  return (
    <div className="setup-screen">
      <div className="setup-card">
        <span className="setup-mark">
          <Icon name="key" size={22} />
        </span>
        <h1>One key away</h1>
        <p>
          Meet in the Middle runs on the Google Maps Platform. Add your key to a{' '}
          <code>.env</code> file in the project root:
        </p>
        <pre>VITE_GOOGLE_MAPS_API_KEY=your_key_here</pre>
        <p>
          Enable the <strong>Maps JavaScript API</strong>,{' '}
          <strong>Places API</strong> and <strong>Geocoding API</strong> in the
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
      <FinderProvider>
        <Root />
      </FinderProvider>
    </APIProvider>
  );
}
