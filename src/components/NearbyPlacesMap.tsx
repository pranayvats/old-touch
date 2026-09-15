import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

export type NearbyCategory = {
  label: string;
  icon: string;
  type: string;
};

export const NEARBY_CATEGORIES: NearbyCategory[] = [
  { label: "Hospitals", icon: "🏥", type: "hospital" },
  { label: "Pharmacies", icon: "💊", type: "pharmacy" },
  { label: "Restaurants", icon: "🍴", type: "restaurant" },
  { label: "Community places", icon: "🏛️", type: "community_center" },
];

type PlaceResult = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  mapsUri: string;
};

export function NearbyPlacesMap() {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);
  const [category, setCategory] = useState("hospital");
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const searchNearby = async (nextCategory: string, center?: { lat: number; lng: number }) => {
    if (!window.google?.maps || !mapRef.current) return;
    setLoading(true);
    setMessage("");

    try {
      const [{ Place, SearchNearbyRankPreference }, { AdvancedMarkerElement }] = await Promise.all([
        window.google.maps.importLibrary("places"),
        window.google.maps.importLibrary("marker"),
      ]);
      const mapCenter = center ?? mapRef.current.getCenter();
      const request = {
        fields: ["displayName", "location", "formattedAddress", "googleMapsURI"],
        locationRestriction: { center: mapCenter, radius: 5000 },
        includedPrimaryTypes: [nextCategory],
        maxResultCount: 10,
        rankPreference: SearchNearbyRankPreference.DISTANCE,
      };
      const response = await Place.searchNearby(request);

      markerRefs.current.forEach((marker) => { marker.map = null; });
      markerRefs.current = [];

      const nextPlaces: PlaceResult[] = [];
      for (const place of response.places ?? []) {
        if (!place.location) continue;
        const lat = place.location.lat();
        const lng = place.location.lng();
        nextPlaces.push({
          name: place.displayName ?? "Unnamed place",
          address: place.formattedAddress ?? "Address unavailable",
          lat,
          lng,
          mapsUri: place.googleMapsURI ?? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        });
        markerRefs.current.push(new AdvancedMarkerElement({
          map: mapRef.current,
          position: { lat, lng },
          title: place.displayName ?? "Place",
        }));
      }
      setPlaces(nextPlaces);
      if (!nextPlaces.length) setMessage("No nearby places found. Try another category.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load nearby places.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void loadGoogleMaps().then(async (google) => {
      if (cancelled || !mapElement.current) return;
      let center = { lat: 28.6139, lng: 77.2090 };
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 7000 });
        });
        center = { lat: position.coords.latitude, lng: position.coords.longitude };
      } catch {
        // Delhi is only the initial fallback; the user can still move the map.
      }
      if (cancelled) return;
      mapRef.current = new google.maps.Map(mapElement.current, {
        center,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
      });
      await searchNearby(category, center);
    }).catch((error: Error) => {
      if (!cancelled) {
        setLoading(false);
        setMessage(error.message);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const chooseCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    void searchNearby(nextCategory);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {NEARBY_CATEGORIES.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => chooseCategory(item.type)}
            className={`rounded-2xl border-2 p-4 text-left text-lg font-extrabold ${category === item.type ? "border-primary bg-primary/10" : "border-border bg-card"}`}
          >
            <span className="mr-2 text-2xl" aria-hidden="true">{item.icon}</span>
            {item.label}
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
            <a
              href={place.mapsUri}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-2xl bg-primary px-5 py-3 text-lg font-extrabold text-primary-foreground"
            >
              Directions
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
