"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUsuario } from "@/components/UsuarioProvider";
import { isAdmin } from "@/lib/admin";
import { limparSessao } from "@/lib/storage";

const NAV = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/simulacoes", label: "Simulações" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = useUsuario();
  const router = useRouter();
  const pathname = usePathname();
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    if (usuario === null) return;
    if (!isAdmin(usuario)) {
      router.replace("/");
      return;
    }
    setVerificado(true);
  }, [usuario, router]);

  if (!verificado) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        Verificando permissões…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-brand-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={140}
                height={24}
                priority
                className="h-6 w-auto brightness-0 invert"
              />
              <span className="rounded bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Admin
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-medium text-white/80 hover:text-white"
            >
              ← Voltar para o app
            </Link>
            <button
              onClick={() => {
                limparSessao();
                router.replace("/login");
              }}
              className="rounded-md border border-white/30 bg-transparent px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10"
            >
              Sair
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl items-center gap-1 px-4">
          {NAV.map((item) => {
            const ativa =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b-2 px-3 py-2 text-sm transition ${
                  ativa
                    ? "border-white font-semibold text-white"
                    : "border-transparent text-white/70 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
