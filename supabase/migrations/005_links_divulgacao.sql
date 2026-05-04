-- ============================================================
-- Links de divulgação rastreáveis.
-- Cada link tem um slug usado em ?ref= na URL de cadastro.
-- O usuario fica marcado com origem_link = slug pra atribuição.
-- ============================================================

create table if not exists public.links_divulgacao (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  observacao text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.usuarios
  add column if not exists origem_link text;

-- Index pra contagem por origem
create index if not exists usuarios_origem_link_idx
  on public.usuarios (origem_link);

-- RLS: leitura aberta dos links ativos (necessário pro admin listar
-- e pra qualquer page validar slug). Escrita só admin.
alter table public.links_divulgacao enable row level security;

create policy "links_select_all"
  on public.links_divulgacao for select
  using (true);

create policy "links_insert_admin"
  on public.links_divulgacao for insert
  with check (
    (auth.jwt() ->> 'email') in ('opecuario@opecuario.com.br')
  );

create policy "links_update_admin"
  on public.links_divulgacao for update
  using (
    (auth.jwt() ->> 'email') in ('opecuario@opecuario.com.br')
  )
  with check (
    (auth.jwt() ->> 'email') in ('opecuario@opecuario.com.br')
  );

create policy "links_delete_admin"
  on public.links_divulgacao for delete
  using (
    (auth.jwt() ->> 'email') in ('opecuario@opecuario.com.br')
  );
