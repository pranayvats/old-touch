import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarPlus, CarTaxiFront, LogOut, Salad, Users, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BigButton } from "@/components/BigButton";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Old Touch — Stay Connected, Stay Safe" }, { name: "description", content: "A simple, friendly app for older adults: emergency help, host events, local community, nearby places, healthy food, and cab booking." }] }),
  component: HomeGate,
});

function HomeGate() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!active) return;
      if (userError) { setAuthError("We could not check your sign-in. Please try again."); setChecking(false); return; }
      if (!user) { navigate({ to: "/login", replace: true }); return; }
      const { data: profile, error: profileError } = await supabase.from("profiles").select("city").eq("id", user.id).maybeSingle();
      if (!active) return;
      if (profileError) { setAuthError("We could not load your profile. Please try again."); setChecking(false); return; }
      if (!profile?.city) { navigate({ to: "/setup", replace: true }); return; }
      setChecking(false);
    };
    void check();
    return () => { active = false; };
  }, [navigate]);

  if (checking) return <AppShell><main className="flex flex-1 items-center justify-center p-6"><p className="text-2xl font-bold">Loading Old Touch…</p></main></AppShell>;
  if (authError) return <AppShell><main className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center"><p className="rounded-2xl bg-destructive/10 p-4 text-base font-bold text-destructive">{authError}</p><button type="button" onClick={() => window.location.reload()} className="rounded-3xl bg-primary px-6 py-4 text-xl font-extrabold text-primary-foreground">Try Again</button></main></AppShell>;
  return <HomeScreen />;
}

function HomeScreen() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    localStorage.removeItem("old-touch-logged-in");
    localStorage.removeItem("old-touch-setup-complete");
    navigate({ to: "/login", replace: true });
  };

  return <AppShell><header className="flex items-start justify-between px-5 pb-2 pt-8"><div><h1 className="text-4xl font-black tracking-tight text-foreground">Old Touch</h1><p className="mt-1 text-lg font-semibold text-muted-foreground">Namaste! What would you like to do?</p></div><button type="button" onClick={() => void handleLogout()} disabled={loggingOut} aria-label="Log out" title="Log out" className="mt-1 flex min-h-12 min-w-12 items-center justify-center rounded-2xl border-2 border-border bg-card text-foreground hover:bg-accent disabled:opacity-50"><LogOut className="h-6 w-6" /></button></header><main className="flex flex-col gap-4 p-5">
    <BigButton variant="emergency" icon={AlertTriangle} label="EMERGENCY" description="Get help quickly" to="/emergency" />
    <BigButton icon={CalendarPlus} label="HOST AN EVENT" description="Plan a get-together" to="/host-event" />
    <BigButton icon={Users} label="MY COMMUNITY" description="News from people near you" to="/community" />
    <BigButton icon={MapPin} label="NEAR ME" description="Hospitals, pharmacies & more" to="/near-me" />
    <BigButton icon={Salad} label="HEALTHY FOOD" description="Good restaurants nearby" to="/healthy-food" />
    <BigButton icon={CarTaxiFront} label="BOOK A CAB" description="Go anywhere comfortably" to="/book-a-cab" />
  </main></AppShell>;
}
