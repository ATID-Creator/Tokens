"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { translateCategory } from "@/lib/categories";
import type { Book } from "@/lib/types";

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const t = useTranslations("catalog");
  const tCat = useTranslations("categories");
  const tCommon = useTranslations("common");
  const available = book.available_copies > 0;

  const categoryLabel = translateCategory(tCat, book.category);

  return (
    <Link
      href={`/books/${book.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div
        className="relative flex h-44 items-end p-5"
        style={{ backgroundColor: book.cover_color }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <span className="relative rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          {categoryLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base font-bold text-stone-900 group-hover:text-amber-800">
          {book.title}
        </h3>
        <p className="mt-1 text-sm text-stone-500">{book.author}</p>
        <p className="mt-3 line-clamp-2 flex-1 text-xs leading-relaxed text-stone-400">
          {book.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-stone-400">
            {book.published_year}{tCommon("year")}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              available
                ? "bg-emerald-50 text-emerald-700"
                : "bg-stone-100 text-stone-500"
            }`}
          >
            {available ? t("inStock", { count: book.available_copies }) : t("borrowedOut")}
          </span>
        </div>
      </div>
    </Link>
  );
}
