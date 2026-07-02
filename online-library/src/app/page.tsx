import { Suspense } from "react";
import BookCatalog from "@/components/BookCatalog";

export default function HomePage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-amber-800 via-amber-700 to-stone-800 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-200">Welcome</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            オンライン図書館
          </h1>
          <p className="mt-4 max-w-xl text-lg text-amber-100">
            数千冊の蔵書から、お好みの本を見つけて借りることができます。
            登録は無料、返却期限は借りてから14日間です。
          </p>
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
