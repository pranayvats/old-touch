import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, type GoogleMapLocation } from "@/lib/google-maps";

interface GoogleMapProps {
  value?: GoogleMapLocation | null;
  onLocationChange?: (location: GoogleMapLocation) => void;
  height?: string;
}

export function GoogleMap({ value, onLocationChange, height = "360px" }: GoogleMapProps) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const searchElement = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapElement.current) return;

        const fallback = { lat: 28.6139, lng: 77.2090 };
        const center = value ? { lat: value.lat, lng: value.lng } : fallback;

        mapRef.current = new google.maps.Map(mapElement.current, {
          center,
          zoom: value ? 15 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
        });
        geocoderRef.current = new google.maps.Geocoder();

        if (value) {
          markerRef.current = new google.maps.Marker({
            position: center,
            map: mapRef.current,
            title: value.name,
          });
        }

        mapRef.current.addListener("click", (event: any) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          setMarker({ lat, lng }, "Selected location");
          geocoderRef.current.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
            const name = status === "OK" && results?.[0]?.formatted_address
              ? results[0].formatted_address
              : "Selected location";
            onLocationChange?.({ name, lat, lng });
          });
        });

        if (searchElement.current && google.maps.places?.Autocomplete) {
          const autocomplete = new google.maps.places.Autocomplete(searchElement.current, {
            fields: ["formatted_address", "geometry", "name"],
          });
          autocomplete.bindTo("bounds", mapRef.current);
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry?.location) return;
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const name = place.formatted_address || place.name || "Selected location";
            mapRef.current.setCenter({ lat, lng });
            mapRef.current.setZoom(16);
            setMarker({ lat, lng }, name);
            onLocationChange?.({ name, lat, lng });
          });
        }
      })
      .catch((mapsError: Error) => {
        if (!cancelled) setError(mapsError.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !value) return;
    const position = { lat: value.lat, lng: value.lng };
    mapRef.current.setCenter(position);
    mapRef.current.setZoom(16);
    setMarker(position, value.name);
  }, [value]);

  const setMarker = (position: { lat: number; lng: number }, title: string) => {
    if (!mapRef.current || !window.google?.maps) return;
    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({ position, map: mapRef.current, title });
    } else {
      markerRef.current.setPosition(position);
      markerRef.current.setTitle(title);
    }
  };

  if (error) {
    return (
      <div className="rounded-3xl border-2 border-border bg-muted p-5 text-lg font-bold">
        {error} Add <span className="font-black">VITE_GOOGLE_MAPS_API_KEY</span> in Vercel and refresh the app.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={searchElement}
        type="text"
        placeholder="Search for a place"
        className="w-full rounded-2xl border-2 border-input bg-card px-4 py-4 text-xl font-semibold text-foreground placeholder:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Search for a place"
      />
      <div ref={mapElement} className="w-full overflow-hidden rounded-3xl border-2 border-border" style={{ height }} aria-label="Choose a location on the map" />
      <p className="text-base font-medium text-muted-foreground">Search for a place, or tap the map to choose the exact location.</p>
    </div>
  );
}
