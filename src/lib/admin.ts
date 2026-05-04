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

export type SimulacaoComDono = SimulacaoSalva & {
  donoEmail: string;
  donoNome: string;
};

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

// ---------- Links de divulgação --------------------------------

export interface LinkDivulgacao {
  id: string;
  slug: string;
  nome: string;
  observacao: string | null;
  ativo: boolean;
  criadoEm: string;
}

type LinkRow = {
  id: string;
  slug: string;
  nome: string;
  observacao: string | null;
  ativo: boolean;
  criado_em: string;
};

function mapLink(r: LinkRow): LinkDivulgacao {
  return {
    id: r.id,
    slug: r.slug,
    nome: r.nome,
    observacao: r.observacao,
    ativo: r.ativo,
    criadoEm: r.criado_em,
  };
}

export async function listLinksDivulgacao(): Promise<LinkDivulgacao[]> {
  const { data, error } = await supabase
    .from("links_divulgacao")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error || !data) return [];
  return (data as LinkRow[]).map(mapLink);
}

export async function criarLinkDivulgacao(input: {
  slug: string;
  nome: string;
  observacao?: string;
}): Promise<{ ok: true; link: LinkDivulgacao } | { ok: false; erro: string }> {
  const slug = input.slug
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) return { ok: false, erro: "Identificador inválido." };
  if (!input.nome.trim()) return { ok: false, erro: "Informe um nome." };

  const { data, error } = await supabase
    .from("links_divulgacao")
    .insert({
      slug,
      nome: input.nome.trim(),
      observacao: input.observacao?.trim() || null,
    })
    .select()
    .single();
  if (error) {
    if ((error.message || "").toLowerCase().includes("duplicate")) {
      return { ok: false, erro: "Já existe um link com esse identificador." };
    }
    return { ok: false, erro: error.message };
  }
  return { ok: true, link: mapLink(data as LinkRow) };
}

export async function atualizarLinkDivulgacao(
  id: string,
  patch: { ativo?: boolean; nome?: string; observacao?: string | null }
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const update: Record<string, unknown> = {};
  if (patch.ativo !== undefined) update.ativo = patch.ativo;
  if (patch.nome !== undefined) update.nome = patch.nome.trim();
  if (patch.observacao !== undefined)
    update.observacao = patch.observacao?.trim() || null;
  const { error } = await supabase
    .from("links_divulgacao")
    .update(update)
    .eq("id", id);
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

export async function deletarLinkDivulgacao(
  id: string
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const { error } = await supabase
    .from("links_divulgacao")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}
