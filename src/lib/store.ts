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
