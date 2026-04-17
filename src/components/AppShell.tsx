"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [aberta, setAberta] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setAberta(false);
  }, [pathname]);

  useEffect(() => {
    if (aberta) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberta]);

  return (
    <div className="grid min-h-screen grid-cols-1 bg-sand lg:grid-cols-[280px_1fr]">
      {/* Sidebar fixa em desktop */}
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>

      {/* Top bar mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 shadow-sm lg:hidden">
        <Link href="/" className="block">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={160}
            height={28}
            priority
            className="h-7 w-auto"
          />
        </Link>
        <button
          onClick={() => setAberta(true)}
          aria-label="Abrir menu"
          className="rounded-md border border-neutral-300 bg-white p-2 text-brand-900 hover:bg-neutral-50"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* Drawer mobile */}
      {aberta && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setAberta(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            <div className="flex h-full flex-col bg-white">
              <div className="flex items-center justify-end border-b border-neutral-200 p-2">
                <button
                  onClick={() => setAberta(false)}
                  aria-label="Fechar menu"
                  className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar />
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="min-w-0">
        {children}
        <footer className="mt-10 border-t border-neutral-200 px-4 py-4 text-center text-[11px] text-neutral-500">
          <a
            href="/privacidade"
            className="hover:text-brand-800 hover:underline"
          >
            Política de Privacidade e Termos de Uso
          </a>
        </footer>
      </main>
    </div>
  );
}
