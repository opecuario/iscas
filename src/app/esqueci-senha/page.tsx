"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { enviarRecuperacaoSenha } from "@/lib/storage";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const valor = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor)) {
      setErro("Digite um e-mail válido.");
      return;
    }
    setLoading(true);
    const resultado = await enviarRecuperacaoSenha(valor);
    setLoading(false);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setEnviado(true);
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
          <h1 className="text-xl font-bold text-brand-900">Recuperar senha</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Informe seu e-mail e enviaremos um link para você criar uma nova
            senha.
          </p>

          {enviado ? (
            <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              Enviamos um link para <strong>{email}</strong>. Abra seu e-mail e
              clique no link para criar uma nova senha.
            </div>
          ) : (
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
                {loading ? "Enviando…" : "Enviar link de recuperação"}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-xs text-neutral-600">
            <Link
              href="/login"
              className="font-semibold text-brand-800 hover:underline"
            >
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
