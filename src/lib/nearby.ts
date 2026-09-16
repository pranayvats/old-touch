/**
 * Shared "places near me" helpers built on free OpenStreetMap services
 * (Overpass for places, Nominatim for addresses). No paid map APIs.
 *
 * Used by the Healthy Food screen and available to any other screen that
 * needs nearby places.
 */

export type Coordinates = { lat: number; lng: number };

export type NearbyPlace = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** Straight-line distance in kilometres from the search centre. */
  distanceKm: number;
  /** Only set when OpenStreetMap actually lists a phone number. */
  phone: string | null;
  /** Raw opening_hours value, when listed. */
  openingHours: string | null;
  /** true / false when we can tell confidently, otherwise null. */
  openNow: boolean | null;
  /** e.g. "Indian, vegetarian" when listed. */
  cuisine: string | null;
  vegetarian: boolean;
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export async function fetchWithTimeout(url: string, ms = 12000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

/** Asks the browser for the current position with a friendly timeout. */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("This device cannot share your location."));
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: (value: any) => void, value: unknown) => {
      if (settled) return;
      settled = true;
      callback(value);
    };
    const timer = window.setTimeout(
      () =>
        finish(
          reject,
          new Error(
            "Finding your location is taking too long. Check your location permission and press Try again.",
          ),
        ),
      9000,
    );
    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timer);
        finish(resolve, position);
      },
      (error) => {
        window.clearTimeout(timer);
        finish(reject, error);
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 8000 },
    );
  });
}

/** Turns any location failure into a sentence an older adult can act on. */
export function describeLocationError(error: unknown): string {
  if (
    typeof GeolocationPositionError !== "undefined" &&
    error instanceof GeolocationPositionError
  ) {
    if (error.code === error.PERMISSION_DENIED) {
      return "Old Touch does not have permission to see your location. Allow location in your phone or browser settings, then press Try again.";
    }
    if (error.code === error.POSITION_UNAVAILABLE) {
      return "Your location could not be found. Turn on location (GPS) and press Try again.";
    }
    return "Finding your location took too long. Press Try again.";
  }
  return error instanceof Error
    ? error.message
    : "Your location could not be found.";
}

/** Distance in kilometres between two points. */
export function distanceKm(a: Coordinates, b: Coordinates) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * earth * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number) {
  if (!Number.isFinite(km)) return "";
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Deliberately conservative opening_hours reader. It understands the common
 * "Mo-Sa 09:00-22:00" style and "24/7". Anything else returns null so the
 * screen simply says nothing rather than guessing wrongly.
 */
export function isOpenNow(value: string | null, now = new Date()): boolean | null {
  if (!value) return null;
  const text = value.trim();
  if (!text) return null;
  if (/^24\/7$/i.test(text)) return true;
  if (/(PH|SH|sunrise|sunset|week|easter|off|closed)/i.test(text)) return null;

  const todayIndex = now.getDay();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  let sawUsableRule = false;

  for (const rule of text.split(";")) {
    const part = rule.trim();
    if (!part) continue;
    const match = part.match(
      /^(?:((?:[A-Za-z]{2}(?:-[A-Za-z]{2})?)(?:,[A-Za-z]{2}(?:-[A-Za-z]{2})?)*)\s+)?((?:\d{2}:\d{2}-\d{2}:\d{2})(?:,\d{2}:\d{2}-\d{2}:\d{2})*)$/,
    );
    if (!match) return null;
    sawUsableRule = true;
    const [, daysPart, timesPart] = match;
    if (daysPart && !dayMatches(daysPart, todayIndex)) continue;
    for (const span of (timesPart ?? "").split(",")) {
      const [from, to] = span.split("-");
      const start = toMinutes(from);
      const end = toMinutes(to);
      if (start === null || end === null) return null;
      if (end <= start) {
        // Crosses midnight, e.g. 18:00-02:00
        if (minutesNow >= start || minutesNow < end) return true;
      } else if (minutesNow >= start && minutesNow < end) {
        return true;
      }
    }
  }

  return sawUsableRule ? false : null;
}

function dayMatches(daysPart: string, todayIndex: number) {
  return daysPart.split(",").some((token) => {
    const [fromDay, toDay] = token.split("-");
    const from = DAYS.indexOf(normalizeDay(fromDay));
    if (from < 0) return false;
    if (!toDay) return from === todayIndex;
    const to = DAYS.indexOf(normalizeDay(toDay));
    if (to < 0) return false;
    if (from <= to) return todayIndex >= from && todayIndex <= to;
    return todayIndex >= from || todayIndex <= to;
  });
}

function normalizeDay(value: string | undefined) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.charAt(1).toLowerCase();
}

