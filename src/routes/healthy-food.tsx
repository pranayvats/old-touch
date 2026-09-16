import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { MapPin, Phone, Navigation, RefreshCw, Leaf } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import {
  RESTAURANT_FILTERS,
  describeLocationError,
  directionsLink,
  formatDistance,
  getCurrentPosition,
  searchNearby,
  type NearbyPlace,
} from "@/lib/nearby";

export const Route = createFileRoute("/healthy-food")({
  head: () => ({
    meta: [
      { title: "Healthy Food — Old Touch" },
      {
        name: "description",
        content: "Find real restaurants near you with distance, directions and phone numbers.",
      },
      { property: "og:title", content: "Healthy Food — Old Touch" },
      {
        property: "og:description",
        content: "Find real restaurants near you with distance, directions and phone numbers.",
      },
    ],
  }),
  component: HealthyFoodScreen,
});

function HealthyFoodScreen() {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Finding your location…");
  const [error, setError] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    setError("");
    setStatus("Finding your location…");
    try {
      const position = await getCurrentPosition();
      setStatus("Looking for restaurants near you…");
      const center = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      const results = await searchNearby(RESTAURANT_FILTERS, center);
      setPlaces(results.slice(0, 25));
    } catch (searchError) {
      setPlaces([]);
      setError(describeLocationError(searchError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void search();
  }, [search]);

  const shown = vegOnly ? places.filter((place) => place.vegetarian) : places;

  return (
    <AppShell>
      <PageHeader title="Healthy Food" subtitle="Real restaurants near you" />
      <main className="flex flex-col gap-4 p-5">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setVegOnly((value) => !value)}
            aria-pressed={vegOnly}
            className={`flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl border-2 px-4 text-lg font-extrabold ${
              vegOnly ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"
            }`}
          >
            <Leaf className="h-6 w-6" aria-hidden="true" /> Vegetarian
          </button>
          <button
            type="button"
            onClick={() => void search()}
            disabled={loading}
            className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-lg font-extrabold text-primary-foreground disabled:opacity-50"
          >
            <RefreshCw className="h-6 w-6" aria-hidden="true" /> Try again
          </button>
        </div>

        <p aria-live="polite" className="sr-only">
          {loading ? status : error || `${shown.length} restaurants found`}
        </p>

        {loading && (
          <Card>
            <p className="text-lg font-bold">{status}</p>
          </Card>
        )}

        {!loading && error && (
          <div className="rounded-3xl border-2 border-destructive bg-destructive/10 p-5">
            <p className="text-lg font-bold text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && shown.length === 0 && (
          <Card>
            <p className="text-lg font-semibold">
              No restaurants are listed near you on the free community map.
            </p>
            <p className="mt-1 text-base font-medium text-muted-foreground">
              {vegOnly
                ? "Turn off the Vegetarian filter to see all nearby places."
                : "Press Try again, or check back later."}
            </p>
          </Card>
        )}

        {!loading &&
          shown.map((place) => (
            <Card key={place.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-xl font-extrabold text-foreground">{place.name}</p>
                {place.openNow !== null && (
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                      place.openNow
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {place.openNow ? "Open now" : "Closed now"}
                  </span>
                )}
              </div>

              <p className="mt-1 text-base font-medium text-muted-foreground">
                {place.address}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-lg font-semibold text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-5 w-5" aria-hidden="true" />{" "}
                  {formatDistance(place.distanceKm)}
                </span>
                {place.cuisine && <span className="capitalize">{place.cuisine}</span>}
              </div>

              <div className={`mt-4 grid gap-3 ${place.phone ? "grid-cols-2" : "grid-cols-1"}`}>
                <a
                  href={directionsLink(place)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-lg font-bold text-primary-foreground"
                >
                  <Navigation className="h-5 w-5" aria-hidden="true" /> Directions
                </a>
                {place.phone && (
                  <a
                    href={`tel:${place.phone.replace(/[^\d+]/g, "")}`}
                    className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background px-4 text-lg font-bold text-foreground"
                  >
                    <Phone className="h-5 w-5" aria-hidden="true" /> Call
                  </a>
                )}
              </div>
            </Card>
          ))}

        <p className="text-sm font-medium text-muted-foreground">
          Place information © OpenStreetMap contributors.
        </p>
      </main>
    </AppShell>
  );
}
