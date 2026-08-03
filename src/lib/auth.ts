import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthState = {
  loading: boolean;
  user: User | null;
  isAdmin: boolean;
  /** id of the member row this user has claimed, if any */
  myMemberId: number | null;
};

async function loadProfileState(user: User) {
  const [adminRes, memberRes] = await Promise.all([
    supabase.from("admins").select("email").eq("email", user.email ?? "").maybeSingle(),
    supabase.from("members").select("id").eq("user_id", user.id).maybeSingle(),
  ]);
  return {
    isAdmin: Boolean(adminRes.data),
    myMemberId: (memberRes.data?.id as number | undefined) ?? null,
  };
}

export function useAuth(): AuthState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({
    loading: true,
    user: null,
    isAdmin: false,
    myMemberId: null,
  });

  const sync = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user ?? null;
    if (!user) {
      setState({ loading: false, user: null, isAdmin: false, myMemberId: null });
      return;
    }
    const extra = await loadProfileState(user);
    setState({ loading: false, user, ...extra });
  }, []);

  useEffect(() => {
    void sync();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void sync();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [sync]);

  return { ...state, refresh: sync };
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Link a currently unclaimed member row to the signed-in user. */
export async function claimMember(memberId: number, userId: string) {
  const { error } = await supabase
    .from("members")
    .update({ user_id: userId, profile_claimed: true })
    .eq("id", memberId)
    .is("user_id", null);
  if (error) throw new Error(error.message);
}
