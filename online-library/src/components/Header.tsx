"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/types";

export default function Header() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-700 text-lg text-white shadow-sm">
            📚
          </span>
          <div>
            <p className="text-lg font-bold tracking-tight text-stone-900 group-hover:text-amber-800">
              オンライン図書館
            </p>
            <p className="text-xs text-stone-500">Digital Library</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/">蔵書一覧</NavLink>
          {user && <NavLink href="/my-books">借りている本</NavLink>}
          {user?.isAdmin && <NavLink href="/admin">管理画面</NavLink>}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="text-sm text-stone-600">
                こんにちは、<span className="font-medium text-stone-900">{user.name}</span> さん
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              >
                ログイン
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-800"
              >
                新規登録
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-stone-600 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="メニュー"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-stone-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            <NavLink href="/" mobile>蔵書一覧</NavLink>
            {user && <NavLink href="/my-books" mobile>借りている本</NavLink>}
            {user?.isAdmin && <NavLink href="/admin" mobile>管理画面</NavLink>}
            {user ? (
              <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50">
                ログアウト
              </button>
            ) : (
              <>
                <NavLink href="/login" mobile>ログイン</NavLink>
                <NavLink href="/register" mobile>新規登録</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, children, mobile }: { href: string; children: React.ReactNode; mobile?: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-lg font-medium text-stone-700 transition hover:bg-stone-100 hover:text-amber-800 ${
        mobile ? "px-3 py-2 text-sm" : "px-3 py-2 text-sm"
      }`}
    >
      {children}
    </Link>
  );
}
