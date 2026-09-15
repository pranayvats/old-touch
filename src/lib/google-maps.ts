const GOOGLE_MAPS_SCRIPT_ID = "old-touch-google-maps";

let loadPromise: Promise<typeof window.google> | null = null;

declare global {
  interface Window {
    google?: any;
  }
}

export function loadGoogleMaps(): Promise<typeof window.google> {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (loadPromise) return loadPromise;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps is not configured yet."));
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", () => reject(new Error("Google Maps could not load.")));
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Google Maps could not load."));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export type GoogleMapLocation = {
  name: string;
  lat: number;
  lng: number;
};
