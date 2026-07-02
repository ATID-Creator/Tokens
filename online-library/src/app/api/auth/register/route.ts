import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { getLocaleFromRequest, tError } from "@/lib/locale";

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  const { email, password, name } = await request.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: await tError(locale, "ALL_FIELDS_REQUIRED") }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: await tError(locale, "PASSWORD_TOO_SHORT") }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return NextResponse.json({ error: await tError(locale, "EMAIL_EXISTS") }, { status: 409 });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)"
  ).run(email, hash, name);

  await setSessionCookie(Number(result.lastInsertRowid));

  return NextResponse.json({
    user: {
      id: result.lastInsertRowid,
      email,
      name,
      isAdmin: false,
    },
  }, { status: 201 });
}
