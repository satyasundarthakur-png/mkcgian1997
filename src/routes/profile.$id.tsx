import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Save,
  Camera,
  Pencil,
  MapPin,
  HeartHandshake,
  Activity,
  Stethoscope,
  Briefcase,
  Users,
  Share2,
  Cake,
  Sparkles,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EcgLine } from "@/components/EcgLine";
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

/** Curated display facts (excludes name & birth, which live in the header). */
const FACTS: { key: keyof Member; label: string; icon: typeof MapPin }[] = [
  { key: "current_position", label: "Current Post", icon: Briefcase },
  { key: "profession", label: "Professional Field", icon: Stethoscope },
  { key: "address", label: "Address / City", icon: MapPin },
  { key: "spouse", label: "Spouse", icon: HeartHandshake },
  { key: "family", label: "Family", icon: Users },
  { key: "habits", label: "Habits & Hobbies", icon: Activity },
  { key: "social_media", label: "Social Media", icon: Share2 },
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
  const [photoError, setPhotoError] = useState("");
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
    setPhotoError("");
    try {
      setPhoto(await fileToDataUrl(file, 700));
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : "Couldn't process that photo. Please try another.",
      );
    }
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

  function cancelEdit() {
    if (!member) return;
    setForm(member as unknown as Record<string, unknown>);
    setPhoto(member.photo_url);
    setPhotoError("");
    setEditing(false);
  }

  return (
    <div className="min-h-screen bg-cream paper-grain pb-20">
      {/* Cover */}
      <div className="relative h-40 overflow-hidden sm:h-52" style={{ background: c.gradient }}>
        <div className="absolute inset-0 opacity-25 mix-blend-overlay">
          <EcgLine className="h-full w-full text-white" />
        </div>
        <div className="absolute inset-x-0 top-0 mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <button
            onClick={() => router.history.back()}
            aria-label="Go back"
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm transition hover:bg-white/25"
          >
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-white/15 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-white backdrop-blur-sm sm:inline">
              MKCGIAN 1997
            </span>
            <ThemeToggle className="text-white" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5">
        {/* Identity card — overlaps the cover */}
        <div className="relative -mt-16 animate-fade-up rounded-3xl border border-gold/40 bg-card px-6 pb-6 pt-20 shadow-[0_30px_60px_-35px_oklch(0.34_0.12_18/0.5)] sm:pt-6">
          {/* Avatar, overlapping cover + card */}
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0">
            <div className="relative">
              <div
                className="grid h-28 w-28 place-items-center overflow-hidden rounded-full text-4xl font-semibold text-white ring-[6px] ring-card transition-transform duration-300 hover:scale-105 sm:h-32 sm:w-32"
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
                  className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full bg-maroon text-gold shadow-lg transition hover:scale-105"
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
          </div>

          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:pl-[9.5rem] sm:text-left">
            <div className="min-w-0">
              <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
                {member.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {member.current_position || member.profession || "MBBS 1997 batch"}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: c.soft, color: c.solid }}
                >
                  <Sparkles size={12} /> MBBS 1997
                </span>
                {member.birth_month && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    <Cake size={12} /> {MONTH_NAMES[member.birth_month]} {member.birth_day}
                  </span>
                )}
                {member.address && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    <MapPin size={12} /> {member.address}
                  </span>
                )}
              </div>
            </div>

            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex shrink-0 items-center gap-2 rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-maroon-foreground shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-maroon/90 hover:shadow-md"
              >
                <Pencil size={14} /> Edit profile
              </button>
            )}
          </div>
        </div>

        {/* Facts */}
        {!editing ? (
          <section className="mt-6 animate-fade-up [animation-delay:80ms]">
            <div className="mb-3 flex items-center gap-2 px-1">
              <div className="gold-rule h-px flex-1" />
              <h2 className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Profile
              </h2>
              <div className="gold-rule h-px flex-1" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FACTS.map(({ key, label, icon: Icon }) => {
                const value = member[key];
                const filled = value !== null && value !== undefined && value !== "";
                return (
                  <div
                    key={key}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 transition duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-md"
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                      style={{ background: c.soft, color: c.solid }}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                        {label}
                      </dt>
                      <dd
                        className={
                          filled
                            ? "mt-0.5 break-words text-sm font-medium text-foreground"
                            : "mt-0.5 text-sm italic text-muted-foreground/70"
                        }
                      >
                        {filled ? String(value) : "Not shared yet"}
                      </dd>
                    </div>
                  </div>
                );
              })}
            </div>

            {saved && (
              <p className="mt-5 text-center text-sm font-medium text-maroon">
                ✓ Saved to this device.
              </p>
            )}
          </section>
        ) : (
          <section className="mt-6 animate-fade-up rounded-3xl border border-gold/40 bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Pencil size={16} className="text-gold" />
              <h2 className="font-display text-xl text-ink">Edit profile</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key} className={f.key === "name" ? "sm:col-span-2" : ""}>
                  <label className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                    {f.label}
                  </label>
                  <input
                    type={f.type ?? "text"}
                    value={(form[f.key] as string | number | undefined) ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="input-glow mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-gold/50 bg-gold/5 p-4">
              <label className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                Portrait
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div
                  className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full text-lg font-semibold text-white ring-2 ring-card"
                  style={{ background: c.gradient }}
                >
                  {photo ? (
                    <img src={photo} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    member.name.charAt(0)
                  )}
                </div>
                <input
                  value={photo.startsWith("data:") ? "" : photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  placeholder={photo.startsWith("data:") ? "Uploaded photo" : "Paste a photo URL…"}
                  className="input-glow flex-1 rounded-xl border border-input bg-background px-3 py-2.5 outline-none"
                />
                <button
                  onClick={() => photoInput.current?.click()}
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80"
                >
                  <Camera size={15} /> Upload
                </button>
              </div>
              <p className="mt-2 text-[0.65rem] text-muted-foreground">
                Uploaded photos are automatically compressed to fit under 450 KB.
              </p>
              {photoError && <p className="mt-1.5 text-xs text-destructive">{photoError}</p>}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleSave}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-maroon py-3 font-semibold text-maroon-foreground transition duration-300 hover:-translate-y-0.5 hover:bg-maroon/90 hover:shadow-lg"
              >
                <Save size={16} /> Save profile
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary px-5 py-3 font-semibold text-secondary-foreground transition hover:bg-secondary/80"
              >
                <X size={15} /> Cancel
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
