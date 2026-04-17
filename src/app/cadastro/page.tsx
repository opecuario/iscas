"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cadastrar } from "@/lib/storage";

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function mascararTelefone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    estado: "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const nome = form.nome.trim();
    const email = form.email.trim().toLowerCase();
    const senha = form.senha;
    const telefone = form.telefone.trim();
    const estado = form.estado;

    if (!nome) return setErro("Informe seu nome.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErro("E-mail inválido.");
    if (senha.length < 6) return setErro("A senha precisa ter ao menos 6 caracteres.");
    if (telefone.replace(/\D/g, "").length < 10) return setErro("Telefone inválido.");
    if (!estado) return setErro("Selecione o estado.");

    setLoading(true);
    const resultado = await cadastrar({ nome, email, senha, telefone, estado });
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
          <Image src="/logo.svg" alt="Logo" width={260} height={40} priority className="h-10 w-auto" />
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-brand-900">Bem-vindo</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Crie sua conta para acessar o simulador de cenários de recria e engorda.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Campo label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} placeholder="Seu nome completo" />
            <Campo label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="voce@exemplo.com" />
            <Campo label="Senha" type="password" value={form.senha} onChange={(v) => setForm({ ...form, senha: v })} placeholder="Mínimo 6 caracteres" />
            <Campo
              label="Telefone (WhatsApp)"
              value={form.telefone}
              onChange={(v) => setForm({ ...form, telefone: mascararTelefone(v) })}
              placeholder="(11) 99999-9999"
            />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-brand-900/80">Estado</span>
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              >
                <option value="">Selecione…</option>
                {ESTADOS.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </label>

            {erro && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">{erro}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Criando conta…" : "Criar conta e acessar"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-neutral-600">
            Já tem cadastro?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-800 hover:underline"
            >
              Entrar
            </Link>
          </p>
          <p className="mt-3 text-center text-[11px] text-neutral-500">
            Ao criar sua conta, você concorda com nossa{" "}
            <Link
              href="/privacidade"
              target="_blank"
              className="font-semibold text-brand-800 hover:underline"
            >
              Política de Privacidade e Termos de Uso
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-brand-900/80">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
      />
    </label>
  );
}
