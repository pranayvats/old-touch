import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FormField } from "@/components/FormField";

export const Route = createFileRoute("/setup")({
  component: SetupScreen,
});

function SetupScreen() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const finish = () => {
    localStorage.setItem("old-touch-setup-complete", "true");
    navigate({ to: "/" });
  };

  return (
    <AppShell>
      <main className="flex flex-1 flex-col p-6 pt-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black">A few things first</h1>
          <p className="mt-2 text-lg font-semibold text-muted-foreground">These help Old Touch show useful local information and make it easier to get help.</p>
        </div>

        <div className="flex flex-col gap-5">
          <FormField label="Your town or city" placeholder="e.g. New Delhi" value={city} onChange={setCity} />
          <FormField label="Emergency contact" placeholder="Name or mobile number" optional value={emergencyContact} onChange={setEmergencyContact} />
          <p className="text-base font-medium text-muted-foreground">You can add or change emergency contacts later.</p>
        </div>

        <button type="button" onClick={finish} disabled={!city.trim()} className="mt-auto w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
          Finish Setup
        </button>
      </main>
    </AppShell>
  );
}
