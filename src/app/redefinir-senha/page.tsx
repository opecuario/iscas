"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { atualizarSenha } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    let ativo = true;
    let prontoLocal = false;

    console.log("[reset] URL completa:", window.location.href);
    console.log("[reset] hash:", window.location.hash);
    console.log("[reset] search:", window.location.search);

    function marcarPronto() {
      if (!ativo || prontoLocal) return;
      prontoLocal = true;
      console.log("[reset] sessão detectada — liberando formulário");
      setPronto(true);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[reset] auth event:", event, "sessão?", !!session);
      if (event === "PASSWORD_RECOVERY" || session) marcarPronto();
    });
    supabase.auth.getSession().then(({ data, error }) => {
      console.log("[reset] getSession:", { session: !!data.session, error });
      if (data.session) marcarPronto();
    });

    const timeout = setTimeout(() => {
      if (!ativo || prontoLocal) return;
      console.warn("[reset] timeout — nenhuma sessão apareceu em 3.5s");
      setErro(
        "Link inválido ou expirado. Solicite um novo link de recuperação."
      );
    }, 3500);

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha.length < 6) {
      setErro("Senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (senha !== confirma) {
      setErro("As senhas não conferem.");
      return;
    }
    setLoading(true);
    const resultado = await atualizarSenha(senha);
    setLoading(false);
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setSucesso(true);
    setTimeout(() => router.replace("/"), 1500);
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
          <h1 className="text-xl font-bold text-brand-900">Nova senha</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Defina uma nova senha para acessar sua conta.
          </p>

          {sucesso ? (
            <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              Senha alterada! Redirecionando…
            </div>
          ) : !pronto && !erro ? (
            <p className="mt-6 text-sm text-neutral-500">Validando link…</p>
          ) : !pronto ? (
            <>
              <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {erro}
              </div>
              <p className="mt-4 text-center text-xs text-neutral-600">
                <Link
                  href="/esqueci-senha"
                  className="font-semibold text-brand-800 hover:underline"
                >
                  Pedir novo link
                </Link>
              </p>
            </>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-brand-900/80">
                  Nova senha
                </span>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoFocus
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-brand-900/80">
                  Confirme a senha
                </span>
                <input
                  type="password"
                  value={confirma}
                  onChange={(e) => setConfirma(e.target.value)}
                  placeholder="Repita a senha"
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
                {loading ? "Salvando…" : "Salvar nova senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
