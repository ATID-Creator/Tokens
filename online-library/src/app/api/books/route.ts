import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Book } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("category")?.trim() || "";

  const db = getDb();
  let query = "SELECT * FROM books WHERE 1=1";
  const params: string[] = [];

  if (q) {
    query += " AND (title LIKE ? OR author LIKE ? OR isbn LIKE ? OR description LIKE ?)";
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }

  if (category && category !== "すべて") {
    query += " AND category = ?";
    params.push(category);
  }

  query += " ORDER BY title ASC";

  const books = db.prepare(query).all(...params) as Book[];
  const categories = db.prepare("SELECT DISTINCT category FROM books ORDER BY category").all() as { category: string }[];

  return NextResponse.json({
    books,
    categories: categories.map((c) => c.category),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { requireAdmin, getSessionUser } = await import("@/lib/auth");
    requireAdmin(await getSessionUser());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return NextResponse.json({ error: msg === "FORBIDDEN" ? "管理者権限が必要です" : "ログインが必要です" }, { status: msg === "FORBIDDEN" ? 403 : 401 });
  }

  const body = await request.json();
  const { title, author, isbn, description, category, cover_color, total_copies, published_year } = body;

  if (!title || !author || !isbn) {
    return NextResponse.json({ error: "タイトル、著者、ISBNは必須です" }, { status: 400 });
  }

  const db = getDb();
  const copies = total_copies || 1;

  try {
    const result = db.prepare(`
      INSERT INTO books (title, author, isbn, description, category, cover_color, total_copies, available_copies, published_year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      author,
      isbn,
      description || "",
      category || "一般",
      cover_color || "#6366f1",
      copies,
      copies,
      published_year || new Date().getFullYear()
    );

    const book = db.prepare("SELECT * FROM books WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json({ book }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "ISBNが重複しています" }, { status: 409 });
  }
}
