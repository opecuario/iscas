"use client";

import { supabase } from "./supabase";
import { inputsCriaPadrao } from "./calculationsCria";
import type {
  CustoExtra,
  Fase,
  InputsBase,
  InputsCria,
  TipoSimulador,
  VarianteOverride,
} from "./types";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  estado: string;
  simulacoesIlimitadas: boolean;
  createdAt: string;
}

export type EtapaAtual = "realista" | "otimista" | "pessimista" | "finalizado";

interface SimulacaoBase {
  id: string;
  usuarioId: string;
  nome: string;
  etapaAtual: EtapaAtual;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimulacaoRecriaEngorda extends SimulacaoBase {
  tipo: "recria_engorda";
  inputs: InputsBase;
  otimista: VarianteOverride | null;
  pessimista: VarianteOverride | null;
}

export interface SimulacaoCria extends SimulacaoBase {
  tipo: "cria";
  inputs: InputsCria;
  otimista: null;
  pessimista: null;
}

export type SimulacaoSalva = SimulacaoRecriaEngorda | SimulacaoCria;

export const TIPO_SIMULADOR_LABEL: Record<TipoSimulador, string> = {
  recria_engorda: "Recria / engorda",
  cria: "Cria",
};

export const LIMITE_SIMULACOES = 2;

type UsuarioRow = {
  id: string;
  email: string;
  nome: string;
  telefone: string | null;
  estado: string | null;
  simulacoes_ilimitadas: boolean | null;
  created_at: string;
};

type SimulacaoRow = {
  id: string;
  usuario_id: string;
  nome: string;
  tipo: string;
  etapa_atual: string;
  inputs: unknown;
  otimista: unknown;
  pessimista: unknown;
  created_at: string;
  updated_at: string;
};

// ---------- Migração de shape antigo -> fases ------------------
// Simulações criadas antes do suporte a múltiplas fases têm campos top-level
// (gmd, periodoDias, areaHa, mortalidadePct, consumoSuplementoPctPV, precoSuplementoKg).
// Convertemos para uma única fase "Período único" para manter compatibilidade.

const FASE_UNICA_ID = "periodo-unico";

type InputsAntigo = {
  gmd?: number;
  periodoDias?: number;
  areaHa?: number;
  mortalidadePct?: number;
  consumoSuplementoPctPV?: number;
  precoSuplementoKg?: number;
};

function extrairObservacoes(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const v = (raw as Record<string, unknown>).__observacoes;
  return typeof v === "string" && v.trim() ? v : undefined;
}

function migrarInputs(raw: unknown): InputsBase {
  const r = (raw ?? {}) as Partial<InputsBase> & InputsAntigo & Record<string, unknown>;
  const temFases = Array.isArray(r.fases) && r.fases.length > 0;

  const fases: Fase[] = temFases
    ? (r.fases as Fase[])
    : [
        {
          id: FASE_UNICA_ID,
          nome: "Período único",
          diasNoPeriodo: Number(r.periodoDias ?? 0),
          areaHa: Number(r.areaHa ?? 0),
          gmd: Number(r.gmd ?? 0),
          mortalidadePct: Number(r.mortalidadePct ?? 0),
          consumoSuplementoPctPV: Number(r.consumoSuplementoPctPV ?? 0),
          precoSuplementoKg: Number(r.precoSuplementoKg ?? 0),
        },
      ];

  return {
    precoCompraArroba: Number(r.precoCompraArroba ?? 0),
    pesoCompraKg: Number(r.pesoCompraKg ?? 0),
    freteComissaoCab: Number(r.freteComissaoCab ?? 0),
    qtdCabecas: Number(r.qtdCabecas ?? 0),
    fases,
    salariosMensal: Number(r.salariosMensal ?? 0),
    sanidadeCab: Number(r.sanidadeCab ?? 0),
    pastagemCabMes: Number(r.pastagemCabMes ?? 0),
    custosExtras: (r.custosExtras as CustoExtra[] | undefined) ?? [],
    taxasVendaCab: Number(r.taxasVendaCab ?? 0),
    precoVendaArroba: Number(r.precoVendaArroba ?? 0),
    rendimentoCarcacaPct: Number(r.rendimentoCarcacaPct ?? 0.5),
    financiamentoAtivo: Boolean(r.financiamentoAtivo ?? false),
    financiamentoTaxaAnualPct: Number(r.financiamentoTaxaAnualPct ?? 0),
    financiamentoValorCaptado: Number(r.financiamentoValorCaptado ?? 0),
  };
}

function migrarVariante(
  raw: unknown,
  fases: Fase[]
): VarianteOverride | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<VarianteOverride> & { gmd?: number };

  let gmdPorFase: Record<string, number>;
  if (r.gmdPorFase && typeof r.gmdPorFase === "object") {
    gmdPorFase = { ...r.gmdPorFase };
  } else if (typeof r.gmd === "number") {
    // Variante antiga: um único GMD. Aplica a todas as fases (normalmente 1 só).
    gmdPorFase = {};
    for (const f of fases) gmdPorFase[f.id] = r.gmd;
  } else {
    gmdPorFase = {};
  }

  return {
    precoCompraArroba: Number(r.precoCompraArroba ?? 0),
    precoVendaArroba: Number(r.precoVendaArroba ?? 0),
    gmdPorFase,
  };
}

function mapUsuario(row: UsuarioRow): Usuario {
  return {
    id: row.id,
    email: row.email,
    nome: row.nome,
    telefone: row.telefone ?? "",
    estado: row.estado ?? "",
    simulacoesIlimitadas: row.simulacoes_ilimitadas ?? false,
    createdAt: row.created_at,
  };
}

