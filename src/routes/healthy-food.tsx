import { createFileRoute } from "@tanstack/react-router";
import { Star, MapPin, Phone, Navigation } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

export const Route = createFileRoute("/healthy-food")({
  head: () => ({
    meta: [
      { title: "Healthy Food — Old Touch" },
      {
        name: "description",
        content: "Find healthy restaurants near you with directions and calling.",
      },
      { property: "og:title", content: "Healthy Food — Old Touch" },
      {
        property: "og:description",
        content: "Find healthy restaurants near you with directions and calling.",
      },
    ],
  }),
  component: HealthyFoodScreen,
});

const restaurants = [
  { name: "Sattvik Bhojanalaya", distance: "0.8 km", rating: 4.5, open: true },
  { name: "Green Bowl Cafe", distance: "1.2 km", rating: 4.2, open: true },
  { name: "Annapurna Kitchen", distance: "2.0 km", rating: 4.6, open: false },
] as const;

function HealthyFoodScreen() {
  return (
    <AppShell>
      <PageHeader title="Healthy Food" subtitle="Restaurants near you" />
      <main className="flex flex-col gap-4 p-5">
        {restaurants.map((r) => (
          <Card key={r.name}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xl font-extrabold text-foreground">{r.name}</p>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                  r.open
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {r.open ? "Open" : "Closed"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-lg font-semibold text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-5 w-5" /> {r.distance}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-5 w-5" /> {r.rating}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background px-4 py-3 text-lg font-bold text-foreground active:bg-accent"
              >
                <Navigation className="h-5 w-5" /> Directions
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background px-4 py-3 text-lg font-bold text-foreground active:bg-accent"
              >
                <Phone className="h-5 w-5" /> Call
              </button>
            </div>
          </Card>
        ))}
        <p className="text-center text-base font-medium text-muted-foreground">
          Example results — live nearby search is coming soon.
        </p>
      </main>
    </AppShell>
  );
}
