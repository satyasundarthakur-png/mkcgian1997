import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Sparkles, Users, Cake, Award } from "lucide-react";
import { login, StorageUnavailableError } from "@/lib/store";
import { EcgLine } from "@/components/EcgLine";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GradientBar } from "@/components/GradientBar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MKCGIAN 1997 — MBBS Batch Reunion Directory" },
      {
        name: "description",
        content:
          "Private reunion directory for the MKCG Medical College MBBS batch of 1997. Sign in with the batch password to browse batchmate profiles, photographs and achievements.",
      },
      { property: "og:title", content: "MKCGIAN 1997 — MBBS Batch Reunion Directory" },
      {
        property: "og:description",
        content:
          "A memorabilia archive of the MKCG Medical College MBBS batch of 1997 — portraits, milestones and certificates of all doctors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const SPECTRUM = Array.from({ length: 24 }, (_, i) => (i * 137.508) % 360);

function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const role = login(password);
      if (!role) {
        setError("That password doesn't match our records.");
        return;
      }
      navigate({ to: role === "admin" ? "/admin" : "/directory" });
    } catch (err) {
      setError(
        err instanceof StorageUnavailableError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-cream paper-grain">
      <div className="mx-auto flex max-w-6xl justify-end px-5 pt-6">
        <ThemeToggle className="text-maroon" />
      </div>
      <div className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-6xl grid-cols-1 gap-10 px-5 pb-10 lg:grid-cols-[1.15fr_minmax(0,0.85fr)] lg:items-center lg:pb-16">
        {/* Editorial column */}
        <section>
          <div className="flex items-center gap-3 animate-fade-up">
            <img
              src="/mkcg-college-crest.png"
              alt="MKCG Medical College crest"
              className="h-14 w-auto shrink-0 drop-shadow-sm animate-float-soft"
            />
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-maroon">
              MKCG Medical College
            </p>
          </div>

          <h1 className="font-display mt-6 animate-fade-up text-5xl leading-[0.95] text-maroon sm:text-6xl lg:text-7xl [animation-delay:100ms]">
            The Class of
            <span className="block italic text-ink">Ninety&#8209;Seven</span>
          </h1>

          <div className="gold-rule mt-6 h-px w-40" />

          <div className="mt-3 h-8 w-full max-w-xs text-maroon/70 animate-fade-up [animation-delay:150ms]">
            <EcgLine className="h-full w-full" />
          </div>

          <p className="mt-4 max-w-lg animate-fade-up text-base leading-relaxed text-muted-foreground [animation-delay:200ms]">
            A living memorabilia archive for all physicians who began together in Berhampur
            — portraits, birthdays, postings, families and the certificates that mark a
            life in medicine. Every batchmate carries their own colour in the spectrum.
          </p>

          {/* spectrum ribbon */}
          <div className="mt-8 flex h-3 animate-fade-up overflow-hidden rounded-full shadow-sm [animation-delay:250ms]">
            {SPECTRUM.map((h) => (
              <span
                key={h}
                className="flex-1"
                style={{ backgroundColor: `oklch(0.62 0.18 ${h})` }}
              />
            ))}
          </div>

          <dl className="mt-10 grid animate-fade-up grid-cols-3 gap-3 sm:max-w-md [animation-delay:300ms]">
            {[
              { icon: Users, k: "All", v: "Batchmates" },
              { icon: Cake, k: "365", v: "Birthdays" },
              { icon: Award, k: "∞", v: "Milestones" },
            ].map(({ icon: Icon, k, v }) => (
              <div
                key={v}
                className="rounded-2xl border border-gold/40 bg-card/70 px-3 py-4 text-center backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-md"
              >
                <Icon size={16} className="mx-auto text-gold" />
                <dt className="font-display mt-2 text-2xl text-maroon">{k}</dt>
                <dd className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Auth card */}
        <section className="animate-fade-up lg:justify-self-end lg:w-full lg:max-w-sm [animation-delay:150ms]">
          <form
            onSubmit={handleSubmit}
            className="relative overflow-hidden rounded-[1.75rem] border border-gold/50 bg-card p-7 shadow-[0_30px_60px_-30px_oklch(0.34_0.12_18/0.45)]"
          >
            <GradientBar className="absolute inset-x-0 top-0 h-1.5" />
            <div className="flex items-center gap-2 text-maroon">
              <Lock size={15} />
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.28em]">
                Private Archive
              </span>
            </div>

            <h2 className="font-display mt-4 text-3xl text-ink">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in with your own email and password."
                : "Register once, then claim your own profile in the directory."}
            </p>

            <label
              htmlFor="email"
              className="mt-6 block text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="you@example.com"
              className="input-glow mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-gold/40"
            />

            <label
              htmlFor="pw"
              className="mt-4 block text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
            >
              Password
            </label>
            <input
              id="pw"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="••••••••••"
              className="input-glow mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 tracking-widest outline-none focus:ring-2 focus:ring-gold/40"
            />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            {notice && <p className="mt-2 text-sm text-maroon">{notice}</p>}

            <button
              type="submit"
              disabled={busy}
              className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-maroon py-3 font-semibold text-maroon-foreground transition duration-300 hover:-translate-y-0.5 hover:bg-maroon/90 hover:shadow-lg active:translate-y-0 disabled:pointer-events-none disabled:opacity-70"
            >
              <Sparkles size={16} className="text-gold transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
                setNotice("");
              }}
              className="mt-4 w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              {mode === "signin"
                ? "New here? Create an account"
                : "Already registered? Sign in"}
            </button>

            <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
              Each batchmate signs in personally and can claim and edit their own profile.
            </p>
          </form>
        </section>

      </div>

      {/* About the college */}
      <section className="mx-auto max-w-4xl animate-fade-up px-5 pb-16 text-center [animation-delay:350ms]">
        <div className="gold-rule mx-auto h-px w-24" />
        <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-gold">
          About the College
        </p>
        <h2 className="font-display mt-3 text-2xl text-maroon sm:text-3xl">
          Maharaja Krishna Chandra Gajapati Medical College &amp; Hospital
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Established by the Government of Odisha's Department of Health &amp; Family
          Welfare in Berhampur, MKCG Medical College is named after Maharaja Krishna
          Chandra Gajapati of Paralakhemundi, in recognition of his contributions to
          education and healthcare in the region. Undergraduate teaching began in 1962,
          and the attached hospital opened in 1966 to serve southern Odisha. Affiliated
          with Berhampur University and recognised by the National Medical Commission,
          the college remains one of Odisha's leading centres for medical education,
          patient care and research.
        </p>
      </section>
    </main>
  );
}
