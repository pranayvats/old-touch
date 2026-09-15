import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarPlus,
  CarTaxiFront,
  Salad,
  Users,
  MapPin,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Old Touch — Stay Connected, Stay Safe" },
      {
        name: "description",
        content:
          "A simple, friendly app for older adults: emergency help, host events, local community, nearby places, healthy food, and cab booking.",
      },
      {
        property: "og:title",
        content: "Old Touch — Stay Connected, Stay Safe",
      },
      {
        property: "og:description",
        content:
          "A simple, friendly app for older adults: emergency help, host events, local community, nearby places, healthy food, and cab booking.",
      },
    ],
  }),
  component: HomeScreen,
});

function HomeScreen() {
  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Old Touch
        </h1>
        <p className="mt-1 text-lg font-semibold text-muted-foreground">
          Namaste! What would you like to do?
        </p>
      </header>

      <main className="flex flex-col gap-4 p-5">
        <BigButton
          variant="emergency"
          icon={AlertTriangle}
          label="EMERGENCY"
          description="Get help quickly"
          to="/emergency"
        />
        <BigButton
          icon={CalendarPlus}
          label="HOST AN EVENT"
          description="Plan a get-together"
          to="/host-event"
        />
        <BigButton
          icon={Users}
          label="MY COMMUNITY"
          description="News from people near you"
          to="/community"
        />
        <BigButton
          icon={MapPin}
          label="NEAR ME"
          description="Hospitals, pharmacies & more"
          to="/near-me"
        />
        <BigButton
          icon={Salad}
          label="HEALTHY FOOD"
          description="Good restaurants nearby"
          to="/healthy-food"
        />
        <BigButton
          icon={CarTaxiFront}
          label="BOOK A CAB"
          description="Go anywhere comfortably"
          to="/book-a-cab"
        />
      </main>
    </AppShell>
  );
}
