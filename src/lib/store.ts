import { supabase } from "@/integrations/supabase/client";
import seedMembers from "@/data/members.json";

/** Thrown when the browser blocks read/write access to session storage
 * (common in private/incognito mode or in-app browsers like WhatsApp/Instagram).
 * Only used for the local password-gate flag — member data itself lives in Supabase. */
export class StorageUnavailableError extends Error {}

const STORAGE_BLOCKED_MESSAGE =
  "Your browser is blocking storage for this site — this happens most often in private/incognito mode or an app's built-in browser (e.g. opening the link inside WhatsApp or Instagram). Please open this link in your regular browser (Chrome, Safari, etc.) and try again.";

function safeGet(store: Storage, key: string): string | null {
  try {
    return store.getItem(key);
  } catch {
    throw new StorageUnavailableError(STORAGE_BLOCKED_MESSAGE);
  }
}

function safeSet(store: Storage, key: string, value: string) {
  try {
    store.setItem(key, value);
  } catch {
    throw new StorageUnavailableError(STORAGE_BLOCKED_MESSAGE);
  }
}

function safeRemove(store: Storage, key: string) {
  try {
    store.removeItem(key);
  } catch {
    // best-effort; nothing meaningful to surface on logout
  }
}

export type Member = {
  id: number;
  name: string;
  birth_month: number | null;
  birth_day: number | null;
  address: string;
  spouse: string;
  habits: string;
  profession: string;
  current_position: string;
  family: string;
  social_media: string;
  photo_url: string;
  profile_claimed: boolean;
};

export type Role = "member" | "admin";

const AUTH_KEY = "mkcgian1997_auth_v1";

/** Only the columns the app actually uses (the table also has legacy
 * awards/certificates columns that the UI no longer surfaces). */
const MEMBER_COLUMNS =
  "id,name,birth_month,birth_day,address,spouse,habits,profession,current_position,family,social_media,photo_url,profile_claimed";

const seed = seedMembers as unknown as Member[];

/** Deterministic spectrum colour per student — golden-angle hue spread. */
export function memberSpectrum(id: number) {
  const hue = (id * 137.508) % 360;
  return {
    hue,
    solid: `oklch(0.55 0.17 ${hue})`,
    soft: `oklch(0.94 0.05 ${hue})`,
    ring: `oklch(0.72 0.14 ${hue})`,
    gradient: `linear-gradient(135deg, oklch(0.62 0.18 ${hue}), oklch(0.46 0.16 ${(hue + 38) % 360}))`,
  };
}

/** Max size (in bytes) any uploaded photo/document is allowed to occupy once stored. */
export const MAX_UPLOAD_BYTES = 450 * 1024;

function dataUrlByteSize(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.ceil((base64.length * 3) / 4);
}

/**
 * Read an image file, downscale it, and compress it until it fits within
 * maxBytes. Rejects with a clear message if it still doesn't fit even at
 * the smallest acceptable quality/size.
 */
export function fileToDataUrl(
  file: File,
  maxSize = 900,
  maxBytes = MAX_UPLOAD_BYTES,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const dimensionSteps = [maxSize, maxSize * 0.75, maxSize * 0.55, maxSize * 0.4];
        const qualitySteps = [0.82, 0.68, 0.55, 0.4];

        for (const dim of dimensionSteps) {
          const scale = Math.min(1, dim / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(String(reader.result));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          for (const quality of qualitySteps) {
            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            if (dataUrlByteSize(dataUrl) <= maxBytes) {
              resolve(dataUrl);
              return;
            }
          }
        }

        reject(
          new Error(
            `This photo is still over ${Math.round(maxBytes / 1024)} KB even after compression — please choose a smaller or simpler image.`,
          ),
        );
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

// --- Member data (Supabase-backed — shared across every device) ---

export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from("members")
    .select(MEMBER_COLUMNS)
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Member[];
}

export async function updateMember(id: number, updates: Partial<Member>): Promise<Member | null> {
  const { data, error } = await supabase
    .from("members")
    .update({ ...updates, profile_claimed: true })
    .eq("id", id)
    .select(MEMBER_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as Member;
}

export async function insertMember(member: Member): Promise<Member> {
  const { data, error } = await supabase
    .from("members")
    .insert(member)
    .select(MEMBER_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as Member;
}

export async function deleteMemberRow(id: number): Promise<void> {
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Wipes and replaces every row — used for full backup import and reset-to-seed. */
export async function replaceAllMembers(members: Member[]): Promise<void> {
  const { error: delErr } = await supabase.from("members").delete().gte("id", 0);
  if (delErr) throw new Error(delErr.message);
  if (members.length) {
    const { error: insErr } = await supabase.from("members").insert(members);
    if (insErr) throw new Error(insErr.message);
  }
}

export async function resetToSeed(): Promise<void> {
  await replaceAllMembers(seed);
}

// --- Auth (simple shared-password model, unchanged) ---

const MEMBER_PASSWORD = "mkcgian1997";
const ADMIN_PASSWORD = "mkcgian1997admin";

export function login(password: string): Role | null {
  if (password === ADMIN_PASSWORD) {
    safeSet(sessionStorage, AUTH_KEY, "admin");
    return "admin";
  }
  if (password === MEMBER_PASSWORD) {
    safeSet(sessionStorage, AUTH_KEY, "member");
    return "member";
  }
  return null;
}

export function logout() {
  if (typeof window !== "undefined") safeRemove(sessionStorage, AUTH_KEY);
}

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  try {
    return safeGet(sessionStorage, AUTH_KEY) as Role | null;
  } catch {
    return null;
  }
}

export const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