function toMinutes(value: string | undefined) {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return (h as number) * 60 + (m as number);
}

function buildQuery(filters: string[], center: Coordinates, radiusMetres: number) {
  const body = filters
    .map((filter) => `${filter}(around:${radiusMetres},${center.lat},${center.lng});`)
    .join("");
  return `[out:json][timeout:15];(${body});out center tags;`;
}

async function queryEndpoint(
  endpoint: string,
  query: string,
  center: Coordinates,
): Promise<NearbyPlace[]> {
  const response = await fetchWithTimeout(
    `${endpoint}?data=${encodeURIComponent(query)}`,
    14000,
  );
  if (!response.ok) throw new Error(`Nearby search returned ${response.status}.`);
  const data = await response.json();
  const seen = new Set<string>();

  return ((data.elements ?? []) as any[])
    .map((item): NearbyPlace | null => {
      const point =
        item.type === "node"
          ? { lat: item.lat, lng: item.lon }
          : { lat: item.center?.lat, lng: item.center?.lon };
      if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null;

      const tags = (item.tags ?? {}) as Record<string, string>;
      const name = tags["name"];
      if (!name) return null;

      const address =
        [
          tags["addr:housenumber"],
          tags["addr:street"],
          tags["addr:suburb"],
          tags["addr:city"],
          tags["addr:state"],
        ]
          .filter(Boolean)
          .join(", ") || "Address not listed";

      const rawPhone = tags["phone"] ?? tags["contact:phone"] ?? null;
      const phone = rawPhone ? rawPhone.split(";")[0]!.trim() : null;
      const openingHours = tags["opening_hours"] ?? null;
      const cuisine = tags["cuisine"] ? tags["cuisine"].replace(/[_;]/g, " ") : null;

      const place: NearbyPlace = {
        id: `${item.type}-${item.id}`,
        name,
        address,
        lat: Number(point.lat),
        lng: Number(point.lng),
        distanceKm: distanceKm(center, {
          lat: Number(point.lat),
          lng: Number(point.lng),
        }),
        phone: phone && phone.length >= 5 ? phone : null,
        openingHours,
        openNow: isOpenNow(openingHours),
        cuisine,
        vegetarian:
          tags["diet:vegetarian"] === "yes" ||
          tags["diet:vegetarian"] === "only" ||
          tags["diet:vegan"] === "yes" ||
          /veg/i.test(cuisine ?? ""),
      };
      return place;
    })
    .filter((place): place is NearbyPlace => {
      if (!place) return false;
      const key = `${place.name}|${place.lat.toFixed(4)}|${place.lng.toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Runs one Overpass search across mirrors; the first healthy mirror wins. */
export async function searchNearby(
  filters: string[],
  center: Coordinates,
  radiusMetres = 4000,
): Promise<NearbyPlace[]> {
  const query = buildQuery(filters, center, radiusMetres);
  try {
    return await Promise.any(
      OVERPASS_ENDPOINTS.map((endpoint) => queryEndpoint(endpoint, query, center)),
    );
  } catch {
    throw new Error(
      "Nearby places are not available right now. Please press Try again in a moment.",
    );
  }
}

export const RESTAURANT_FILTERS = [
  "node[amenity=restaurant]",
  "way[amenity=restaurant]",
  "node[amenity=cafe]",
  "way[amenity=cafe]",
  "node[amenity=fast_food][cuisine~\"indian|vegetarian|vegan|salad|juice\",i]",
];

export function directionsLink(place: { lat: number; lng: number; name: string }) {
  return `https://www.openstreetmap.org/directions?to=${place.lat}%2C${place.lng}`;
}
