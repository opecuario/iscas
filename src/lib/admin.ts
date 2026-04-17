"use client";

import {
  getUsuarioPorEmail,
  listTodasSimulacoes,
  listUsuarios,
  type SimulacaoSalva,
  type Usuario,
} from "./storage";

export const ADMIN_EMAILS = ["opecuario@opecuario.com.br"];

export function isAdmin(usuario: Usuario | null): boolean {
  if (!usuario) return false;
  return ADMIN_EMAILS.includes(usuario.email.toLowerCase().trim());
}

/**
 * Camada de dados do admin. Hoje lê do localStorage do próprio navegador
 * — quando vier o backend, basta trocar a implementação destas funções.
 */
export function adminListUsuarios(): Usuario[] {
  return listUsuarios();
}

export function adminGetUsuario(email: string): Usuario | null {
  return getUsuarioPorEmail(email);
}

export interface SimulacaoComDono extends SimulacaoSalva {
  donoEmail: string;
  donoNome: string;
}

export function adminListSimulacoes(): SimulacaoComDono[] {
  const usuarios = listUsuarios();
  const mapaNomes = new Map<string, string>(
    usuarios.map((u) => [u.email.toLowerCase(), u.nome])
  );
  return listTodasSimulacoes().map((s) => {
    const email = (s.usuarioEmail ?? "").toLowerCase();
    return {
      ...s,
      donoEmail: email,
      donoNome: mapaNomes.get(email) ?? "—",
    };
  });
}

export function adminListSimulacoesPorUsuario(email: string): SimulacaoSalva[] {
  const norm = email.toLowerCase();
  return listTodasSimulacoes().filter(
    (s) => (s.usuarioEmail ?? "").toLowerCase() === norm
  );
}
