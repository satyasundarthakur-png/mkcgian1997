import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { login } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MKCGIAN 1997 — MBBS Batch Reunion Directory" },
      {
        name: "description",
        content:
          "Private reunion directory for the MKCG Medical College MBBS batch of 1997. Sign in with the batch password to browse and update batchmate profiles.",
      },
      { property: "og:title", content: "MKCGIAN 1997 — MBBS Batch Reunion Directory" },
      {
        property: "og:description",
        content:
          "Private reunion directory for the MKCG Medical College MBBS batch of 1997.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const role = login(password);
    if (!role) {
      setError("Incorrect password. Please try again.");
      return;
    }
    navigate({ to: role === "admin" ? "/admin" : "/directory" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream to-background px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-card shadow-xl rounded-2xl p-8 w-full max-w-sm border border-gold/40"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="bg-maroon text-gold rounded-full p-3 mb-3">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-xl font-bold text-maroon text-center">
            MKCG Medical College
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            MBBS Batch of 1997 — Reunion Directory
          </p>
        </div>
        <label className="block text-sm font-medium text-foreground mb-1" htmlFor="pw">
          Batch Password
        </label>
        <input
          id="pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-full border border-input rounded-lg px-3 py-2 mb-3 bg-background focus:outline-none focus:ring-2 focus:ring-maroon"
        />
        {error && <p className="text-destructive text-sm mb-3">{error}</p>}
        <button
          type="submit"
          className="w-full bg-maroon text-maroon-foreground rounded-lg py-2 font-semibold hover:bg-maroon/90 transition"
        >
          Enter
        </button>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Batchmate password lets you view &amp; edit your own profile. Admin password
          unlocks full management.
        </p>
      </form>
    </div>
  );
}
