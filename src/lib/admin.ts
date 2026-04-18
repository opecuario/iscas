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

export async function adminListSimulacoes(): Promise<SimulacaoComDono[]> {
  // Usa listSimulacoes (que aplica migracao de shape antigo) + join em memoria
  // com a lista de usuarios. Evita passar inputs crus para calcular().
  const [sims, usuarios] = await Promise.all([listSimulacoes(), listUsuarios()]);
  const porId = new Map(usuarios.map((u) => [u.id, u]));
  return sims.map((s) => {
    const dono = porId.get(s.usuarioId);
    return {
      ...s,
      donoEmail: dono?.email ?? "",
      donoNome: dono?.nome ?? "—",
    };
  });
}

export async function adminListSimulacoesPorUsuario(
  email: string
): Promise<SimulacaoSalva[]> {
  const u = await getUsuarioPorEmail(email);
  if (!u) return [];
  const todas = await listSimulacoes();
  return todas.filter((s) => s.usuarioId === u.id);
}

export async function adminSetSimulacoesIlimitadas(
  usuarioId: string,
  ilimitadas: boolean
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const { error } = await supabase
    .from("usuarios")
    .update({ simulacoes_ilimitadas: ilimitadas })
    .eq("id", usuarioId);
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}
