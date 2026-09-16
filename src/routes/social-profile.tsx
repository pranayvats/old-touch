import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, UserCheck, UserPlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/social-profile")({ component: SocialProfileScreen });

type Profile = { id: string; full_name: string; city: string | null; avatar_url: string | null };
type Post = { id: string; content: string; image_url: string | null; created_at: string };

function SocialProfileScreen() {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [status, setStatus] = useState<"none" | "pending" | "accepted">("none");
  const [mutual, setMutual] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Please log in again."); setLoading(false); return; }
      setUserId(user.id);
      const params = new URLSearchParams(window.location.search);
      const target = params.get("id");
      if (!target) { setError("No profile was selected."); setLoading(false); return; }
      const [{ data: p }, { data: ps }, { data: rels }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,city,avatar_url").eq("id", target).maybeSingle(),
        supabase.from("social_posts").select("id,content,image_url,created_at").eq("user_id", target).order("created_at", { ascending: false }).limit(50),
        supabase.from("social_friends").select("requester_id,addressee_id,status").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
      ]);
      if (!p) { setError("That profile could not be found."); setLoading(false); return; }
      setProfile(p as Profile); setPosts((ps ?? []) as Post[]);
      const accepted = (rels ?? []).filter((r: any) => r.status === "accepted").map((r: any) => r.requester_id === user.id ? r.addressee_id : r.requester_id);
      setFriends(accepted);
      const relation = (rels ?? []).find((r: any) => r.requester_id === target || r.addressee_id === target);
      if (relation?.status === "accepted") setStatus("accepted"); else if (relation?.status === "pending") setStatus("pending");
      if (accepted.length) {
        const { data: theirRels } = await supabase.from("social_friends").select("requester_id,addressee_id").eq("status", "accepted").or(`requester_id.eq.${target},addressee_id.eq.${target}`);
        const theirFriends = new Set((theirRels ?? []).map((r: any) => r.requester_id === target ? r.addressee_id : r.requester_id));
        const mutualIds = accepted.filter((id) => theirFriends.has(id)).slice(0, 10);
        if (mutualIds.length) { const { data: mp } = await supabase.from("profiles").select("id,full_name,city,avatar_url").in("id", mutualIds); setMutual((mp ?? []) as Profile[]); }
      }
      setLoading(false);
    })();
  }, []);

  const addFriend = async () => {
    if (!profile || !userId) return;
    const { error: e } = await supabase.from("social_friends").insert({ requester_id: userId, addressee_id: profile.id });
    if (e) setError(e.code === "23505" ? "A friend request already exists." : e.message); else setStatus("pending");
  };

  if (loading) return <AppShell><main className="p-5 text-xl font-bold">Loading profile…</main></AppShell>;
  return <AppShell><PageHeader title="Profile" subtitle={profile?.full_name || "Social profile"} backTo="/social" /><main className="flex flex-col gap-4 p-5">
    {error && <p role="alert" className="rounded-2xl bg-destructive/10 p-4 font-bold text-destructive">{error}</p>}
    {profile && <>
      <Card><div className="flex flex-col items-center text-center">
        {profile.avatar_url ? <img src={profile.avatar_url} alt={`${profile.full_name} profile`} className="h-28 w-28 rounded-full border-2 border-border object-cover" /> : <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 text-4xl font-black text-primary">{profile.full_name.slice(0,1).toUpperCase()}</div>}
        <h1 className="mt-4 text-3xl font-black">{profile.full_name}</h1><p className="mt-1 text-base font-semibold text-muted-foreground">{profile.city || "Old Touch member"}</p>
        <div className="mt-5 grid w-full grid-cols-2 gap-3"><div className="rounded-2xl bg-muted/50 p-4"><p className="text-2xl font-black">{friends.length}</p><p className="font-bold">Friends</p></div><div className="rounded-2xl bg-muted/50 p-4"><p className="text-2xl font-black">{posts.length}</p><p className="font-bold">Posts</p></div></div>
        <div className="mt-4 flex w-full gap-2">{status === "accepted" ? <Link to="/social-messages" search={{ id: profile.id }} className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 font-extrabold text-primary-foreground"><MessageCircle className="h-5 w-5" />Message</Link> : status === "pending" ? <div className="flex min-h-14 flex-1 items-center justify-center rounded-2xl border-2 px-4 font-extrabold">Request pending</div> : <button type="button" onClick={() => void addFriend()} className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 font-extrabold text-primary-foreground"><UserPlus className="h-5 w-5" />Add friend</button>}</div>
      </div></Card>
      {mutual.length > 0 && <Card><h2 className="text-xl font-black">Mutual friends</h2><p className="mt-1 font-semibold text-muted-foreground">People you both know</p>{mutual.map((m) => <div key={m.id} className="mt-3 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-bold">{m.avatar_url ? <img src={m.avatar_url} alt="" className="h-full w-full object-cover" /> : m.full_name.slice(0,1)}</div><p className="font-bold">{m.full_name}</p></div>)}</Card>}
      <Card><h2 className="text-xl font-black">Posts</h2>{posts.length === 0 ? <p className="mt-3 font-semibold">No posts yet.</p> : posts.map((post) => <div key={post.id} className="border-b py-4 last:border-b-0"><p className="whitespace-pre-wrap text-lg leading-relaxed">{post.content}</p><p className="mt-2 text-sm font-semibold text-muted-foreground">{new Date(post.created_at).toLocaleString()}</p></div>)}</Card>
      <Link to="/social" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 font-extrabold"><ArrowLeft className="h-5 w-5" />Back to Social</Link>
    </>}
  </main></AppShell>;
}
