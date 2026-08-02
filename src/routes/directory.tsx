import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Cake, LogOut } from "lucide-react";
import { getMembers, getRole, logout, MONTH_NAMES, type Member } from "@/lib/store";

export const Route = createFileRoute("/directory")({
  head: () => ({
    meta: [
      { title: "Batch Directory | MKCGIAN 1997" },
      {
        name: "description",
        content:
          "Browse all 107 batchmates of the MKCG Medical College MBBS 1997 batch, search by name and see today's birthdays.",
      },
      { property: "og:title", content: "Batch Directory | MKCGIAN 1997" },
      {
        property: "og:description",
        content: "Browse and search all 107 batchmates of the MBBS 1997 batch.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Directory,
});

function Directory() {
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!getRole()) {
      navigate({ to: "/" });
      return;
    }
    setMembers(getMembers());
  }, [navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, query]);

  const today = new Date();
  const todaysBirthdays = members.filter(
    (m) => m.birth_month === today.getMonth() + 1 && m.birth_day === today.getDate(),
  );

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-maroon text-maroon-foreground px-4 py-5 shadow-md relative">
        <h1 className="text-lg font-bold text-center">MKCGIAN 1997 — Batch Directory</h1>
        <p className="text-center text-gold text-xs mt-1">
          {members.length} batchmates · MBBS 1997 entry
        </p>
        <button
          onClick={() => {
            logout();
            navigate({ to: "/" });
          }}
          className="absolute right-4 top-5 flex items-center gap-1 text-sm"
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {todaysBirthdays.length > 0 && (
          <div className="bg-gold/20 border border-gold rounded-lg p-3 mb-4 flex items-center gap-2">
            <Cake size={20} className="text-maroon" />
            <span className="text-sm text-maroon font-medium">
              Happy Birthday today: {todaysBirthdays.map((m) => m.name).join(", ")}!
            </span>
          </div>
        )}

        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full border border-input bg-card rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-maroon"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((m) => (
            <Link
              key={m.id}
              to="/profile/$id"
              params={{ id: String(m.id) }}
              className="bg-card rounded-xl p-4 shadow border border-border hover:shadow-md hover:border-gold transition flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-full bg-maroon text-maroon-foreground flex items-center justify-center font-bold overflow-hidden shrink-0">
                {m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt={m.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  m.name.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.birth_month
                    ? `${MONTH_NAMES[m.birth_month]} ${m.birth_day}`
                    : "Birthday not set"}
                </p>
                {m.current_position && (
                  <p className="text-xs text-muted-foreground truncate">
                    {m.current_position}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
