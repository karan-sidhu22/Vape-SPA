// app/components/AddressAutocomplete.jsx
"use client";

import { useEffect, useRef } from "react";

export default function AddressAutocomplete({ value, onChange }) {
  const inputRef = useRef(null);

  useEffect(() => {
    // wait for Google Maps to load
    if (!window.google?.maps?.places) return;
    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { types: ["address"] }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        onChange(place.formatted_address, place);
      }
    });
  }, []);

  return (
    <div>
      <label htmlFor="address" className="block mb-1 font-medium text-white">
        Address
      </label>
      <input
        id="address"
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing your address…"
        className="w-full px-4 py-2 bg-white/10 text-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
      />
    </div>
  );
}
