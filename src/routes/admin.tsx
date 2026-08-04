import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, Plus, LogOut, Download, Upload } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signOut, useAuth } from "@/lib/auth";
import {
  getMembers,
  resetToSeed,
  insertMember,
  deleteMemberRow,
  replaceAllMembers,
  type Member,
} from "@/lib/store";


export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | MKCGIAN 1997" },
      {
        name: "description",
        content:
          "Admin tools for the MKCGIAN 1997 reunion directory: add or remove batchmates, export and import backups, reset seed data.",
      },
      { property: "og:title", content: "Admin Dashboard | MKCGIAN 1997" },
      {
        property: "og:description",
        content: "Manage batchmate records for the MKCGIAN 1997 reunion directory.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      navigate({ to: "/" });
      return;
    }
    let cancelled = false;

    getMembers()
      .then((data) => {
        if (!cancelled) setMembers(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Couldn't load batch records.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate, isAdmin, authLoading]);

  async function addMember() {
    const nextId = members.length ? Math.max(...members.map((m) => m.id)) + 1 : 1;
    const newMember: Member = {
      id: nextId,
      name: "New Batchmate",
      birth_month: null,
      birth_day: null,
      address: "",
      spouse: "",
      habits: "",
      profession: "",
      current_position: "",
      family: "",
      social_media: "",
      photo_url: "",
      profile_claimed: false,
    };
    setBusy(true);
    try {
      const inserted = await insertMember(newMember);
      setMembers((prev) => [...prev, inserted]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't add a new batchmate.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMember(id: number) {
    if (!confirm("Remove this batchmate record?")) return;
    setBusy(true);
    try {
      await deleteMemberRow(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't remove this record.");
    } finally {
      setBusy(false);
    }
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(members, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mkcgian1997_members_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(String(ev.target?.result)) as Member[];
        setBusy(true);
        await replaceAllMembers(imported);
        setMembers(await getMembers());
      } catch (err) {
        alert(err instanceof Error ? err.message : "Invalid JSON file.");
      } finally {
        setBusy(false);
      }
    };
    reader.readAsText(file);
  }

  async function handleReset() {
    if (!confirm("Reset ALL data to original seed list? This cannot be undone.")) return;
    setBusy(true);
    try {
      await resetToSeed();
      setMembers(await getMembers());
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't reset data.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-maroon text-maroon-foreground px-4 py-4 flex items-center justify-between shadow-md">
        <h1 className="font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/directory" className="hover:underline">
            Directory
          </Link>
          <ThemeToggle />
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}

            className="flex items-center gap-1"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loadError && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {loadError}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={addMember}
            disabled={busy}
            className="flex items-center gap-1 bg-maroon text-maroon-foreground px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
          >
            <Plus size={16} /> Add Batchmate
          </button>
          <button
            onClick={handleExport}
            disabled={busy}
            className="flex items-center gap-1 bg-foreground text-background px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
          >
            <Download size={16} /> Export Backup
          </button>
          <label className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer">
            <Upload size={16} /> Import Backup
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
              disabled={busy}
              className="hidden"
            />
          </label>
          <button
            onClick={handleReset}
            disabled={busy}
            className="flex items-center gap-1 bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
          >
            Reset to Seed Data
          </button>
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Loading records…</p>
        ) : (
          <>
        <div className="bg-card rounded-xl shadow border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Birthday</th>
                <th className="text-left px-4 py-2">Position</th>
                <th className="text-left px-4 py-2">Claimed?</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-4 py-2">
                    <Link
                      to="/profile/$id"
                      params={{ id: String(m.id) }}
                      className="text-maroon font-medium hover:underline"
                    >
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {m.birth_month ? `${m.birth_month}/${m.birth_day}` : "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {m.current_position || "—"}
                  </td>
                  <td className="px-4 py-2">{m.profile_claimed ? "✅" : "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => deleteMember(m.id)}
                      disabled={busy}
                      aria-label={`Delete ${m.name}`}
                      className="text-destructive hover:opacity-80 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Total records: {members.length}
        </p>
          </>
        )}
      </div>
    </div>
  );
}
