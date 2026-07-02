"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import type { BorrowRecord } from "@/lib/types";

export default function MyBooksPage() {
  const t = useTranslations("myBooks");
  const locale = useLocale();
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const fetchRecords = () => {
    fetch("/api/borrow")
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setRecords(data.records);
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    fetchRecords();
  }, [router]);

  const handleReturn = async (bookId: number) => {
    setActionLoading(bookId);
    setMessage("");

    const res = await fetch("/api/borrow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-locale": locale,
      },
      body: JSON.stringify({ bookId, action: "return" }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      fetchRecords();
    }
    setActionLoading(null);
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(locale);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-48 animate-pulse rounded-2xl bg-stone-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">{t("title")}</h1>
      <p className="mt-2 text-sm text-stone-500">{t("subtitle")}</p>

      {message && (
        <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      {records.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-stone-50 py-16 text-center">
          <p className="text-4xl">📭</p>
          <p className="mt-3 text-lg font-medium text-stone-700">{t("empty")}</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-amber-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-800"
          >
            {t("browseCatalog")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div
                className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: record.cover_color || "#6366f1" }}
              >
                📖
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/books/${record.book_id}`}
                  className="font-semibold text-stone-900 hover:text-amber-800"
                >
                  {record.book_title}
                </Link>
                <p className="text-sm text-stone-500">{record.book_author}</p>
                <p className={`mt-1 text-xs ${isOverdue(record.due_date) ? "font-medium text-red-600" : "text-stone-400"}`}>
                  {t("dueDate")}: {formatDate(record.due_date)}
                  {isOverdue(record.due_date) && ` ${t("overdue")}`}
                </p>
              </div>
              <button
                onClick={() => handleReturn(record.book_id)}
                disabled={actionLoading === record.book_id}
                className="shrink-0 rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
              >
                {actionLoading === record.book_id ? t("returning") : t("return")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
