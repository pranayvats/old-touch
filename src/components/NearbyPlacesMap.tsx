import { useEffect, useRef, useState } from "react";
import { loadLeaflet } from "@/lib/openstreetmap";

export type NearbyCategory = { label: string; icon: string; tag: string };
export const NEARBY_CATEGORIES: NearbyCategory[] = [
  { label: "Hospitals", icon: "🏥", tag: "hospital" },
  { label: "Pharmacies", icon: "💊", tag: "pharmacy" },
  { label: "Restaurants", icon: "🍴", tag: "restaurant" },
  { label: "Community places", icon: "🏛️", tag: "community_centre" },
];

type PlaceResult = { name: string; address: string; lat: number; lng: number };

type Coordinates = { lat: number; lng: number };

async function searchNearbyOverpass(tag: string, { lat, lng }: Coordinates): Promise<PlaceResult[]> {
  const query = `[out:json][timeout:20];(node[amenity=${tag}](around:5000,${lat},${lng});way[amenity=${tag}](around:5000,${lat},${lng});relation[amenity=${tag}](around:5000,${lat},${lng}););out center tags;`;
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  let lastError: unknown;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Nearby search server is busy.");
      const data = await response.json();
      return (data.elements ?? []).map((item: any) => {
        const point = item.type === "node" ? { lat: item.lat, lng: item.lon } : { lat: item.center?.lat, lng: item.center?.lon };
        const tags = item.tags ?? {};
        return {
          name: tags.name ?? "Unnamed place",
          address: [tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"], tags["addr:city"]].filter(Boolean).join(", ") || "Address unavailable",
          lat: Number(point.lat), lng: Number(point.lng),
        };
      }).filter((place: PlaceResult) => Number.isFinite(place.lat) && Number.isFinite(place.lng)).slice(0, 20);
    } catch (error) { lastError = error; }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not load nearby places.");
}

export function NearbyPlacesMap() {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);
  const centerRef = useRef<Coordinates | null>(null);
  const [category, setCategory] = useState("hospital");
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [locationLabel, setLocationLabel] = useState("Finding your location…");

  const searchNearby = async (nextCategory: string) => {
    const center = centerRef.current;
    if (!center) return;
    setLoading(true); setMessage("");
    try {
      const nextPlaces = await searchNearbyOverpass(nextCategory, center);
      setPlaces(nextPlaces);
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      if (mapRef.current) {
        const L = window.L;
        nextPlaces.forEach((place) => markerRefs.current.push(L.marker([place.lat, place.lng]).addTo(mapRef.current).bindPopup(place.name)));
      }
      if (!nextPlaces.length) setMessage("No mapped places found within 5 km. Try another category or move the map.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load nearby places."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let cancelled = false;
    void loadLeaflet().then(async (L) => {
      if (cancelled || !mapElement.current) return;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error("Location is not supported by this device."));
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
        });
        if (position.coords.accuracy > 1000) throw new Error("Location accuracy is too low. Please enable precise location and try again.");
        centerRef.current = { lat: position.coords.latitude, lng: position.coords.longitude };
        setLocationLabel(`Your location (±${Math.round(position.coords.accuracy)} m)`);
      } catch {
        centerRef.current = null;
        setLocationLabel("Location permission is needed to find places near you.");
        setLoading(false);
        setMessage("Please allow location access in your browser, then refresh the page.");
        return;
      }
      if (cancelled || !centerRef.current) return;
      mapRef.current = L.map(mapElement.current, { zoomControl: true }).setView([centerRef.current.lat, centerRef.current.lng], 15);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(mapRef.current);
      L.marker([centerRef.current.lat, centerRef.current.lng]).addTo(mapRef.current).bindPopup("You are here");
      await searchNearby(category);
    }).catch((error: Error) => { if (!cancelled) { setLoading(false); setMessage(error.message); } });
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-muted p-4 text-base font-bold">📍 {locationLabel}</p>
      <div className="grid grid-cols-2 gap-3">
        {NEARBY_CATEGORIES.map((item) => (
          <button key={item.tag} type="button" onClick={() => { setCategory(item.tag); void searchNearby(item.tag); }} className={`rounded-2xl border-2 p-4 text-left text-lg font-extrabold ${category === item.tag ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
            <span className="mr-2 text-2xl" aria-hidden="true">{item.icon}</span>{item.label}
          </button>
        ))}
      </div>
      <div ref={mapElement} className="h-[360px] w-full overflow-hidden rounded-3xl border-2 border-border" />
      {loading && <p className="rounded-2xl bg-muted p-4 text-lg font-bold">Finding places near you…</p>}
      {message && !loading && <p className="rounded-2xl bg-muted p-4 text-lg font-bold">{message}</p>}
      <div className="space-y-3">
        {places.map((place) => (
          <div key={`${place.lat}-${place.lng}-${place.name}`} className="rounded-3xl border-2 border-border bg-card p-5 shadow-sm">
            <h3 className="text-xl font-black">{place.name}</h3>
            <p className="mt-1 text-base font-medium text-muted-foreground">{place.address}</p>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-2xl bg-primary px-5 py-3 text-lg font-extrabold text-primary-foreground">Directions</a>
          </div>
        ))}
      </div>
      <p className="text-sm font-medium text-muted-foreground">Map data © OpenStreetMap contributors.</p>
    </div>
  );
}
