import seedMembers from "@/data/members.json";

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

/** Read an image file and downscale it to a compact data URL for local storage. */
export function fileToDataUrl(file: File, maxSize = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(String(reader.result));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}


export function getMembers(): Member[] {
  if (typeof window === "undefined") return seed;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Member[];
    } catch {
      // fall through to seed
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

export function saveMembers(members: Member[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
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
    sessionStorage.setItem(AUTH_KEY, "admin");
    return "admin";
  }
  if (password === MEMBER_PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, "member");
    return "member";
  }
  return null;
}

export function logout() {
  if (typeof window !== "undefined") sessionStorage.removeItem(AUTH_KEY);
}

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(AUTH_KEY) as Role | null;
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
