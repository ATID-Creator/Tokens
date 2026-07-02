import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { getLocaleFromRequest, tError } from "@/lib/locale";

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: await tError(locale, "EMAIL_PASSWORD_REQUIRED") }, { status: 400 });
  }

  const db = getDb();
  const user = db.prepare("SELECT id, email, password_hash, name, is_admin FROM users WHERE email = ?").get(email) as
    | { id: number; email: string; password_hash: string; name: string; is_admin: number }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return NextResponse.json({ error: await tError(locale, "INVALID_CREDENTIALS") }, { status: 401 });
  }

  await setSessionCookie(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.is_admin === 1,
    },
  });
}
