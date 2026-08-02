import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { getMembers, getRole, updateMember, type Member, type Role } from "@/lib/store";

export const Route = createFileRoute("/profile/$id")({
  head: () => ({
    meta: [
      { title: "Batchmate Profile | MKCGIAN 1997" },
      {
        name: "description",
        content:
          "View and update a batchmate profile — birthday, city, profession, family, awards and social handles.",
      },
      { property: "og:title", content: "Batchmate Profile | MKCGIAN 1997" },
      {
        property: "og:description",
        content: "View and update a MKCGIAN 1997 batchmate profile.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

const FIELDS: { key: keyof Member; label: string; type?: string }[] = [
  { key: "name", label: "Full Name" },
  { key: "birth_month", label: "Birth Month (1-12)", type: "number" },
  { key: "birth_day", label: "Birth Day (1-31)", type: "number" },
  { key: "address", label: "Address / City" },
  { key: "spouse", label: "Spouse / Husband's Name" },
  { key: "habits", label: "Habits / Hobbies" },
  { key: "profession", label: "Professional Field" },
  { key: "current_position", label: "Current Post / Position" },
  { key: "family", label: "Family (children etc.)" },
  { key: "awards", label: "Awards / Recognitions" },
  { key: "social_media", label: "Social Media Handles (comma separated)" },
  { key: "photo_url", label: "Photo URL" },
];

function Profile() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const r = getRole();
    if (!r) {
      navigate({ to: "/" });
      return;
    }
    setRole(r);
    const found = getMembers().find((m) => String(m.id) === id) ?? null;
    setMember(found);
    setForm((found ?? {}) as Record<string, unknown>);
  }, [id, navigate]);

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-muted-foreground">Batchmate not found.</p>
      </div>
    );
  }

  function handleChange(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    if (!member) return;
    const updates: Partial<Member> = { ...(form as Partial<Member>) };
    updates.birth_month = form["birth_month"] ? Number(form["birth_month"]) : null;
    updates.birth_day = form["birth_day"] ? Number(form["birth_day"]) : null;
    const updated = updateMember(member.id, updates);
    setMember(updated);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const canEdit = role === "member" || role === "admin";

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-maroon text-maroon-foreground px-4 py-4 flex items-center gap-3 shadow-md">
        <button onClick={() => router.history.back()} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold">{member.name}&apos;s Profile</h1>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="bg-card rounded-2xl shadow p-6 border border-border">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-maroon text-maroon-foreground flex items-center justify-center text-2xl font-bold overflow-hidden">
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                member.name.charAt(0)
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{member.name}</p>
              {member.current_position && (
                <p className="text-sm text-muted-foreground">{member.current_position}</p>
              )}
            </div>
          </div>

          {!editing ? (
            <div className="space-y-3">
              {FIELDS.filter((f) => f.key !== "name").map((f) => {
                const value = member[f.key];
                return (
                  <div key={f.key}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {f.label}
                    </p>
                    <p className="text-foreground">
                      {value !== null && value !== undefined && value !== ""
                        ? String(value)
                        : "—"}
                    </p>
                  </div>
                );
              })}

              {canEdit && (
                <button
                  onClick={() => setEditing(true)}
                  className="mt-4 w-full bg-maroon text-maroon-foreground rounded-lg py-2 font-semibold hover:bg-maroon/90 transition"
                >
                  Edit This Profile
                </button>
              )}
              {saved && (
                <p className="text-sm text-center mt-2 text-maroon font-medium">Saved!</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">
                    {f.label}
                  </label>
                  <input
                    type={f.type ?? "text"}
                    value={(form[f.key] as string | number | undefined) ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="w-full border border-input bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maroon"
                  />
                </div>
              ))}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-maroon text-maroon-foreground rounded-lg py-2 font-semibold hover:bg-maroon/90 transition flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Save
                </button>
                <button
                  onClick={() => {
                    setForm(member as unknown as Record<string, unknown>);
                    setEditing(false);
                  }}
                  className="flex-1 bg-secondary text-secondary-foreground rounded-lg py-2 font-semibold hover:bg-secondary/80 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
