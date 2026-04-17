"use client";

import { supabase } from "./supabase";
import type { InputsBase, VarianteOverride } from "./types";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  estado: string;
  createdAt: string;
}

export type EtapaAtual = "realista" | "otimista" | "pessimista" | "finalizado";

export interface SimulacaoSalva {
  id: string;
  usuarioId: string;
  nome: string;
  tipo: "recria_engorda";
  etapaAtual: EtapaAtual;
  inputs: InputsBase;
  otimista: VarianteOverride | null;
  pessimista: VarianteOverride | null;
  createdAt: string;
  updatedAt: string;
}

export const LIMITE_SIMULACOES = 2;

type UsuarioRow = {
  id: string;
  email: string;
  nome: string;
  telefone: string | null;
  estado: string | null;
  created_at: string;
};

type SimulacaoRow = {
  id: string;
  usuario_id: string;
  nome: string;
  tipo: string;
  etapa_atual: string;
  inputs: InputsBase;
  otimista: VarianteOverride | null;
  pessimista: VarianteOverride | null;
  created_at: string;
  updated_at: string;
};

function mapUsuario(row: UsuarioRow): Usuario {
  return {
    id: row.id,
    email: row.email,
    nome: row.nome,
    telefone: row.telefone ?? "",
    estado: row.estado ?? "",
    createdAt: row.created_at,
  };
}

function mapSimulacao(row: SimulacaoRow): SimulacaoSalva {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    nome: row.nome,
    tipo: "recria_engorda",
    etapaAtual: row.etapa_atual as EtapaAtual,
    inputs: row.inputs,
    otimista: row.otimista,
    pessimista: row.pessimista,
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
  const row = {
    id: s.id,
    usuario_id: s.usuarioId,
    nome: s.nome,
    tipo: s.tipo,
    etapa_atual: s.etapaAtual,
    inputs: s.inputs,
    otimista: s.otimista,
    pessimista: s.pessimista,
  };
  const { error } = await supabase.from("simulacoes").upsert(row);
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
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
