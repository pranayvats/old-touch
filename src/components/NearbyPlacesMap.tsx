import { useEffect, useRef, useState } from "react";
import { loadLeaflet } from "@/lib/openstreetmap";

export type NearbyCategory = { label: string; icon: string; tag: string };
export const NEARBY_CATEGORIES: NearbyCategory[] = [
  { label: "Hospitals", icon: "🏥", tag: "hospital" },
  { label: "Pharmacies", icon: "💊", tag: "pharmacy" },
  { label: "Restaurants", icon: "🍴", tag: "restaurant" },
  { label: "Community places", icon: "🏛️", tag: "community" },
];

type PlaceResult = { name: string; address: string; lat: number; lng: number };
type Coordinates = { lat: number; lng: number };

function buildOverpassQuery(tag: string, { lat, lng }: Coordinates) {
  const filters = {
    hospital: ["node[amenity=hospital]", "way[amenity=hospital]", "relation[amenity=hospital]", "node[healthcare=hospital]", "way[healthcare=hospital]", "relation[healthcare=hospital]"],
    pharmacy: ["node[amenity=pharmacy]", "way[amenity=pharmacy]", "relation[amenity=pharmacy]"],
    restaurant: ["node[amenity=restaurant]", "way[amenity=restaurant]", "relation[amenity=restaurant]", "node[amenity=fast_food]", "way[amenity=fast_food]"],
    community: ["node[amenity=community_centre]", "way[amenity=community_centre]", "relation[amenity=community_centre]", "node[leisure=community_centre]", "way[leisure=community_centre]", "node[amenity=social_centre]", "way[amenity=social_centre]"],
  }[tag] ?? [];
  return `[out:json][timeout:15];(${filters.map((filter) => `${filter}(around:7000,${lat},${lng});`).join("")});out center tags;`;
}

async function fetchWithTimeout(url: string, ms = 8000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

async function searchNearbyOverpass(tag: string, center: Coordinates): Promise<PlaceResult[]> {
  const query = buildOverpassQuery(tag, center);
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
  ];
  let lastError: unknown;
  for (const endpoint of endpoints) {
    try {
      const response = await fetchWithTimeout(`${endpoint}?data=${encodeURIComponent(query)}`, 8000);
      if (!response.ok) throw new Error("Nearby search server is busy.");
      const data = await response.json();
      const seen = new Set<string>();
      return (data.elements ?? []).map((item: any) => {
        const point = item.type === "node" ? { lat: item.lat, lng: item.lon } : { lat: item.center?.lat, lng: item.center?.lon };
        const tags = item.tags ?? {};
        const address = [
          tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"],
          tags["addr:city"], tags["addr:district"], tags["addr:state"], tags["addr:postcode"],
        ].filter(Boolean).join(", ");
        return {
          name: tags.name ?? "Unnamed place",
          address: address || "Address not listed on OpenStreetMap",
          lat: Number(point.lat),
          lng: Number(point.lng),
        };
      }).filter((place: PlaceResult) => {
        if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return false;
        const key = `${place.name}|${place.lat.toFixed(5)}|${place.lng.toFixed(5)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 30);
    } catch (error) { lastError = error; }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not load nearby places. Check your internet connection and press Update.");
}

async function reverseGeocode(center: Coordinates): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(center.lat)}&lon=${encodeURIComponent(center.lng)}&zoom=18&addressdetails=1`;
  const response = await fetchWithTimeout(url, 8000);
  if (!response.ok) throw new Error("Could not find the address for your location.");
  const data = await response.json();
  return data.display_name || "Your current location";
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  if (!navigator.geolocation) return Promise.reject(new Error("Location is not supported by this device."));
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: (value: GeolocationPosition | GeolocationPositionError) => void, value: GeolocationPosition | GeolocationPositionError) => {
      if (settled) return;
      settled = true;
      callback(value);
    };
    const timer = window.setTimeout(() => {
      finish(reject, new Error("Location lookup is taking too long. Check your browser's location permission and press Update."));
    }, 10000);
    navigator.geolocation.getCurrentPosition(
      (position) => { window.clearTimeout(timer); finish(resolve, position); },
      (error) => { window.clearTimeout(timer); finish(reject, error); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 9000 },
    );
  });
}

export function NearbyPlacesMap() {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);
  const centerRef = useRef<Coordinates | null>(null);
  const [category, setCategory] = useState("hospital");
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");
  const [locationLabel, setLocationLabel] = useState("Getting your location…");

  const searchNearby = async (nextCategory: string, center = centerRef.current) => {
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
      if (!nextPlaces.length) setMessage("No mapped places found within 7 km of your location.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load nearby places."); }
    finally { setLoading(false); }
  };

  const locateAndSearch = async (nextCategory = category) => {
    setLocating(true); setLoading(true); setMessage("");
    try {
      const position = await getCurrentPosition();
      const accuracy = position.coords.accuracy;
      if (!Number.isFinite(accuracy) || accuracy > 1000) throw new Error(`Your device only provided an approximate location (±${Math.round(accuracy)} m). Turn on precise location and try again.`);
      const center = { lat: position.coords.latitude, lng: position.coords.longitude };
      centerRef.current = center;
      setLocationLabel(`Your location (±${Math.round(accuracy)} m)`);
      if (mapRef.current) mapRef.current.setView([center.lat, center.lng], 15);
      void reverseGeocode(center).then((address) => setLocationLabel(address)).catch(() => {});
      await searchNearby(nextCategory, center);
    } catch (error) {
      setLoading(false);
      setMessage(error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED ? "Location access is blocked. Allow location access for Old Touch and press Update." : error instanceof Error ? error.message : "Could not get your location.");
    } finally { setLocating(false); }
  };

  useEffect(() => {
    let cancelled = false;
    void loadLeaflet().then(async (L) => {
      if (cancelled || !mapElement.current) return;
      mapRef.current = L.map(mapElement.current, { zoomControl: true });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(mapRef.current);
      await locateAndSearch("hospital");
    }).catch((error: Error) => { if (!cancelled) { setLoading(false); setMessage(error.message || "The map could not load. Press Update to try again."); } });
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-muted p-4">
        <span className="text-xl" aria-hidden="true">📍</span>
        <p className="flex-1 text-base font-bold">{locationLabel}</p>
        <button type="button" onClick={() => void locateAndSearch()} disabled={locating} className="rounded-xl bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground disabled:opacity-50">{locating ? "Locating…" : "Update"}</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {NEARBY_CATEGORIES.map((item) => (
          <button key={item.tag} type="button" onClick={() => { setCategory(item.tag); void searchNearby(item.tag); }} className={`rounded-2xl border-2 p-4 text-left text-lg font-extrabold ${category === item.tag ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
            <span className="mr-2 text-2xl" aria-hidden="true">{item.icon}</span>{item.label}
          </button>
        ))}
      </div>
      <div ref={mapElement} className="h-[360px] w-full overflow-hidden rounded-3xl border-2 border-border" />
      {loading && <p className="rounded-2xl bg-muted p-4 text-lg font-bold">{locating ? "Getting your location…" : "Finding places near you…"}</p>}
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
