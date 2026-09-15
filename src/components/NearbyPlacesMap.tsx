import { useEffect, useRef, useState } from "react";
import { loadLeaflet } from "@/lib/openstreetmap";

export type NearbyCategory = {
  label: string;
  icon: string;
  tag: string;
};

export const NEARBY_CATEGORIES: NearbyCategory[] = [
  { label: "Hospitals", icon: "🏥", tag: "hospital" },
  { label: "Pharmacies", icon: "💊", tag: "pharmacy" },
  { label: "Restaurants", icon: "🍴", tag: "restaurant" },
  { label: "Community places", icon: "🏛️", tag: "community_centre" },
];

type PlaceResult = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

async function searchNearbyOverpass(tag: string, lat: number, lng: number): Promise<PlaceResult[]> {
  const query = `[out:json][timeout:12];(node[amenity=${tag}](around:5000,${lat},${lng});way[amenity=${tag}](around:5000,${lat},${lng}););out center tags;`;
  const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Nearby place search is busy. Please try again.");
  const data = await response.json();

  return (data.elements ?? []).slice(0, 12).map((item: any) => {
    const point = item.type === "node" ? { lat: item.lat, lng: item.lon } : { lat: item.center?.lat, lng: item.center?.lon };
    const tags = item.tags ?? {};
    return {
      name: tags.name ?? "Unnamed place",
      address: [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", ") || "Address unavailable",
      lat: Number(point.lat),
      lng: Number(point.lng),
    };
  }).filter((place: PlaceResult) => Number.isFinite(place.lat) && Number.isFinite(place.lng));
}

export function NearbyPlacesMap() {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);
  const [category, setCategory] = useState("hospital");
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const centerRef = useRef({ lat: 28.6139, lng: 77.209 });

  const searchNearby = async (nextCategory: string) => {
    setLoading(true);
    setMessage("");
    try {
      const nextPlaces = await searchNearbyOverpass(nextCategory, centerRef.current.lat, centerRef.current.lng);
      setPlaces(nextPlaces);
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      if (mapRef.current) {
        const L = window.L;
        nextPlaces.forEach((place) => {
          markerRefs.current.push(L.marker([place.lat, place.lng]).addTo(mapRef.current).bindPopup(place.name));
        });
      }
      if (!nextPlaces.length) setMessage("No nearby places found. Try another category.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load nearby places.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void loadLeaflet().then(async (L) => {
      if (cancelled || !mapElement.current) return;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 7000 });
        });
        centerRef.current = { lat: position.coords.latitude, lng: position.coords.longitude };
      } catch {
        // Delhi is only the initial fallback if location permission is denied.
      }
      if (cancelled) return;
      mapRef.current = L.map(mapElement.current, { gestureHandling: true }).setView([centerRef.current.lat, centerRef.current.lng], 14);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
      L.marker([centerRef.current.lat, centerRef.current.lng]).addTo(mapRef.current).bindPopup("You are here");
      await searchNearby(category);
    }).catch((error: Error) => {
      if (!cancelled) {
        setLoading(false);
        setMessage(error.message);
      }
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const chooseCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    void searchNearby(nextCategory);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {NEARBY_CATEGORIES.map((item) => (
          <button key={item.tag} type="button" onClick={() => chooseCategory(item.tag)} className={`rounded-2xl border-2 p-4 text-left text-lg font-extrabold ${category === item.tag ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
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
