import { useEffect, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type MemberRow = Tables<"members">;

/** Safe card shown in the directory to every signed-in batchmate. */
export type DirectoryMember = {
  id: number;
  name: string;
  birth_month: number | null;
  birth_day: number | null;
  profession: string;
  current_position: string;
  photo_url: string;
  profile_claimed: boolean;
  is_mine: boolean;
};

/* ------------------------------------------------------------------ auth */

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/directory` },
  });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

export async function signOut() {
  await supabase.auth.signOut();
}

/* ----------------------------------------------------------------- reads */

export function useAdminStatusQuery() {
  const { session } = useSupabaseAuth();
  const email = session?.user.email ?? null;

  return useQuery({
    queryKey: ["admin-status", email],
    enabled: !!email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admins")
        .select("email")
        .eq("email", email!)
        .maybeSingle();
      if (error) throw error;
      return { isAdmin: !!data };
    },
  });
}

/** Directory cards for every batchmate (privacy-safe columns only). */
export function useMembersDirectoryQuery() {
  const { session } = useSupabaseAuth();

  return useQuery({
    queryKey: ["members-directory"],
    enabled: !!session,
    queryFn: async (): Promise<DirectoryMember[]> => {
      const { data, error } = await supabase.rpc("list_members_directory");
      if (error) throw error;
      return (data ?? []) as DirectoryMember[];
    },
  });
}

/** Full member rows — access rules limit this to your own row (admins: all). */
export function useMembersQuery() {
  const { session } = useSupabaseAuth();

  return useQuery({
    queryKey: ["members"],
    enabled: !!session,
    queryFn: async (): Promise<MemberRow[]> => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type MemberDetail =
  | { kind: "full"; member: MemberRow }
  | { kind: "limited"; member: DirectoryMember };

export function useMemberQuery(id: string | number) {
  const { session } = useSupabaseAuth();
  const numericId = Number(id);

  return useQuery({
    queryKey: ["member", numericId],
    enabled: !!session && Number.isFinite(numericId),
    queryFn: async (): Promise<MemberDetail | null> => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("id", numericId)
        .maybeSingle();
      if (error) throw error;
      if (data) return { kind: "full", member: data };

      // Not the owner/admin — fall back to the privacy-safe directory card.
      const { data: list, error: listError } = await supabase.rpc("list_members_directory");
      if (listError) throw listError;
      const card = ((list ?? []) as DirectoryMember[]).find((m) => m.id === numericId);
      return card ? { kind: "limited", member: card } : null;
    },
  });
}

/* --------------------------------------------------------------- writes */

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["members"] });
    queryClient.invalidateQueries({ queryKey: ["members-directory"] });
    queryClient.invalidateQueries({ queryKey: ["member"] });
  };
}

export function useUpdateMemberMutation(): UseMutationResult<
  MemberRow,
  Error,
  { id: number; updates: Partial<MemberRow> }
> {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from("members")
        .update(updates)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("You don't have permission to edit this profile.");
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useClaimMemberMutation() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await supabase.rpc("claim_member", { _member_id: id });
      if (error) throw error;
      if (!data) throw new Error("This profile has already been claimed.");
      return true;
    },
    onSuccess: invalidate,
  });
}

export function useAddMemberMutation() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("members")
        .insert({ name })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteMemberMutation() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: invalidate,
  });
}
