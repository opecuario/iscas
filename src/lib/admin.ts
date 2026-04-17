"use client";

import { supabase } from "./supabase";
import {
  getUsuarioPorEmail,
  listSimulacoes,
  listUsuarios,
  type SimulacaoSalva,
  type Usuario,
} from "./storage";

export const ADMIN_EMAILS = ["opecuario@opecuario.com.br"];

export function isAdmin(usuario: Usuario | null): boolean {
  if (!usuario) return false;
  return ADMIN_EMAILS.includes(usuario.email.toLowerCase().trim());
}

export function adminListUsuarios(): Promise<Usuario[]> {
  return listUsuarios();
}

export function adminGetUsuario(email: string): Promise<Usuario | null> {
  return getUsuarioPorEmail(email);
}

export interface SimulacaoComDono extends SimulacaoSalva {
  donoEmail: string;
  donoNome: string;
}

type JoinedRow = {
  id: string;
  usuario_id: string;
  nome: string;
  tipo: string;
  etapa_atual: string;
  inputs: SimulacaoSalva["inputs"];
  otimista: SimulacaoSalva["otimista"];
  pessimista: SimulacaoSalva["pessimista"];
  created_at: string;
  updated_at: string;
  usuarios: { nome: string; email: string } | null;
};

export async function adminListSimulacoes(): Promise<SimulacaoComDono[]> {
  const { data, error } = await supabase
    .from("simulacoes")
    .select("*, usuarios(nome, email)")
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return (data as JoinedRow[]).map((r) => ({
    id: r.id,
    usuarioId: r.usuario_id,
    nome: r.nome,
    tipo: "recria_engorda",
    etapaAtual: r.etapa_atual as SimulacaoSalva["etapaAtual"],
    inputs: r.inputs,
    otimista: r.otimista,
    pessimista: r.pessimista,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    donoEmail: r.usuarios?.email ?? "",
    donoNome: r.usuarios?.nome ?? "—",
  }));
}

export async function adminListSimulacoesPorUsuario(
  email: string
): Promise<SimulacaoSalva[]> {
  const u = await getUsuarioPorEmail(email);
  if (!u) return [];
  const todas = await listSimulacoes();
  return todas.filter((s) => s.usuarioId === u.id);
}
