import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import type { Book } from "@/lib/types";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(parseInt(params.id, 10)) as Book | undefined;

  if (!book) {
    return NextResponse.json({ error: "書籍が見つかりません" }, { status: 404 });
  }

  return NextResponse.json({ book });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(await getSessionUser());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return NextResponse.json({ error: msg === "FORBIDDEN" ? "管理者権限が必要です" : "ログインが必要です" }, { status: msg === "FORBIDDEN" ? 403 : 401 });
  }

  const body = await request.json();
  const db = getDb();
  const id = parseInt(params.id, 10);

  const existing = db.prepare("SELECT * FROM books WHERE id = ?").get(id) as Book | undefined;
  if (!existing) {
    return NextResponse.json({ error: "書籍が見つかりません" }, { status: 404 });
  }

  const borrowed = existing.total_copies - existing.available_copies;
  const newTotal = body.total_copies ?? existing.total_copies;
  const newAvailable = Math.max(0, newTotal - borrowed);

  db.prepare(`
    UPDATE books SET
      title = ?, author = ?, isbn = ?, description = ?,
      category = ?, cover_color = ?, total_copies = ?,
      available_copies = ?, published_year = ?
    WHERE id = ?
  `).run(
    body.title ?? existing.title,
    body.author ?? existing.author,
    body.isbn ?? existing.isbn,
    body.description ?? existing.description,
    body.category ?? existing.category,
    body.cover_color ?? existing.cover_color,
    newTotal,
    newAvailable,
    body.published_year ?? existing.published_year,
    id
  );

  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(id) as Book;
  return NextResponse.json({ book });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(await getSessionUser());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return NextResponse.json({ error: msg === "FORBIDDEN" ? "管理者権限が必要です" : "ログインが必要です" }, { status: msg === "FORBIDDEN" ? 403 : 401 });
  }

  const db = getDb();
  const id = parseInt(params.id, 10);

  const activeBorrows = db.prepare(
    "SELECT COUNT(*) as count FROM borrow_records WHERE book_id = ? AND returned_at IS NULL"
  ).get(id) as { count: number };

  if (activeBorrows.count > 0) {
    return NextResponse.json({ error: "貸出中の書籍は削除できません" }, { status: 400 });
  }

  db.prepare("DELETE FROM borrow_records WHERE book_id = ?").run(id);
  db.prepare("DELETE FROM books WHERE id = ?").run(id);

  return NextResponse.json({ success: true });
}
