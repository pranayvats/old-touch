import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CarTaxiFront } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { FormField } from "@/components/FormField";
import { Card } from "@/components/Card";

export const Route = createFileRoute("/book-a-cab")({
  head: () => ({
    meta: [
      { title: "Book a Cab — Old Touch" },
      { name: "description", content: "Choose where you want to go and book a comfortable cab." },
      { property: "og:title", content: "Book a Cab — Old Touch" },
      { property: "og:description", content: "Choose where you want to go and book a comfortable cab." },
    ],
  }),
  component: BookCabScreen,
});

function BookCabScreen() {
  const [destination, setDestination] = useState("");
  const [error, setError] = useState("");

  const openUber = () => {
    const value = destination.trim();
    if (!value) {
      setError("Enter your destination first.");
      return;
    }
    setError("");
    const url = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(value)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <AppShell>
      <PageHeader title="Book a Cab" subtitle="Choose where you want to go" />
      <main className="flex flex-1 flex-col gap-5 p-5">
        <FormField label="Destination" placeholder="e.g. Apollo Hospital, Sarita Vihar" value={destination} onChange={setDestination} />
        {error && <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
        <button type="button" onClick={openUber} disabled={!destination.trim()} className="flex w-full items-center justify-center gap-3 rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground disabled:opacity-50">
          <CarTaxiFront className="h-8 w-8" strokeWidth={2.25} /> Open Uber
        </button>
        <Card><p className="text-base font-medium text-muted-foreground">Old Touch will open Uber with your destination filled in. Final booking and pricing are handled by Uber.</p></Card>
      </main>
    </AppShell>
  );
}