function migrarInputsCria(raw: unknown): InputsCria {
  const padrao = inputsCriaPadrao();
  if (!raw || typeof raw !== "object") return padrao;
  const r = raw as Partial<InputsCria> & Record<string, unknown>;
  return {
    ...padrao,
    ...r,
    fasesReproducao: Array.isArray(r.fasesReproducao)
      ? (r.fasesReproducao as InputsCria["fasesReproducao"])
      : [],
    custosExtras: Array.isArray(r.custosExtras)
      ? (r.custosExtras as CustoExtra[])
      : [],
  };
}

function mapSimulacao(row: SimulacaoRow): SimulacaoSalva {
  const tipo: TipoSimulador = row.tipo === "cria" ? "cria" : "recria_engorda";
  if (tipo === "cria") {
    const inputs = migrarInputsCria(row.inputs);
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      nome: row.nome,
      tipo: "cria",
      etapaAtual: row.etapa_atual as EtapaAtual,
      inputs,
      otimista: null,
      pessimista: null,
      observacoes: extrairObservacoes(row.inputs),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  const inputs = migrarInputs(row.inputs);
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    nome: row.nome,
    tipo: "recria_engorda",
    etapaAtual: row.etapa_atual as EtapaAtual,
    inputs,
    otimista: migrarVariante(row.otimista, inputs.fases),
    pessimista: migrarVariante(row.pessimista, inputs.fases),
    observacoes: extrairObservacoes(row.inputs),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------- Autenticação --------------------------------------

export type AuthResultado = { ok: true } | { ok: false; erro: string };

export async function cadastrar(params: {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  estado: string;
}): Promise<AuthResultado> {
  const email = params.email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: params.senha,
    options: { data: { nome: params.nome } },
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return { ok: false, erro: "Já existe cadastro com este e-mail. Entre pelo login." };
    }
    return { ok: false, erro: error.message };
  }
  if (!data.user) return { ok: false, erro: "Não foi possível concluir o cadastro." };

  const { error: insertErr } = await supabase.from("usuarios").insert({
    id: data.user.id,
    email,
    nome: params.nome.trim(),
    telefone: params.telefone.trim() || null,
    estado: params.estado || null,
  });
  if (insertErr) return { ok: false, erro: insertErr.message };

  return { ok: true };
}

export async function entrar(email: string, senha: string): Promise<AuthResultado> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha,
  });
  if (error) return { ok: false, erro: "E-mail ou senha incorretos." };
  return { ok: true };
}

export async function sair(): Promise<void> {
  await supabase.auth.signOut();
}

export async function enviarRecuperacaoSenha(email: string): Promise<AuthResultado> {
  const norm = email.trim().toLowerCase();
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const { error } = await supabase.auth.resetPasswordForEmail(norm, {
    redirectTo: `${origin}/redefinir-senha`,
  });
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

export async function atualizarSenha(novaSenha: string): Promise<AuthResultado> {
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

// ---------- Usuário atual -------------------------------------

export async function getUsuario(): Promise<Usuario | null> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", uid)
    .maybeSingle();
  if (error || !data) return null;
  return mapUsuario(data as UsuarioRow);
}

// ---------- Usuários (admin via RLS) --------------------------

export async function listUsuarios(): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => mapUsuario(r as UsuarioRow));
}

export async function getUsuarioPorEmail(email: string): Promise<Usuario | null> {
  const norm = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", norm)
    .maybeSingle();
  if (error || !data) return null;
  return mapUsuario(data as UsuarioRow);
}

// ---------- Simulações ----------------------------------------

export async function listSimulacoes(): Promise<SimulacaoSalva[]> {
  const { data, error } = await supabase
    .from("simulacoes")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => mapSimulacao(r as SimulacaoRow));
}

export async function listSimulacoesDoUsuarioLogado(): Promise<SimulacaoSalva[]> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from("simulacoes")
    .select("*")
    .eq("usuario_id", uid)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => mapSimulacao(r as SimulacaoRow));
}

export async function getSimulacao(id: string): Promise<SimulacaoSalva | null> {
  const { data, error } = await supabase
    .from("simulacoes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapSimulacao(data as SimulacaoRow);
}

export async function upsertSimulacao(s: SimulacaoSalva): Promise<AuthResultado> {
  const inputsComMeta = s.observacoes?.trim()
    ? { ...s.inputs, __observacoes: s.observacoes.trim() }
    : s.inputs;
  const row = {
    id: s.id,
    usuario_id: s.usuarioId,
    nome: s.nome,
    tipo: s.tipo,
    etapa_atual: s.etapaAtual,
    inputs: inputsComMeta,
    otimista: s.otimista,
    pessimista: s.pessimista,
  };
  const { error } = await supabase.from("simulacoes").upsert(row);
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

export async function duplicarSimulacao(id: string): Promise<AuthResultado & { novoId?: string }> {
  const original = await getSimulacao(id);
  if (!original) return { ok: false, erro: "Simulação não encontrada." };
  const novoId = gerarId();
  const agora = new Date().toISOString();
  const copia: SimulacaoSalva = {
    ...original,
    id: novoId,
    nome: `${original.nome} (cópia)`,
    createdAt: agora,
    updatedAt: agora,
  };
  const res = await upsertSimulacao(copia);
  if (!res.ok) return res;
  return { ok: true, novoId };
}

export async function deleteSimulacao(id: string): Promise<void> {
  await supabase.from("simulacoes").delete().eq("id", id);
}

export function gerarId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
