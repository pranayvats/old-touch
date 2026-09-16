import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import {
  HeartPulse,
  PersonStanding,
  Activity,
  Wind,
  Bandage,
  CircleHelp,
  PhoneCall,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { BigButton } from "@/components/BigButton";
import type { EmergencyReason } from "@/lib/emergency";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency — Old Touch" },
      {
        name: "description",
        content: "Call 112 straight away or tell us what is wrong to get help.",
      },
      { property: "og:title", content: "Emergency — Old Touch" },
      {
        property: "og:description",
        content: "Call 112 straight away or tell us what is wrong to get help.",
      },
    ],
  }),
  component: EmergencyScreen,
});

const options: { icon: typeof HeartPulse; label: EmergencyReason }[] = [
  { icon: HeartPulse, label: "Heart problem" },
  { icon: PersonStanding, label: "Fainted" },
  { icon: Activity, label: "Severe pain" },
  { icon: Wind, label: "Breathing problem" },
  { icon: Bandage, label: "Injury" },
  { icon: CircleHelp, label: "Other" },
];

function EmergencyScreen() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // This route is also the parent of /emergency/contact and
  // /emergency/contacts, so render the child screen in place.
  if (pathname !== "/emergency") return <Outlet />;

  return (
    <AppShell>
      <PageHeader title="Emergency" subtitle="What is wrong?" />
      <main className="flex flex-col gap-4 p-5">
        <a
          href="tel:112"
          className="flex w-full items-center justify-center gap-3 rounded-3xl bg-red-600 px-6 py-6 text-3xl font-black text-white shadow-md active:opacity-90"
        >
          <PhoneCall className="h-9 w-9" strokeWidth={2.5} aria-hidden="true" />
          Call 112
        </a>
        <p className="text-base font-semibold text-muted-foreground">
          112 is India’s emergency number. Tap it any time — you do not need to
          choose anything first.
        </p>

        <h2 className="mt-2 text-xl font-black">Or tell us what is wrong</h2>
        {options.map((option) => (
          <BigButton
            key={option.label}
            icon={option.icon}
            label={option.label}
            onClick={() =>
              navigate({
                to: "/emergency/contact",
                search: { reason: option.label },
              })
            }
          />
        ))}

        <Link
          to="/emergency/contacts"
          className="mt-2 flex items-center justify-center gap-3 rounded-3xl border-2 border-border bg-card px-5 py-4 text-lg font-extrabold text-foreground active:bg-accent"
        >
          <Users className="h-6 w-6" aria-hidden="true" /> Manage my emergency
          contacts
        </Link>
      </main>
    </AppShell>
  );
}
