import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "オンライン図書館 | Digital Library",
  description: "いつでもどこでも本が借りられるオンライン図書館",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">
        <Header />
        <main>{children}</main>
        <footer className="mt-16 border-t border-stone-200 bg-white py-8">
          <div className="mx-auto max-w-6xl px-4 text-center text-sm text-stone-500">
            <p>© 2026 オンライン図書館 — 知の扉を、あなたの手元に</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
