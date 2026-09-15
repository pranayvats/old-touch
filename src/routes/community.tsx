import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/community")({ component: CommunityScreen });

type Post = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: { full_name: string; city: string | null } | null;
};

function CommunityScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("community_posts")
      .select("id,user_id,content,created_at,profiles!community_posts_user_id_fkey(full_name,city)")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setPosts((data ?? []).map((row: any) => ({ ...row, author: row.profiles })));
    setLoading(false);
  };

  useEffect(() => {
    void loadPosts();
    const channel = supabase
      .channel("community-posts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, () => void loadPosts())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const createPost = async () => {
    const text = content.trim();
    if (!text) return;
    setPosting(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Please log in again to post."); setPosting(false); return; }

    const { error } = await supabase.from("community_posts").insert({ user_id: user.id, content: text });
    if (error) setError(error.message);
    else setContent("");
    setPosting(false);
  };

  const deletePost = async (id: string) => {
    setError("");
    if (deletingId) return;

    const confirmed = window.confirm("Delete this post? This cannot be undone.");
    if (!confirmed) return;

    setDeletingId(id);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("Please log in again to delete this post.");
      setDeletingId(null);
      return;
    }

    const { data: deletedRows, error: deleteError } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id");

    if (deleteError) {
      setError(`Could not delete post: ${deleteError.message}`);
      setDeletingId(null);
      return;
    }

    if (!deletedRows || deletedRows.length === 0) {
      setError("Could not delete this post. You can only delete your own posts.");
      setDeletingId(null);
      return;
    }

    setPosts((current) => current.filter((post) => post.id !== id));
    setDeletingId(null);
  };

  return (
    <AppShell>
      <PageHeader title="My Community" subtitle="People and news near you" />
      <main className="flex flex-col gap-4 p-5">
        <Card>
          <div className="flex items-center gap-2 text-xl font-extrabold"><Plus className="h-6 w-6" /> Share with your community</div>
          <FormField label="Your message" placeholder="What would you like to tell your community?" value={content} onChange={setContent} multiline optional />
          <button type="button" onClick={createPost} disabled={!content.trim() || posting} className="mt-4 w-full rounded-3xl bg-primary px-6 py-4 text-xl font-extrabold text-primary-foreground disabled:opacity-50">{posting ? "Posting…" : "Post"}</button>
        </Card>

        {error && <p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{error}</p>}
        {loading ? <p className="p-4 text-lg font-semibold">Loading community…</p> : posts.length === 0 ? <Card><p className="text-lg font-semibold">No posts yet. Be the first to share something!</p></Card> : posts.map((post) => (
          <Card key={post.id}>
            <div className="flex items-center gap-2 text-base font-bold text-primary"><Users className="h-5 w-5" /><span>{post.author?.city || "Your community"}</span></div>
            <p className="mt-2 text-lg font-black">{post.author?.full_name || "Community member"}</p>
            <p className="mt-1 text-lg leading-relaxed">{post.content}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-muted-foreground">{new Date(post.created_at).toLocaleString()}</p>
              <DeleteOwnPost post={post} deleting={deletingId === post.id} onDelete={deletePost} />
            </div>
          </Card>
        ))}
      </main>
    </AppShell>
  );
}

function DeleteOwnPost({ post, deleting, onDelete }: { post: Post; deleting: boolean; onDelete: (id: string) => void }) {
  const [own, setOwn] = useState(false);
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setOwn(data.user?.id === post.user_id)); }, [post.user_id]);
  if (!own) return null;
  return (
    <button type="button" aria-label="Delete post" disabled={deleting} onClick={() => void onDelete(post.id)} className="rounded-2xl border px-4 py-2 font-bold disabled:opacity-50">
      <Trash2 className="inline h-5 w-5" /> {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
