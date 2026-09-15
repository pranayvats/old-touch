import { createFileRoute } from "@tanstack/react-router";
import {
  Hospital,
  Pill,
  UtensilsCrossed,
  Landmark,
  CalendarDays,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { BigButton } from "@/components/BigButton";
import { Card } from "@/components/Card";

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
      <main className="flex flex-col gap-4 p-5">
        <BigButton icon={Hospital} label="Hospitals" />
        <BigButton icon={Pill} label="Pharmacies" />
        <BigButton icon={UtensilsCrossed} label="Restaurants" />
        <BigButton icon={Landmark} label="Community places" />
        <BigButton icon={CalendarDays} label="Events" />
        <Card>
          <p className="text-base font-medium text-muted-foreground">
            Live results from the map will appear here soon, based on your
            location.
          </p>
        </Card>
      </main>
    </AppShell>
  );
}
