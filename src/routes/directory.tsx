import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Cake, LogOut, Camera, Loader2, ShieldCheck } from "lucide-react";
import { memberSpectrum, MONTH_NAMES } from "@/lib/store";
import {
  signOut,
  useAdminStatusQuery,
  useMembersDirectoryQuery,
  useSupabaseAuth,
} from "@/lib/store.supabase";
import { EcgLine } from "@/components/EcgLine";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GradientBar } from "@/components/GradientBar";

export const Route = createFileRoute("/directory")({
  head: () => ({
    meta: [
      { title: "Batch Directory | MKCGIAN 1997" },
      {
        name: "description",
        content:
          "Browse all batchmates of the MKCG Medical College MBBS 1997 batch — portraits, postings, achievements and today's birthdays.",
      },
      { property: "og:title", content: "Batch Directory | MKCGIAN 1997" },
      {
        property: "og:description",
        content: "Browse and search the portraits and milestones of the MBBS 1997 batch.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Directory,
});

function Directory() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { session, loading: authLoading } = useSupabaseAuth();
  const { data: adminStatus } = useAdminStatusQuery();
  const { data: members = [], isLoading, error } = useMembersDirectoryQuery();

  useEffect(() => {
    if (!authLoading && !session) navigate({ to: "/" });
  }, [authLoading, session, navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      [m.name, m.current_position, m.profession]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [members, query]);

  const today = new Date();
  const todaysBirthdays = members.filter(
    (m) => m.birth_month === today.getMonth() + 1 && m.birth_day === today.getDate(),
  );

  return (
    <div className="min-h-screen bg-cream paper-grain">
      <header className="bg-maroon text-maroon-foreground">
        <GradientBar className="h-1.5 w-full" />
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/mkcg-college-crest.png"
              alt="MKCG Medical College crest"
              className="h-10 w-auto shrink-0 drop-shadow-sm animate-float-soft"
            />
            <div className="min-w-0">
              <h1 className="font-display truncate text-2xl leading-tight">
                Batch Directory
              </h1>
              <p className="text-[0.65rem] uppercase tracking-[0.22em] text-gold">
                All batchmates · MBBS 1997
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {adminStatus?.isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 rounded-full border border-maroon-foreground/25 px-3 py-1.5 text-sm transition duration-300 hover:-translate-y-0.5 hover:bg-maroon-foreground/10"
              >
                <ShieldCheck size={15} /> <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            <ThemeToggle />
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-maroon-foreground/25 px-3 py-1.5 text-sm transition duration-300 hover:-translate-y-0.5 hover:bg-maroon-foreground/10"
            >
              <LogOut size={15} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        <div className="mx-auto hidden max-w-5xl px-5 pb-3 text-maroon-foreground/40 sm:block">
          <EcgLine className="h-5 w-full" />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-6">
        {todaysBirthdays.length > 0 && (
          <div className="mb-5 flex animate-fade-up items-center gap-3 rounded-2xl border border-gold/60 bg-gold/15 p-4">
            <Cake size={20} className="shrink-0 animate-float-soft text-maroon" />
            <p className="text-sm font-medium text-maroon">
              Happy birthday today — {todaysBirthdays.map((m) => m.name).join(", ")}!
            </p>
          </div>
        )}

        <div className="relative mb-6 animate-fade-up">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, speciality or posting…"
            className="input-glow w-full rounded-2xl border border-gold/40 bg-card py-3 pl-11 pr-4 shadow-sm outline-none"
          />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" /> Loading batchmates…
          </div>
        )}

        {error && (
          <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-6 text-center text-sm text-destructive">
            Couldn't load the directory: {(error as Error).message}
          </p>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m, i) => {
              const c = memberSpectrum(m.id);
              return (
                <div key={m.id} className="group/glow relative">
                  <span
                    aria-hidden="true"
                    className="animate-glow-pulse pointer-events-none absolute -inset-1.5 rounded-3xl blur-lg transition-opacity duration-300 group-hover/glow:opacity-90"
                    style={{ background: c.gradient, animationDelay: `${Math.min(i, 20) * 90}ms` }}
                  />
                  <Link
                    to="/profile/$id"
                    params={{ id: String(m.id) }}
                    className="group relative z-10 block animate-fade-up overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                    style={{ animationDelay: `${Math.min(i, 20) * 35}ms` }}
                  >
                    <span
                      className="absolute inset-x-0 top-0 h-1 transition-all duration-300 group-hover:h-1.5"
                      style={{ background: c.gradient }}
                    />
                    <div className="flex items-center gap-4 p-4 pt-5">
                      <div
                        className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full text-lg font-semibold text-white ring-2 ring-offset-2 ring-offset-card transition-transform duration-300 group-hover:scale-105"
                        style={{ background: c.gradient, boxShadow: `0 0 0 1px ${c.ring}` }}
                      >
                        {m.photo_url ? (
                          <img
                            src={m.photo_url}
                            alt={`Portrait of ${m.name}`}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          m.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{m.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {m.current_position || m.profession || "Profile awaiting details"}
                        </p>
                        <p className="mt-1 text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                          {m.birth_month
                            ? `${MONTH_NAMES[m.birth_month]} ${m.birth_day}`
                            : "Birthday not set"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 border-t border-border/70 px-4 py-2 text-[0.7rem] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Camera size={12} /> {m.photo_url ? "Portrait" : "No photo"}
                      </span>
                      {m.is_mine && (
                        <span className="ml-auto font-semibold text-maroon">Your profile</span>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No batchmate matches “{query}”.
          </p>
        )}
      </div>
    </div>
  );
}
