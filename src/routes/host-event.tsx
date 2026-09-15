import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { FormField } from "@/components/FormField";

export const Route = createFileRoute("/host-event")({
  head: () => ({
    meta: [
      { title: "Host an Event — Old Touch" },
      {
        name: "description",
        content: "Plan a get-together with people in your community.",
      },
      { property: "og:title", content: "Host an Event — Old Touch" },
      {
        property: "og:description",
        content: "Plan a get-together with people in your community.",
      },
    ],
  }),
  component: NameEventScreen,
});

function NameEventScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  return (
    <AppShell>
      <PageHeader title="Name the Event" />
      <main className="flex flex-1 flex-col gap-6 p-5">
        <FormField
          label="What is your event called?"
          placeholder="Meet up at 7 pm on 17th September"
          value={name}
          onChange={setName}
        />
        <p className="text-lg font-medium text-muted-foreground">
          Tip: you can write it in your own words, like “chai meetup tomorrow
          morning”.
        </p>
        <button
          type="button"
          onClick={() =>
            navigate({ to: "/host-event/details", search: { name } })
          }
          className="mt-auto flex w-full items-center justify-center gap-3 rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground active:opacity-90"
        >
          Next
          <ArrowRight className="h-8 w-8" strokeWidth={2.5} />
        </button>
      </main>
    </AppShell>
  );
}
