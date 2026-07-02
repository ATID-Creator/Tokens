"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { translateCategory } from "@/lib/categories";
import type { Book } from "@/lib/types";

const COVER_COLORS = ["#6366f1", "#8b5cf6", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#06b6d4"];

const emptyForm = {
  title: "",
  author: "",
  isbn: "",
  description: "",
  category: "一般",
  cover_color: "#6366f1",
  total_copies: 1,
  published_year: new Date().getFullYear(),
};

export default function AdminPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tCat = useTranslations("categories");
  const locale = useLocale();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const fetchBooks = () => {
    fetch("/api/books")
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setBooks(data.books);
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user?.isAdmin) {
          router.push("/");
        } else {
          fetchBooks();
        }
      });
  }, [router]);

  const apiHeaders = {
    "Content-Type": "application/json",
    "x-locale": locale,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    const url = editingId ? `/api/books/${editingId}` : "/api/books";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: apiHeaders,
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(editingId ? t("updateSuccess") : t("addSuccess"));
      setForm(emptyForm);
      setEditingId(null);
      fetchBooks();
    } else {
      setError(data.error);
    }
    setSubmitting(false);
  };

  const handleEdit = (book: Book) => {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description,
      category: book.category,
      cover_color: book.cover_color,
      total_copies: book.total_copies,
      published_year: book.published_year,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("deleteConfirm"))) return;

    const res = await fetch(`/api/books/${id}`, {
      method: "DELETE",
      headers: { "x-locale": locale },
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(t("deleteSuccess"));
      fetchBooks();
    } else {
      setError(data.error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-96 animate-pulse rounded-2xl bg-stone-200" />
      </div>
    );
  }

  const req = t("required");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t("title")}</h1>
      <p className="mt-2 text-sm text-stone-500">{t("subtitle")}</p>

      {message && (
        <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>
      )}
      {error && (
        <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-800">
          {editingId ? t("editBook") : t("addBook")}
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label={`${t("titleLabel")} ${req}`} value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Field label={`${t("authorLabel")} ${req}`} value={form.author} onChange={(v) => setForm({ ...form, author: v })} required />
          <Field label={`${t("isbnLabel")} ${req}`} value={form.isbn} onChange={(v) => setForm({ ...form, isbn: v })} required />
          <Field label={t("categoryLabel")} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Field label={t("stockLabel")} value={String(form.total_copies)} onChange={(v) => setForm({ ...form, total_copies: parseInt(v, 10) || 1 })} type="number" />
          <Field label={t("yearLabel")} value={String(form.published_year)} onChange={(v) => setForm({ ...form, published_year: parseInt(v, 10) || 2020 })} type="number" />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-stone-700">{t("coverColor")}</label>
          <div className="mt-2 flex gap-2">
            {COVER_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm({ ...form, cover_color: color })}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  form.cover_color === color ? "border-stone-900 scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-stone-700">{t("synopsisLabel")}</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-amber-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {submitting ? t("saving") : editingId ? t("update") : t("add")}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-stone-300 px-6 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              {tCommon("cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-stone-800">{t("bookList", { count: books.length })}</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 font-medium text-stone-600">{t("tableTitle")}</th>
                <th className="px-4 py-3 font-medium text-stone-600">{t("tableAuthor")}</th>
                <th className="px-4 py-3 font-medium text-stone-600">{t("tableCategory")}</th>
                <th className="px-4 py-3 font-medium text-stone-600">{t("tableStock")}</th>
                <th className="px-4 py-3 font-medium text-stone-600">{t("tableActions")}</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-stone-900">{book.title}</td>
                  <td className="px-4 py-3 text-stone-600">{book.author}</td>
                  <td className="px-4 py-3 text-stone-600">{translateCategory(tCat, book.category)}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {book.available_copies}/{book.total_copies}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(book)}
                        className="rounded-lg px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                      >
                        {t("edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        className="rounded-lg px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
      />
    </div>
  );
}
