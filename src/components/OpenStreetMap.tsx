import { useEffect, useRef, useState } from "react";
import { loadLeaflet, searchOpenStreetMap, type MapLocation } from "@/lib/openstreetmap";

interface OpenStreetMapProps {
  value?: MapLocation | null;
  onLocationChange?: (location: MapLocation) => void;
  height?: string;
}

export function OpenStreetMap({ value, onLocationChange, height = "360px" }: OpenStreetMapProps) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void loadLeaflet()
      .then((L) => {
        if (cancelled || !mapElement.current || mapRef.current) return;
        const fallback = { lat: 28.6139, lng: 77.209 };
        const center = value ? [value.lat, value.lng] : [fallback.lat, fallback.lng];

        const map = L.map(mapElement.current, { zoomControl: true, attributionControl: true }).setView(center, value ? 15 : 12);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        map.on("click", async (event: any) => {
          const location = { name: "Selected location", lat: event.latlng.lat, lng: event.latlng.lng };
          if (markerRef.current) markerRef.current.setLatLng([location.lat, location.lng]);
          else markerRef.current = L.marker([location.lat, location.lng]).addTo(map);
          onLocationChange?.(location);
        });

        if (value) {
          markerRef.current = L.marker([value.lat, value.lng]).addTo(map).bindPopup(value.name).openPopup();
        }
        mapRef.current = map;
      })
      .catch((mapError: Error) => {
        if (!cancelled) setError(mapError.message);
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !value) return;
    const position = [value.lat, value.lng];
    mapRef.current.setView(position, 16);
    if (!markerRef.current) markerRef.current = window.L.marker(position).addTo(mapRef.current);
    markerRef.current.setLatLng(position).bindPopup(value.name).openPopup();
  }, [value]);

  const choose = (location: MapLocation) => {
    setResults([]);
    setSearch(location.name);
    onLocationChange?.(location);
    if (mapRef.current) {
      mapRef.current.setView([location.lat, location.lng], 16);
      if (!markerRef.current) markerRef.current = window.L.marker([location.lat, location.lng]).addTo(mapRef.current);
      markerRef.current.setLatLng([location.lat, location.lng]).bindPopup(location.name).openPopup();
    }
  };

  const searchPlaces = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!search.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      setResults(await searchOpenStreetMap(search));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Place search failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={searchPlaces} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search for a place"
          className="min-w-0 flex-1 rounded-2xl border-2 border-input bg-card px-4 py-4 text-xl font-semibold text-foreground placeholder:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Search for a place"
        />
        <button type="submit" disabled={loading || !search.trim()} className="rounded-2xl bg-primary px-5 py-4 text-lg font-extrabold text-primary-foreground disabled:opacity-50">
          {loading ? "…" : "Search"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((result) => (
            <button key={`${result.lat}-${result.lng}`} type="button" onClick={() => choose(result)} className="rounded-2xl border-2 border-border bg-card p-4 text-left text-lg font-bold">
              {result.name}
            </button>
          ))}
        </div>
      )}

      {error && <p className="rounded-2xl bg-destructive/10 p-4 font-bold text-destructive">{error}</p>}
      <div ref={mapElement} className="w-full overflow-hidden rounded-3xl border-2 border-border" style={{ height }} aria-label="Choose a location on the map" />
      <p className="text-base font-medium text-muted-foreground">Search for a place, choose a result, or tap the map.</p>
    </div>
  );
}
