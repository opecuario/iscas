"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cadastrar, type TipoUsuario } from "@/lib/storage";

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const TIPO_USUARIO_LABEL: Record<TipoUsuario, string> = {
  pecuarista: "Pecuarista",
  profissional: "Profissional (consultor, zootecnista, veterinário…)",
  outro: "Outro",
};

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
    municipio: "",
    tipoUsuario: "" as TipoUsuario | "",
    hectaresPasto: "",
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
    const municipio = form.municipio.trim();
    const tipoUsuario = form.tipoUsuario;
    const hectaresStr = form.hectaresPasto.replace(",", ".").trim();
    const hectaresParsed = hectaresStr ? Number(hectaresStr) : NaN;

    if (!nome) return setErro("Informe seu nome.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErro("E-mail inválido.");
    if (senha.length < 6) return setErro("A senha precisa ter ao menos 6 caracteres.");
    if (telefone.replace(/\D/g, "").length < 10) return setErro("Telefone inválido.");
    if (!estado) return setErro("Selecione o estado.");
    if (!municipio) return setErro("Informe o município.");
    if (!tipoUsuario) return setErro("Selecione o tipo de usuário.");
    if (
      tipoUsuario === "pecuarista" &&
      (!hectaresStr || !isFinite(hectaresParsed) || hectaresParsed <= 0)
    ) {
      return setErro("Informe quantos hectares de pasto a sua área tem.");
    }

    setLoading(true);
    const resultado = await cadastrar({
      nome,
      email,
      senha,
      telefone,
      estado,
      municipio,
      tipoUsuario,
      hectaresPasto:
        tipoUsuario === "pecuarista" ? hectaresParsed : null,
    });
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr]">
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
              <Campo
                label="Município"
                value={form.municipio}
                onChange={(v) => setForm({ ...form, municipio: v })}
                placeholder="Ex.: Cuiabá"
              />
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-brand-900/80">
                Você é
              </span>
              <select
                value={form.tipoUsuario}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipoUsuario: e.target.value as TipoUsuario | "",
                    hectaresPasto:
                      e.target.value === "pecuarista"
                        ? form.hectaresPasto
                        : "",
                  })
                }
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              >
                <option value="">Selecione…</option>
                {(Object.keys(TIPO_USUARIO_LABEL) as TipoUsuario[]).map(
                  (t) => (
                    <option key={t} value={t}>
                      {TIPO_USUARIO_LABEL[t]}
                    </option>
                  )
                )}
              </select>
            </label>

            {form.tipoUsuario === "pecuarista" && (
              <Campo
                label="Hectares de pasto"
                value={form.hectaresPasto}
                onChange={(v) =>
                  setForm({
                    ...form,
                    hectaresPasto: v.replace(/[^0-9.,]/g, ""),
                  })
                }
                placeholder="Ex.: 250"
                inputMode="decimal"
              />
            )}

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
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-brand-900/80">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
      />
    </label>
  );
}
