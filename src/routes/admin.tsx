import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, Plus, LogOut, Download, Upload } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  getMembers,
  getRole,
  logout,
  resetToSeed,
  saveMembers,
  StorageUnavailableError,
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
  const navigate = useNavigate();

  useEffect(() => {
    if (getRole() !== "admin") {
      navigate({ to: "/" });
      return;
    }
    setMembers(getMembers());
  }, [navigate]);

  function refresh(updated: Member[]) {
    setMembers(updated);
    try {
      saveMembers(updated);
    } catch (err) {
      alert(
        err instanceof StorageUnavailableError
          ? err.message
          : "Couldn't save changes to this device.",
      );
    }
  }

  function addMember() {
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
      awards: "",
      social_media: "",
      photo_url: "",
      profile_claimed: false,
    };
    refresh([...members, newMember]);
  }

  function deleteMember(id: number) {
    if (!confirm("Remove this batchmate record?")) return;
    refresh(members.filter((m) => m.id !== id));
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
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(String(ev.target?.result)) as Member[];
        refresh(imported);
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
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
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className="flex items-center gap-1"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={addMember}
            className="flex items-center gap-1 bg-maroon text-maroon-foreground px-3 py-2 rounded-lg text-sm font-semibold"
          >
            <Plus size={16} /> Add Batchmate
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 bg-foreground text-background px-3 py-2 rounded-lg text-sm font-semibold"
          >
            <Download size={16} /> Export Backup
          </button>
          <label className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer">
            <Upload size={16} /> Import Backup
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={() => {
              if (confirm("Reset ALL data to original seed list? This cannot be undone.")) {
                try {
                  resetToSeed();
                  setMembers(getMembers());
                } catch (err) {
                  alert(
                    err instanceof StorageUnavailableError
                      ? err.message
                      : "Couldn't reset data on this device.",
                  );
                }
              }
            }}
            className="flex items-center gap-1 bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm font-semibold"
          >
            Reset to Seed Data
          </button>
        </div>

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
                      aria-label={`Delete ${m.name}`}
                      className="text-destructive hover:opacity-80"
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
      </div>
    </div>
  );
}
