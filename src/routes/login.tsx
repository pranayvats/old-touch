import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FormField } from "@/components/FormField";

export const Route = createFileRoute("/login")({
  component: LoginScreen,
});

function LoginScreen() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const handleLogin = () => {
    if (!identifier.trim() || !password) return;
    localStorage.setItem("old-touch-logged-in", "true");
    localStorage.setItem("old-touch-remember", String(remember));
    navigate({ to: "/" });
  };

  return (
    <AppShell>
      <main className="flex flex-1 flex-col p-6 pt-12">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-black tracking-tight">Old Touch</h1>
          <p className="mt-3 text-xl font-semibold text-muted-foreground">
            Stay connected. Stay safe.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <FormField label="Mobile number or email" placeholder="Enter your mobile number" value={identifier} onChange={setIdentifier} />
          <FormField label="Password" type="password" placeholder="Enter your password" value={password} onChange={setPassword} />

          <label className="flex items-center gap-3 text-lg font-semibold">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-6 w-6" />
            Remember me
          </label>

          <button type="button" onClick={handleLogin} disabled={!identifier.trim() || !password} className="mt-3 w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
            Log In
          </button>

          <button type="button" className="py-3 text-lg font-bold text-primary">
            Forgot password?
          </button>
        </div>

        <div className="mt-auto pt-8 text-center">
          <p className="text-lg font-semibold text-muted-foreground">New to Old Touch?</p>
          <Link to="/signup" className="mt-2 block rounded-3xl border-2 border-primary px-6 py-4 text-xl font-extrabold text-primary">
            Create an Account
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
