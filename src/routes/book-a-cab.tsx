import { createFileRoute } from "@tanstack/react-router";
import { CarTaxiFront } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { FormField } from "@/components/FormField";
import { Card } from "@/components/Card";

export const Route = createFileRoute("/book-a-cab")({
  head: () => ({
    meta: [
      { title: "Book a Cab — Old Touch" },
      {
        name: "description",
        content: "Choose where you want to go and book a comfortable cab.",
      },
      { property: "og:title", content: "Book a Cab — Old Touch" },
      {
        property: "og:description",
        content: "Choose where you want to go and book a comfortable cab.",
      },
    ],
  }),
  component: BookCabScreen,
});

function BookCabScreen() {
  return (
    <AppShell>
      <PageHeader title="Book a Cab" subtitle="Choose where you want to go" />
      <main className="flex flex-1 flex-col gap-5 p-5">
        <FormField
          label="Destination"
          placeholder="e.g. Apollo Hospital, Sarita Vihar"
        />
        <button
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground active:opacity-90"
        >
          <CarTaxiFront className="h-8 w-8" strokeWidth={2.25} />
          Open Uber
        </button>
        <Card>
          <p className="text-base font-medium text-muted-foreground">
            Cab booking through Uber will be connected soon. You will be able to
            book a ride to your destination with one tap.
          </p>
        </Card>
      </main>
    </AppShell>
  );
}
