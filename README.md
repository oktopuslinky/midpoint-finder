# 🧭 Meet in the Middle

A React app that helps **two people find the fair, halfway place to meet**.
Enter two locations, pick what you're in the mood for, and the app finds the
true geographic midpoint and surfaces nearby restaurants, cafés, parks, museums
and more — on a live, custom-styled map.

Built with **React + TypeScript + Vite** and the **Google Maps JavaScript API**
(Maps, Places, and Geocoding) via [`@vis.gl/react-google-maps`](https://visgl.github.io/react-google-maps/).

The interface is an **"Editorial Atlas"** design: a warm-paper, ink-on-cream
look with a coral / teal / brass duotone that encodes the product's job — Person
A (coral) and Person B (teal) meeting at the brass midpoint.

## Features

- 🏠 **Marketing landing page** (`#/`) with a live hero — the location inputs are
  real, and one tap drops you into the finder with results already loading
- 📍 **Two-location input** with Google Places autocomplete and "use my location"
- ➗ **Great-circle midpoint** calculation (accurate, not a naive average)
- 🍽️ **Category filters** — restaurants, cafés, bars, parks, museums, cinemas,
  shopping, attractions, nightlife, gyms
- 🎚️ **Adjustable search radius** (1–50 km) that refilters results instantly
- 🗺️ **Custom-styled interactive map** with coral/teal/brass A·B·midpoint markers
  and clickable place pins kept in sync with the list
- ⭐ **Rich result cards & detail modal** — photos, rating, price level,
  open/closed, opening hours, reviews, distance from midpoint, and one-tap
  **Directions** to Google or Apple Maps
- ✨ **Premium, responsive editorial UI** with a Fraunces / Inter / Space Mono
  type system, light/keyboard-accessible, reduced-motion aware

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

| Variable                   | Required | Description                          |
| -------------------------- | -------- | ------------------------------------ |
| `VITE_GOOGLE_MAPS_API_KEY` | ✅       | Your Google Maps Platform API key.   |

> The map's "Editorial Atlas" styling is applied client-side via an inline
> [JSON style](https://developers.google.com/maps/documentation/javascript/style-reference),
> so **no cloud Map ID is required** — the app stays a zero-config static bundle.

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
npm run lint     # run ESLint
```

## How it works

1. The **landing page** (`#/`) introduces the product; its hero inputs share
   state with the finder, so entering both locations and pressing
   **"Find the middle"** routes to the finder (`#/app`) with the search already
   committed. Routing is a tiny built-in hash router — no extra dependency.
2. Each user picks a location through a **Places Autocomplete** input, which
   returns coordinates directly.
3. The app computes the **great-circle midpoint** of the two points
   (`src/lib/geo.ts`).
4. A **Places nearby search** (`src/hooks/useNearbyPlaces.ts`) queries that
   midpoint for the selected category within the chosen radius.
5. Results render as cards in the sidebar and as pins on the **custom-styled
   map**; selecting one highlights it in both places and opens an info window.
   Opening a card fetches richer **place details** (`src/hooks/usePlaceDetails.ts`)
   — hours, reviews, photos — in a modal.

## Project structure

```
src/
├── App.tsx                       # hash-route root: APIProvider → FinderProvider → Landing/Finder
├── index.css                     # design tokens (the "Editorial Atlas" theme)
├── App.css                       # finder + shared component styles
├── Landing.css                   # landing page styles
├── types.ts                      # shared TypeScript types
├── lib/geo.ts                    # midpoint, distance, category definitions
├── hooks/
│   ├── useHashRoute.ts           # dependency-free hash router
│   ├── useNearbyPlaces.ts        # Places nearby-search hook
│   └── usePlaceDetails.ts        # lazy place-details hook
├── state/
│   └── FinderContext.tsx         # shared search state (locations, category, radius, results)
└── components/
    ├── Landing.tsx               # marketing front door with a live hero
    ├── Finder.tsx                # the finder workspace (panel + results + map)
    ├── ConvergenceLine.tsx       # the signature A · ★ · B mark
    ├── LocationInput.tsx         # autocomplete input
    ├── MapView.tsx               # custom-styled map + SVG markers + info window
    ├── ResultsPanel.tsx          # results list / states
    ├── PlaceDetailsModal.tsx     # full detail card (photos, hours, reviews)
    └── Icon.tsx                  # single-source Lucide icon registry
```

## Notes

- This is a fully **client-side** app — no backend. The API key ships in the
  client bundle, so HTTP-referrer restriction in Google Cloud is important.
- The map uses inline JSON styling, which requires the classic raster map and
  legacy `Marker`/`PlacesService`. You may see deprecation notices in the console
  as Google migrates to the newer `Place` / `PlaceAutocompleteElement` /
  Advanced Markers APIs; functionality is unaffected.
