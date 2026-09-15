const LEAFLET_SCRIPT_ID = "old-touch-leaflet-js";
const LEAFLET_STYLE_ID = "old-touch-leaflet-css";

export type MapLocation = {
  name: string;
  lat: number;
  lng: number;
};

declare global {
  interface Window {
    L?: any;
  }
}

let loadPromise: Promise<any> | null = null;

export function loadLeaflet(): Promise<any> {
  if (window.L) return Promise.resolve(window.L);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (!document.getElementById(LEAFLET_STYLE_ID)) {
      const link = document.createElement("link");
      link.id = LEAFLET_STYLE_ID;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const existing = document.getElementById(LEAFLET_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L));
      existing.addEventListener("error", () => reject(new Error("The map library could not load.")));
      return;
    }

    const script = document.createElement("script");
    script.id = LEAFLET_SCRIPT_ID;
    script.async = true;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("The map library could not load."));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export async function searchOpenStreetMap(query: string): Promise<MapLocation[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(trimmed)}`,
    { headers: { Accept: "application/json" } },
  );

  if (!response.ok) throw new Error("Place search failed. Please try again.");
  const results = await response.json();
  return results.map((item: any) => ({
    name: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
  }));
}

export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
}
