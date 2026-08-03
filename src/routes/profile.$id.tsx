import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Save, Camera, Pencil } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  fileToDataUrl,
  getMembers,
  getRole,
  memberSpectrum,
  MONTH_NAMES,
  updateMember,
  type Member,
  type Role,
} from "@/lib/store";

export const Route = createFileRoute("/profile/$id")({
  head: () => ({
    meta: [
      { title: "Batchmate Profile | MKCGIAN 1997" },
      {
        name: "description",
        content:
          "A memorabilia profile — portrait, birthday, city, speciality and family of an MKCGIAN 1997 batchmate.",
      },
      { property: "og:title", content: "Batchmate Profile | MKCGIAN 1997" },
      {
        property: "og:description",
        content: "Portrait and milestones of an MKCGIAN 1997 batchmate.",
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
  { key: "spouse", label: "Spouse's Name" },
  { key: "habits", label: "Habits / Hobbies" },
  { key: "profession", label: "Professional Field" },
  { key: "current_position", label: "Current Post / Position" },
  { key: "family", label: "Family (children etc.)" },
  { key: "social_media", label: "Social Media Handles" },
];

function Profile() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [photo, setPhoto] = useState("");
  const [saved, setSaved] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

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
    setPhoto(found?.photo_url ?? "");
  }, [id, navigate]);

  if (!member) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-muted-foreground">Batchmate not found.</p>
      </div>
    );
  }

  const c = memberSpectrum(member.id);
  const canEdit = role === "member" || role === "admin";

  function handleChange(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(await fileToDataUrl(file, 700));
    e.target.value = "";
  }

  function handleSave() {
    if (!member) return;
    const updates: Partial<Member> = { ...(form as Partial<Member>) };
    updates.birth_month = form["birth_month"] ? Number(form["birth_month"]) : null;
    updates.birth_day = form["birth_day"] ? Number(form["birth_day"]) : null;
    updates.photo_url = photo;
    const updated = updateMember(member.id, updates);
    setMember(updated);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  const facts = FIELDS.filter((f) => f.key !== "name");

  return (
    <div className="min-h-screen bg-cream paper-grain pb-16">
      {/* Banner */}
      <div className="relative" style={{ background: c.gradient }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.history.back()}
              aria-label="Go back"
              className="rounded-full bg-white/15 p-2 transition hover:bg-white/25"
            >
              <ArrowLeft size={18} />
            </button>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em]">
              MKCGIAN 1997 · Memorabilia
            </p>
          </div>
          <ThemeToggle className="text-white" />
        </div>
        <div className="h-10" />
      </div>

      <div className="mx-auto max-w-3xl pt-6 px-5">
        <div className="animate-fade-up overflow-hidden rounded-3xl border border-gold/40 bg-card shadow-[0_30px_60px_-35px_oklch(0.34_0.12_18/0.5)]">
          <div className="flex flex-col items-center gap-4 px-6 pb-6 pt-6 text-center sm:flex-row sm:items-center sm:text-left">
            <div className="relative shrink-0">

              <div
                className="grid h-28 w-28 place-items-center overflow-hidden rounded-full text-4xl font-semibold text-white ring-4 ring-card transition-transform duration-300 hover:scale-105"
                style={{ background: c.gradient }}
              >
                {(editing ? photo : member.photo_url) ? (
                  <img
                    src={editing ? photo : member.photo_url}
                    alt={`Portrait of ${member.name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  member.name.charAt(0)
                )}
              </div>
              {editing && (
                <button
                  onClick={() => photoInput.current?.click()}
                  className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full bg-maroon text-gold shadow-lg"
                  aria-label="Upload portrait"
                >
                  <Camera size={16} />
                </button>
              )}
              <input
                ref={photoInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhoto}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl leading-tight text-ink">
                {member.name}
              </h1>

              <p className="text-sm text-muted-foreground">
                {member.current_position || member.profession || "MBBS 1997 batch"}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                {member.birth_month && (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{ background: c.soft, color: c.solid }}
                  >
                    {MONTH_NAMES[member.birth_month]} {member.birth_day}
                  </span>
                )}
                {member.address && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {member.address}
                  </span>
                )}
              </div>
            </div>
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-maroon-foreground transition hover:bg-maroon/90 "
              >
                <Pencil size={14} /> Edit
              </button>
            )}
          </div>

          <div className="gold-rule h-px" />

          {!editing ? (
            <div className="px-6 py-6">
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                {facts.map((f) => {
                  const value = member[f.key];
                  return (
                    <div key={f.key}>
                      <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                        {f.label}
                      </dt>
                      <dd className="text-foreground">
                        {value !== null && value !== undefined && value !== ""
                          ? String(value)
                          : "—"}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              {saved && (
                <p className="mt-4 text-center text-sm font-medium text-maroon">
                  Saved to this device.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 px-6 py-6">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                    {f.label}
                  </label>
                  <input
                    type={f.type ?? "text"}
                    value={(form[f.key] as string | number | undefined) ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="input-glow mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Portrait
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={photo.startsWith("data:") ? "" : photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    placeholder={
                      photo.startsWith("data:") ? "Uploaded photo" : "Paste a photo URL…"
                    }
                    className="input-glow flex-1 rounded-xl border border-input bg-background px-3 py-2 outline-none"
                  />
                  <button
                    onClick={() => photoInput.current?.click()}
                    className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground"
                  >
                    <Camera size={15} /> Upload
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-maroon py-2.5 font-semibold text-maroon-foreground transition hover:bg-maroon/90"
                >
                  <Save size={16} /> Save profile
                </button>
                <button
                  onClick={() => {
                    setForm(member as unknown as Record<string, unknown>);
                    setPhoto(member.photo_url);
                    setEditing(false);
                  }}
                  className="flex-1 rounded-xl bg-secondary py-2.5 font-semibold text-secondary-foreground transition hover:bg-secondary/80"
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
