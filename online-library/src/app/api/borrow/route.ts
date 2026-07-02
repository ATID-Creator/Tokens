import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser, requireAuth } from "@/lib/auth";
import { getLocaleFromRequest, tError, getMessages } from "@/lib/locale";
import type { Locale } from "@/i18n/routing";

function formatDueDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(locale === "zh-CN" ? "zh-CN" : locale === "zh-TW" ? "zh-TW" : locale);
}

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  let user;
  try {
    user = requireAuth(await getSessionUser());
  } catch {
    return NextResponse.json({ error: await tError(locale, "LOGIN_REQUIRED") }, { status: 401 });
  }

  const { bookId, action } = await request.json();
  if (!bookId || !action) {
    return NextResponse.json({ error: await tError(locale, "MISSING_PARAMS") }, { status: 400 });
  }

  const db = getDb();
  const messages = await getMessages(locale);

  if (action === "borrow") {
    const book = db.prepare("SELECT * FROM books WHERE id = ?").get(bookId) as
      | { id: number; available_copies: number; title: string }
      | undefined;

    if (!book) {
      return NextResponse.json({ error: await tError(locale, "BOOK_NOT_FOUND") }, { status: 404 });
    }

    if (book.available_copies <= 0) {
      return NextResponse.json({ error: await tError(locale, "NO_STOCK") }, { status: 400 });
    }

    const existing = db.prepare(
      "SELECT id FROM borrow_records WHERE user_id = ? AND book_id = ? AND returned_at IS NULL"
    ).get(user.id, bookId);

    if (existing) {
      return NextResponse.json({ error: await tError(locale, "ALREADY_BORROWED") }, { status: 400 });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const borrow = db.transaction(() => {
      db.prepare("UPDATE books SET available_copies = available_copies - 1 WHERE id = ?").run(bookId);
      const result = db.prepare(
        "INSERT INTO borrow_records (user_id, book_id, due_date) VALUES (?, ?, ?)"
      ).run(user.id, bookId, dueDate.toISOString());
      return result.lastInsertRowid;
    })();

    const message = messages.book.borrowSuccess
      .replace("{title}", book.title)
      .replace("{dueDate}", formatDueDate(dueDate, locale));

    return NextResponse.json({
      success: true,
      borrowId: borrow,
      dueDate: dueDate.toISOString(),
      message,
    });
  }

  if (action === "return") {
    const record = db.prepare(
      "SELECT * FROM borrow_records WHERE user_id = ? AND book_id = ? AND returned_at IS NULL"
    ).get(user.id, bookId) as { id: number; book_id: number } | undefined;

    if (!record) {
      return NextResponse.json({ error: await tError(locale, "BORROW_NOT_FOUND") }, { status: 404 });
    }

    db.transaction(() => {
      db.prepare("UPDATE borrow_records SET returned_at = datetime('now') WHERE id = ?").run(record.id);
      db.prepare("UPDATE books SET available_copies = available_copies + 1 WHERE id = ?").run(bookId);
    })();

    return NextResponse.json({
      success: true,
      message: messages.myBooks.returnSuccess,
    });
  }

  return NextResponse.json({ error: await tError(locale, "INVALID_ACTION") }, { status: 400 });
}

export async function GET() {
  let user;
  try {
    user = requireAuth(await getSessionUser());
  } catch {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const db = getDb();
  const records = db.prepare(`
    SELECT br.*, b.title as book_title, b.author as book_author, b.cover_color
    FROM borrow_records br
    JOIN books b ON br.book_id = b.id
    WHERE br.user_id = ? AND br.returned_at IS NULL
    ORDER BY br.due_date ASC
  `).all(user.id);

  return NextResponse.json({ records });
}
