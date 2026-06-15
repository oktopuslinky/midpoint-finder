# 🧭 Meet in the Middle

A React app that helps **two people find things to do halfway between them**.
Enter two locations, pick what you're in the mood for, and the app finds the
geographic midpoint and surfaces nearby restaurants, cafés, parks, museums and
more — on a live, modern map.

Built with **React + TypeScript + Vite** and the **Google Maps JavaScript API**
(Maps, Places, and Geocoding) via [`@vis.gl/react-google-maps`](https://visgl.github.io/react-google-maps/).

## Features

- 📍 **Two-location input** with Google Places autocomplete
- ➗ **Great-circle midpoint** calculation (accurate, not a naive average)
- 🍽️ **Category filters** — restaurants, cafés, bars, parks, museums, cinemas, shopping, attractions, nightlife, gyms
- 🎚️ **Adjustable search radius** (1–50 km)
- 🗺️ **Interactive map** with A/B/midpoint markers and clickable place pins
- ⭐ **Rich result cards** — photo, rating, price level, open/closed, distance from midpoint, and a one-tap **Directions** link
- 📱 **Responsive, modern dark UI**

## Prerequisites

A Google Maps Platform API key with these APIs enabled in the
[Google Cloud Console](https://console.cloud.google.com/):

- **Maps JavaScript API**
- **Places API**
- **Geocoding API**

> 💡 Restrict the key by **HTTP referrer** (e.g. `http://localhost:5173/*`) so it
> can't be abused. Billing must be enabled — Google offers a generous free tier.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure your API key
cp .env.example .env
#   then edit .env and set VITE_GOOGLE_MAPS_API_KEY=your_key

# 3. Run the dev server
npm run dev
```

Open the printed URL (default `http://localhost:5173`). If no key is configured,
the app shows a setup screen instead of crashing.

### Environment variables

| Variable                    | Required | Description                                                        |
| --------------------------- | -------- | ------------------------------------------------------------------ |
| `VITE_GOOGLE_MAPS_API_KEY`  | ✅       | Your Google Maps Platform API key.                                 |
| `VITE_GOOGLE_MAPS_MAP_ID`   | ➖       | Optional Map ID for Advanced Markers / cloud styling. Defaults to `DEMO_MAP_ID`. |

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
npm run lint     # run ESLint
```

## How it works

1. Each user picks a location through a **Places Autocomplete** input, which
   returns coordinates directly.
2. The app computes the **great-circle midpoint** of the two points
   (`src/lib/geo.ts`).
3. A **Places nearby search** (`src/hooks/useNearbyPlaces.ts`) queries that
   midpoint for the selected category within the chosen radius.
4. Results render as cards in the sidebar and as pins on the map; selecting one
   highlights it in both places and opens an info window.

## Project structure

```
src/
├── App.tsx                  # layout + state, wraps everything in <APIProvider>
├── types.ts                 # shared TypeScript types
├── lib/geo.ts               # midpoint, distance, category definitions
├── hooks/useNearbyPlaces.ts # Places nearby-search hook
└── components/
    ├── LocationInput.tsx     # autocomplete input
    ├── MapView.tsx           # map + markers + info window
    └── ResultsPanel.tsx      # results list / states
```

## Notes

- This is a fully **client-side** app — no backend. The API key ships in the
  client bundle, so HTTP-referrer restriction in Google Cloud is important.
- The Places nearby search uses the Maps JS `PlacesService`. You may see
  deprecation notices in the console as Google migrates to the newer `Place`
  class; functionality is unaffected.
