import { cookies } from "next/headers";
import { getDb } from "./db";
import type { SessionUser } from "./types";

const SESSION_COOKIE = "library_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function createSession(userId: number): string {
  const token = Buffer.from(`${userId}:${Date.now()}:${Math.random()}`).toString("base64");
  return token;
}

export async function setSessionCookie(userId: number) {
  const token = createSession(userId);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const userId = parseInt(decoded.split(":")[0], 10);
    if (isNaN(userId)) return null;

    const db = getDb();
    const user = db.prepare("SELECT id, email, name, is_admin FROM users WHERE id = ?").get(userId) as
      | { id: number; email: string; name: string; is_admin: number }
      | undefined;

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.is_admin === 1,
    };
  } catch {
    return null;
  }
}

export function requireAuth(user: SessionUser | null): SessionUser {
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export function requireAdmin(user: SessionUser | null): SessionUser {
  const authUser = requireAuth(user);
  if (!authUser.isAdmin) {
    throw new Error("FORBIDDEN");
  }
  return authUser;
}
