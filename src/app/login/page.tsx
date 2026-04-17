"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { entrar } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const valor = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor)) {
      setErro("Digite um e-mail válido.");
      return;
    }
    if (senha.length < 6) {
      setErro("Senha deve ter ao menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const resultado = await entrar(valor, senha);
    if (!resultado.ok) {
      setLoading(false);
      setErro(resultado.erro);
      return;
    }
    router.replace("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={260}
            height={40}
            priority
            className="h-10 w-auto"
          />
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-brand-900">Entrar</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Acesse sua conta para ver suas simulações.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-brand-900/80">
                E-mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                autoFocus
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-brand-900/80">
                Senha
              </span>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
            </label>

            {erro && (
              <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-neutral-600">
            Primeira vez por aqui?{" "}
            <Link
              href="/cadastro"
              className="font-semibold text-brand-800 hover:underline"
            >
              Faça seu cadastro
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
