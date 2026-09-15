import { createFileRoute } from "@tanstack/react-router";
import {
  HeartPulse,
  PersonStanding,
  Activity,
  Wind,
  Bandage,
  CircleHelp,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { BigButton } from "@/components/BigButton";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency — Old Touch" },
      {
        name: "description",
        content: "Tell us what is wrong so we can get help to you quickly.",
      },
      { property: "og:title", content: "Emergency — Old Touch" },
      {
        property: "og:description",
        content: "Tell us what is wrong so we can get help to you quickly.",
      },
    ],
  }),
  component: EmergencyScreen,
});

const options = [
  { icon: HeartPulse, label: "Heart problem" },
  { icon: PersonStanding, label: "Fainted" },
  { icon: Activity, label: "Severe pain" },
  { icon: Wind, label: "Breathing problem" },
  { icon: Bandage, label: "Injury" },
  { icon: CircleHelp, label: "Other" },
] as const;

function EmergencyScreen() {
  return (
    <AppShell>
      <PageHeader title="Emergency" subtitle="What is wrong?" />
      <main className="flex flex-col gap-4 p-5">
        {options.map((option) => (
          <BigButton
            key={option.label}
            icon={option.icon}
            label={option.label}
            to="/emergency/contact"
          />
        ))}
      </main>
    </AppShell>
  );
}
