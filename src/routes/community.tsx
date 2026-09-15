import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "My Community — Old Touch" },
      {
        name: "description",
        content: "News and posts from people in your local community.",
      },
      { property: "og:title", content: "My Community — Old Touch" },
      {
        property: "og:description",
        content: "News and posts from people in your local community.",
      },
    ],
  }),
  component: CommunityScreen,
});

const posts = [
  {
    community: "Green Park Senior Group",
    person: "Kamala Sharma",
    text: "Morning walk at the park tomorrow at 6:30 am. Everyone is welcome!",
    time: "Today, 5:10 pm",
  },
  {
    community: "Green Park Senior Group",
    person: "Rajesh Verma",
    text: "Free health check-up camp at the community hall this Sunday, 9 am to 1 pm.",
    time: "Today, 11:42 am",
  },
  {
    community: "Sector 12 Residents",
    person: "Meena Iyer",
    text: "Bhajan evening at my home on Friday at 6 pm. Please bring a friend!",
    time: "Yesterday, 7:25 pm",
  },
] as const;

function CommunityScreen() {
  return (
    <AppShell>
      <PageHeader title="My Community" subtitle="Green Park, New Delhi" />
      <main className="flex flex-col gap-4 p-5">
        {posts.map((post, i) => (
          <Card key={i}>
            <div className="flex items-center gap-2 text-base font-bold text-primary">
              <Users className="h-5 w-5 shrink-0" />
              <span>{post.community}</span>
            </div>
            <p className="mt-2 text-lg font-bold text-foreground">
              {post.person}
            </p>
            <p className="mt-1 text-lg leading-relaxed text-foreground">
              {post.text}
            </p>
            <p className="mt-3 text-base font-semibold text-muted-foreground">
              {post.time}
            </p>
          </Card>
        ))}
      </main>
    </AppShell>
  );
}
