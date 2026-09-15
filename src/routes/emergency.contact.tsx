import { createFileRoute } from "@tanstack/react-router";
import { PhoneCall } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { BigButton } from "@/components/BigButton";
import { Card } from "@/components/Card";

export const Route = createFileRoute("/emergency/contact")({
  head: () => ({
    meta: [
      { title: "Get Help — Old Touch" },
      {
        name: "description",
        content: "Contact your emergency contacts and local help services.",
      },
      { property: "og:title", content: "Get Help — Old Touch" },
      {
        property: "og:description",
        content: "Contact your emergency contacts and local help services.",
      },
    ],
  }),
  component: EmergencyContactScreen,
});

function EmergencyContactScreen() {
  return (
    <AppShell>
      <PageHeader title="Get Help" backTo="/emergency" />
      <main className="flex flex-col gap-4 p-5">
        <Card>
          <p className="text-xl font-bold text-foreground">
            Your emergency contacts will appear here.
          </p>
          <p className="mt-2 text-lg font-medium text-muted-foreground">
            Soon you will be able to call your family, doctor, or ambulance
            services directly from this screen.
          </p>
        </Card>
        <BigButton
          variant="emergency"
          icon={PhoneCall}
          label="Call Emergency Contact"
          description="Coming soon"
        />
      </main>
    </AppShell>
  );
}
