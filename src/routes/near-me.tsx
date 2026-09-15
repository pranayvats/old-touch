import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { NearbyPlacesMap } from "@/components/NearbyPlacesMap";

export const Route = createFileRoute("/near-me")({
  head: () => ({
    meta: [
      { title: "Near Me — Old Touch" },
      {
        name: "description",
        content:
          "Find hospitals, pharmacies, restaurants, community places and events near you.",
      },
      { property: "og:title", content: "Near Me — Old Touch" },
      {
        property: "og:description",
        content:
          "Find hospitals, pharmacies, restaurants, community places and events near you.",
      },
    ],
  }),
  component: NearMeScreen,
});

function NearMeScreen() {
  return (
    <AppShell>
      <PageHeader title="Near Me" subtitle="Useful places around you" />
      <main className="flex flex-col gap-5 p-5">
        <NearbyPlacesMap />
        <Card>
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-1 h-7 w-7 shrink-0" />
            <div>
              <p className="text-lg font-black">Community events</p>
              <p className="mt-1 text-base font-medium text-muted-foreground">
                Events hosted on Old Touch will appear here next, alongside nearby places.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </AppShell>
  );
}
