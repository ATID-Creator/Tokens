"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Book, SessionUser } from "@/lib/types";

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch(`/api/books/${id}`).then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([bookData, userData]) => {
      setBook(bookData.book);
      setUser(userData.user);
      setLoading(false);
    });
  }, [id]);

  const handleBorrow = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setActionLoading(true);
    setMessage("");
    setError("");

    const res = await fetch("/api/borrow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: parseInt(id, 10), action: "borrow" }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      const bookRes = await fetch(`/api/books/${id}`);
      const bookData = await bookRes.json();
      setBook(bookData.book);
    } else {
      setError(data.error);
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-96 animate-pulse rounded-2xl bg-stone-200" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg text-stone-600">書籍が見つかりません</p>
        <Link href="/" className="mt-4 inline-block text-amber-700 hover:underline">
          蔵書一覧に戻る
        </Link>
      </div>
    );
  }

  const available = book.available_copies > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700">
        ← 蔵書一覧に戻る
      </Link>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="grid md:grid-cols-5">
          <div
            className="flex min-h-64 items-center justify-center p-8 md:col-span-2"
            style={{ backgroundColor: book.cover_color }}
          >
            <div className="text-center text-white">
              <p className="text-6xl">📖</p>
              <p className="mt-4 text-sm font-medium uppercase tracking-widest opacity-80">
                {book.category}
              </p>
            </div>
          </div>

          <div className="p-8 md:col-span-3">
            <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">{book.title}</h1>
            <p className="mt-2 text-lg text-stone-600">{book.author}</p>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-stone-400">ISBN</dt>
                <dd className="font-medium text-stone-800">{book.isbn}</dd>
              </div>
              <div>
                <dt className="text-stone-400">出版年</dt>
                <dd className="font-medium text-stone-800">{book.published_year}年</dd>
              </div>
              <div>
                <dt className="text-stone-400">カテゴリ</dt>
                <dd className="font-medium text-stone-800">{book.category}</dd>
              </div>
              <div>
                <dt className="text-stone-400">在庫状況</dt>
                <dd className={`font-medium ${available ? "text-emerald-700" : "text-stone-500"}`}>
                  {available
                    ? `${book.available_copies} / ${book.total_copies} 冊 貸出可能`
                    : "現在貸出中"}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              <h2 className="text-sm font-semibold text-stone-700">あらすじ</h2>
              <p className="mt-2 leading-relaxed text-stone-600">{book.description}</p>
            </div>

            {message && (
              <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {message}
              </div>
            )}
            {error && (
              <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="mt-8">
              {available ? (
                <button
                  onClick={handleBorrow}
                  disabled={actionLoading}
                  className="w-full rounded-xl bg-amber-700 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 disabled:opacity-50 sm:w-auto"
                >
                  {actionLoading ? "処理中..." : user ? "この本を借りる" : "ログインして借りる"}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full rounded-xl bg-stone-200 px-6 py-3.5 text-sm font-semibold text-stone-500 sm:w-auto"
                >
                  現在貸出中
                </button>
              )}
              <p className="mt-2 text-xs text-stone-400">※ 返却期限は借りてから14日間です</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
