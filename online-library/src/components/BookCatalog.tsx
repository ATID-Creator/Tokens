"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import BookCard from "./BookCard";
import type { Book } from "@/lib/types";

export default function BookCatalog() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("すべて");
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchBooks = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat && cat !== "すべて") params.set("category", cat);

    const res = await fetch(`/api/books?${params}`);
    const data = await res.json();
    setBooks(data.books);
    setCategories(data.categories);
    setLoading(false);
  }, []);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    const cat = searchParams.get("category") || "すべて";
    setQuery(q);
    setCategory(cat);
    fetchBooks(q, cat);
  }, [searchParams, fetchBooks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category !== "すべて") params.set("category", category);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タイトル、著者、ISBNで検索..."
            className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
        >
          <option value="すべて">すべてのカテゴリ</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-amber-700 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-amber-800"
        >
          検索
        </button>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-stone-200" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 py-16 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-3 text-lg font-medium text-stone-700">該当する書籍が見つかりません</p>
          <p className="mt-1 text-sm text-stone-500">検索条件を変更してお試しください</p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-stone-500">{books.length} 件の書籍</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
