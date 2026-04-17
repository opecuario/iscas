"use client";

import type { InputsBase, VarianteOverride } from "./types";

export interface Usuario {
  nome: string;
  email: string;
  telefone: string;
  estado: string;
  createdAt: string;
}

export type EtapaAtual = "realista" | "otimista" | "pessimista" | "finalizado";

export interface SimulacaoSalva {
  id: string;
  usuarioEmail: string;
  nome: string;
  tipo: "recria_engorda";
  etapaAtual: EtapaAtual;
  inputs: InputsBase;
  otimista: VarianteOverride | null;
  pessimista: VarianteOverride | null;
  createdAt: string;
  updatedAt: string;
}

const KEY_USUARIOS = "simulador:usuarios";
const KEY_SESSAO = "simulador:sessao";
const KEY_SIMULACOES = "simulador:simulacoes";
const KEY_USUARIO_LEGADO = "simulador:usuario";

export const LIMITE_SIMULACOES = 2;

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Migração ---------------------------------------------------------------
function migrarSeNecessario() {
  if (typeof window === "undefined") return;
  const legado = window.localStorage.getItem(KEY_USUARIO_LEGADO);
  if (!legado) return;
  try {
    const u = JSON.parse(legado) as Usuario;
    const emailNorm = normalizarEmail(u.email);
    const lista = lerUsuariosCru();
    if (!lista.find((x) => normalizarEmail(x.email) === emailNorm)) {
      lista.push({ ...u, email: emailNorm });
      window.localStorage.setItem(KEY_USUARIOS, JSON.stringify(lista));
    }
    window.localStorage.setItem(KEY_SESSAO, emailNorm);

    // Atribui simulações órfãs ao usuário recém-migrado
    const simsRaw = window.localStorage.getItem(KEY_SIMULACOES);
    if (simsRaw) {
      const sims = JSON.parse(simsRaw) as SimulacaoSalva[];
      const corrigidas = sims.map((s) => ({
        ...s,
        usuarioEmail: s.usuarioEmail ?? emailNorm,
      }));
      window.localStorage.setItem(KEY_SIMULACOES, JSON.stringify(corrigidas));
    }
  } catch {
    // ignora payload inválido
  }
  window.localStorage.removeItem(KEY_USUARIO_LEGADO);
}

function lerUsuariosCru(): Usuario[] {
  const raw = window.localStorage.getItem(KEY_USUARIOS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Usuario[];
  } catch {
    return [];
  }
}

// Sessão ----------------------------------------------------------------
export function getEmailSessao(): string | null {
  if (typeof window === "undefined") return null;
  migrarSeNecessario();
  return window.localStorage.getItem(KEY_SESSAO);
}

export function setSessao(email: string) {
  window.localStorage.setItem(KEY_SESSAO, normalizarEmail(email));
}

export function limparSessao() {
  window.localStorage.removeItem(KEY_SESSAO);
}

// Usuários --------------------------------------------------------------
export function listUsuarios(): Usuario[] {
  if (typeof window === "undefined") return [];
  migrarSeNecessario();
  return lerUsuariosCru();
}

export function getUsuarioPorEmail(email: string): Usuario | null {
  const norm = normalizarEmail(email);
  return listUsuarios().find((u) => normalizarEmail(u.email) === norm) ?? null;
}

/** Usuário atualmente logado neste navegador. */
export function getUsuario(): Usuario | null {
  const email = getEmailSessao();
  if (!email) return null;
  return getUsuarioPorEmail(email);
}

/**
 * Cria um novo usuário e o coloca em sessão.
 * Retorna `false` se já existir cadastro com esse e-mail.
 */
export function criarUsuario(u: Usuario): boolean {
  const norm = normalizarEmail(u.email);
  const lista = listUsuarios();
  if (lista.find((x) => normalizarEmail(x.email) === norm)) return false;
  lista.push({ ...u, email: norm });
  window.localStorage.setItem(KEY_USUARIOS, JSON.stringify(lista));
  setSessao(norm);
  return true;
}

/** Faz login com um e-mail já cadastrado. Retorna o usuário ou `null`. */
export function loginPorEmail(email: string): Usuario | null {
  const u = getUsuarioPorEmail(email);
  if (!u) return null;
  setSessao(u.email);
  return u;
}

// Simulações ------------------------------------------------------------
function lerSimsCru(): SimulacaoSalva[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY_SIMULACOES);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SimulacaoSalva[];
  } catch {
    return [];
  }
}

/** Lista as simulações do usuário atualmente logado. */
export function listSimulacoes(): SimulacaoSalva[] {
  const email = getEmailSessao();
  if (!email) return [];
  return lerSimsCru().filter(
    (s) => normalizarEmail(s.usuarioEmail ?? "") === normalizarEmail(email)
  );
}

/** Para uso do painel admin — todas as simulações do navegador. */
export function listTodasSimulacoes(): SimulacaoSalva[] {
  if (typeof window === "undefined") return [];
  migrarSeNecessario();
  return lerSimsCru();
}

export function getSimulacao(id: string): SimulacaoSalva | null {
  return lerSimsCru().find((s) => s.id === id) ?? null;
}

export function upsertSimulacao(s: SimulacaoSalva) {
  const list = lerSimsCru();
  const idx = list.findIndex((x) => x.id === s.id);
  if (idx === -1) list.push(s);
  else list[idx] = s;
  window.localStorage.setItem(KEY_SIMULACOES, JSON.stringify(list));
}

export function deleteSimulacao(id: string) {
  const list = lerSimsCru().filter((s) => s.id !== id);
  window.localStorage.setItem(KEY_SIMULACOES, JSON.stringify(list));
}

export function gerarId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
