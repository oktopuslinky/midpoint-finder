import { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import type { UserLocation } from '../types';

interface LocationInputProps {
  label: string;
  badge: string;
  accent: string;
  placeholder: string;
  value: UserLocation | null;
  onSelect: (location: UserLocation | null) => void;
}

/**
 * A text input wired to a Google Places Autocomplete widget. When the user
 * picks a suggestion, the resolved address + coordinates bubble up via
 * `onSelect`.
 */
export function LocationInput({
  label,
  badge,
  accent,
  placeholder,
  value,
  onSelect,
}: LocationInputProps) {
  const placesLib = useMapsLibrary('places');
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      fields: ['geometry', 'formatted_address', 'name'],
    });
    autocompleteRef.current = autocomplete;

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const loc = place.geometry?.location;
      if (!loc) return;
      onSelect({
        address: place.formatted_address || place.name || '',
        location: { lat: loc.lat(), lng: loc.lng() },
      });
    });

    return () => listener.remove();
    // onSelect is stable (defined with useCallback in the parent).
  }, [placesLib, onSelect]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          address: 'Current location',
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        };
        if (inputRef.current) inputRef.current.value = 'Current location';
        onSelect(location);
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          alert('Location access was denied. Please enable location permissions in your browser settings.');
        } else if (error.code === error.TIMEOUT) {
          alert('Location request timed out. Please try again.');
        } else {
          alert('Unable to retrieve your location. Please try again or enter a location manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="location-input">
      <span className="location-badge" style={{ background: accent }}>
        {badge}
      </span>
      <div className="location-field">
        <label>{label}</label>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          defaultValue={value?.address ?? ''}
          aria-label={label}
        />
      </div>
      <button
        type="button"
        className={`location-clear ${gettingLocation ? 'location-clear--loading' : ''}`}
        aria-label={`Clear ${label}`}
        onClick={() => {
          if (inputRef.current) inputRef.current.value = '';
          onSelect(null);
        }}
        disabled={gettingLocation || !value}
      >
        {gettingLocation ? (
          <span className="location-clear-spinner" aria-hidden="true"></span>
        ) : value ? (
          '✕'
        ) : null}
      </button>
      {!value && !gettingLocation && (
        <button
          type="button"
          className="location-current"
          aria-label="Use my current location"
          onClick={handleCurrentLocation}
          disabled={gettingLocation}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
          </svg>
          <span className="location-current-text">My Location</span>
        </button>
      )}
    </div>
  );
}
