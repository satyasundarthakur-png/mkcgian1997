import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, Plus, LogOut, Download, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  signOut,
  useAddMemberMutation,
  useAdminStatusQuery,
  useDeleteMemberMutation,
  useMembersQuery,
  useSupabaseAuth,
} from "@/lib/store.supabase";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | MKCGIAN 1997" },
      {
        name: "description",
        content:
          "Admin tools for the MKCGIAN 1997 reunion directory: add or remove batchmates and export a backup of the batch records.",
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
  const navigate = useNavigate();
  const { session, loading } = useSupabaseAuth();
  const { data: adminStatus, isLoading: adminLoading } = useAdminStatusQuery();
  const membersQuery = useMembersQuery();
  const addMember = useAddMemberMutation();
  const deleteMember = useDeleteMemberMutation();
  const [error, setError] = useState("");

  const isAdmin = !!adminStatus?.isAdmin;

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!adminLoading && session && adminStatus && !adminStatus.isAdmin) {
      navigate({ to: "/directory" });
    }
  }, [adminLoading, adminStatus, session, navigate]);

  const members = membersQuery.data ?? [];

  async function handleAdd() {
    setError("");
    const name = prompt("Name of the new batchmate?")?.trim();
    if (!name) return;
    const nextId = members.length ? Math.max(...members.map((m) => m.id)) + 1 : 1;
    try {
      await addMember.mutateAsync({ id: nextId, name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add the record.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this batchmate record?")) return;
    setError("");
    try {
      await deleteMember.mutateAsync(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove the record.");
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

  if (loading || adminLoading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream text-maroon">
        <Loader2 className="animate-spin" />
      </div>
    );
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
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleAdd}
            disabled={addMember.isPending}
            className="flex items-center gap-1 bg-maroon text-maroon-foreground px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
          >
            <Plus size={16} /> Add Batchmate
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 bg-foreground text-background px-3 py-2 rounded-lg text-sm font-semibold"
          >
            <Download size={16} /> Export Backup
          </button>
        </div>

        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
        {membersQuery.isError && (
          <p className="mb-3 text-sm text-destructive">
            Couldn't load the batch records. Please refresh.
          </p>
        )}

        <div className="bg-card rounded-xl shadow border border-border overflow-x-auto">
          {membersQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground">
              <Loader2 className="animate-spin" size={18} /> Loading records…
            </div>
          ) : (
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
                        onClick={() => handleDelete(m.id)}
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
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Total records: {members.length}
        </p>
      </div>
    </div>
  );
}
