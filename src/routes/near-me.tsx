import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { NearbyPlacesMap } from "@/components/NearbyPlacesMap";
import { supabase } from "@/lib/supabase";

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

type CommunityEvent = {
  id: string;
  name: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location_name: string;
  host?: { full_name: string; city: string | null } | null;
};

function NearMeScreen() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [eventError, setEventError] = useState("");

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id,name,description,starts_at,ends_at,location_name,host:profiles!events_host_id_fkey(full_name,city)")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(10);

      if (error) {
        setEventError("Community events could not be loaded right now.");
        return;
      }
      setEvents((data ?? []) as unknown as CommunityEvent[]);
    })();
  }, []);

  return (
    <AppShell>
      <PageHeader title="Near Me" subtitle="Useful places and events around you" />
      <main className="flex flex-col gap-5 p-5">
        <NearbyPlacesMap />

        <section className="space-y-3" aria-labelledby="community-events-heading">
          <div>
            <h2 id="community-events-heading" className="flex items-center gap-2 text-2xl font-black">
              <CalendarDays className="h-7 w-7" /> Community events
            </h2>
            <p className="mt-1 text-base font-medium text-muted-foreground">
              Upcoming events hosted by people on Old Touch.
            </p>
          </div>

          {eventError && <Card><p className="text-base font-bold text-destructive">{eventError}</p></Card>}
          {!eventError && events.length === 0 && (
            <Card>
              <p className="text-lg font-semibold">No upcoming community events yet.</p>
              <p className="mt-1 text-base font-medium text-muted-foreground">Host an event and it will appear here.</p>
            </Card>
          )}

          {events.map((event) => (
            <Card key={event.id}>
              <h3 className="text-xl font-black">{event.name}</h3>
              <p className="mt-1 text-base font-bold">Hosted by {event.host?.full_name || "Community member"}</p>
              <p className="mt-3 flex items-center gap-2 text-base font-semibold">
                <CalendarDays className="h-5 w-5 shrink-0" />
                {formatEventDate(event.starts_at, event.ends_at)}
              </p>
              <p className="mt-1 flex items-center gap-2 text-base font-semibold">
                <MapPin className="h-5 w-5 shrink-0" />
                {event.location_name}
              </p>
              {event.description && <p className="mt-2 text-base leading-relaxed">{event.description}</p>}
              {event.host?.city && <p className="mt-2 text-sm font-semibold text-muted-foreground">{event.host.city}</p>}
            </Card>
          ))}
        </section>
      </main>
    </AppShell>
  );
}

function formatEventDate(startsAt: string, endsAt: string | null) {
  const start = new Date(startsAt);
  const date = start.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  const startTime = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (!endsAt) return `${date} · ${startTime}`;
  const end = new Date(endsAt);
  const endTime = end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} · ${startTime}–${endTime}`;
}
