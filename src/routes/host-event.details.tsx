import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { FormField } from "@/components/FormField";
import { Card } from "@/components/Card";

export const Route = createFileRoute("/host-event/details")({
  validateSearch: (search: Record<string, unknown>) => ({
    name: typeof search["name"] === "string" ? search["name"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Event Details — Old Touch" },
      {
        name: "description",
        content: "Add the details for your event and invite people.",
      },
      { property: "og:title", content: "Event Details — Old Touch" },
      {
        property: "og:description",
        content: "Add the details for your event and invite people.",
      },
    ],
  }),
  component: EventDetailsScreen,
});

function EventDetailsScreen() {
  const { name } = Route.useSearch();
  const [eventName, setEventName] = useState(name);

  return (
    <AppShell>
      <PageHeader title="Event Details" backTo="/host-event" />
      <main className="flex flex-1 flex-col gap-5 p-5">
        <FormField
          label="Event name"
          placeholder="Evening walk together"
          value={eventName}
          onChange={setEventName}
        />
        <FormField
          label="Description"
          placeholder="Tell people what the event is about"
          optional
          multiline
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date" type="date" />
          <div className="space-y-5">
            <FormField label="Start time" type="time" />
          </div>
        </div>
        <FormField label="End time" type="time" />
        <FormField label="Location" placeholder="Community hall, Sector 12" />
        <FormField label="Invite people" placeholder="Names or phone numbers" />

        <button
          type="button"
          className="mt-2 w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground active:opacity-90"
        >
          Create Event
        </button>
        <Card>
          <p className="text-base font-medium text-muted-foreground">
            Your event will be shared with your community once created. (Event
            saving will be added soon.)
          </p>
        </Card>
      </main>
    </AppShell>
  );
}
