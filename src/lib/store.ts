import seedMembers from "@/data/members.json";

/** Thrown when the browser blocks read/write access to local/session storage
 * (common in private/incognito mode or in-app browsers like WhatsApp/Instagram). */
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
  awards: string;
  social_media: string;
  photo_url: string;
  profile_claimed: boolean;
};

export type Role = "member" | "admin";

const STORAGE_KEY = "mkcgian1997_members_v1";
const AUTH_KEY = "mkcgian1997_auth_v1";

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
const MAX_UPLOAD_BYTES = 450 * 1024;

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


export function getMembers(): Member[] {
  if (typeof window === "undefined") return seed;
  const raw = safeGet(localStorage, STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Member[];
    } catch {
      // fall through to seed
    }
  }
  safeSet(localStorage, STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

export function saveMembers(members: Member[]) {
  safeSet(localStorage, STORAGE_KEY, JSON.stringify(members));
}

export function updateMember(id: number, updates: Partial<Member>): Member | null {
  const members = getMembers();
  const idx = members.findIndex((m) => m.id === id);
  const existing = members[idx];
  if (idx === -1 || !existing) return null;
  const updated: Member = { ...existing, ...updates, profile_claimed: true };
  members[idx] = updated;
  saveMembers(members);
  return updated;
}

export function resetToSeed() {
  saveMembers(seed);
}

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
