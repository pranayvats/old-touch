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
    let settled = false;
    const finish = (callback: (value: any) => void, value: any) => {
      if (settled) return;
      settled = true;
      callback(value);
    };

    const timer = window.setTimeout(() => {
      finish(reject, new Error("The map library is taking too long to load. Check your internet connection and press Update."));
    }, 10000);

    if (!document.getElementById(LEAFLET_STYLE_ID)) {
      const link = document.createElement("link");
      link.id = LEAFLET_STYLE_ID;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const handleLoad = () => {
      window.clearTimeout(timer);
      if (window.L) finish(resolve, window.L);
      else finish(reject, new Error("The map library loaded but was not initialized."));
    };
    const handleError = () => {
      window.clearTimeout(timer);
      finish(reject, new Error("The map library could not load. Check your internet connection and press Update."));
    };

    const existing = document.getElementById(LEAFLET_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", handleLoad, { once: true });
      existing.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = LEAFLET_SCRIPT_ID;
    script.async = true;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = handleLoad;
    script.onerror = handleError;
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
