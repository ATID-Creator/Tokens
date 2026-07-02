"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-locale": locale,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(data.error);
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">{t("loginTitle")}</h1>
        <p className="mt-2 text-sm text-stone-500">{t("loginSubtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700">
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-700">
              {t("password")}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-700 py-3 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-50"
          >
            {loading ? t("loggingIn") : t("loginTitle")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          {t("noAccount")}{" "}
          <Link href="/register" className="font-medium text-amber-700 hover:underline">
            {t("registerTitle")}
          </Link>
        </p>

        <div className="mt-6 rounded-lg bg-stone-50 p-4 text-xs text-stone-500">
          <p className="font-medium text-stone-700">{t("demoAccounts")}</p>
          <p className="mt-1">{t("demoUser")}</p>
          <p>{t("demoAdmin")}</p>
        </div>
      </div>
    </div>
  );
}
