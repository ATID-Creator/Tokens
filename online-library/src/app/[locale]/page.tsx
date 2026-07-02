import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import BookCatalog from "@/components/BookCatalog";
import type { Locale } from "@/i18n/routing";

export default async function HomePage({ params: { locale } }: { params: { locale: Locale } }) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <div>
      <section className="bg-gradient-to-br from-amber-800 via-amber-700 to-stone-800 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-200">{t("welcome")}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{t("title")}</h1>
          <p className="mt-4 max-w-xl text-lg text-amber-100">{t("description")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <Suspense fallback={
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-stone-200" />
            ))}
          </div>
        }>
          <BookCatalog />
        </Suspense>
      </section>
    </div>
  );
}
