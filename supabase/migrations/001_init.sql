-- ============================================================
-- Simulações — schema inicial
-- Auth é gerenciado pelo Supabase Auth (auth.users).
-- Perfis e simulações relacionam via auth.uid().
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- usuarios ---------------------------------------------
create table public.usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  nome        text not null,
  telefone    text,
  estado      text,
  created_at  timestamptz not null default now()
);

-- ---------- simulacoes -------------------------------------------
create table public.simulacoes (
  id           text primary key,
  usuario_id   uuid not null references public.usuarios(id) on delete cascade,
  nome         text not null,
  tipo         text not null,
  etapa_atual  text not null,
  inputs       jsonb not null,
  otimista     jsonb,
  pessimista   jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index simulacoes_usuario_id_idx on public.simulacoes(usuario_id);
create index simulacoes_updated_at_idx on public.simulacoes(updated_at desc);

-- ---------- trigger: sync updated_at -----------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger simulacoes_touch_updated_at
before update on public.simulacoes
for each row execute function public.touch_updated_at();

-- ---------- RLS: usuarios ----------------------------------------
alter table public.usuarios enable row level security;

-- dono lê seu próprio perfil
create policy "usuarios_select_own"
  on public.usuarios for select
  using (auth.uid() = id);

-- dono insere seu perfil (durante cadastro)
create policy "usuarios_insert_self"
  on public.usuarios for insert
  with check (auth.uid() = id);

-- dono atualiza seu perfil
create policy "usuarios_update_own"
  on public.usuarios for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- admin (email na lista) lê todos
create policy "usuarios_select_admin"
  on public.usuarios for select
  using (
    (auth.jwt() ->> 'email') in ('opecuario@opecuario.com.br')
  );

-- ---------- RLS: simulacoes --------------------------------------
alter table public.simulacoes enable row level security;

create policy "simulacoes_select_own"
  on public.simulacoes for select
  using (auth.uid() = usuario_id);

create policy "simulacoes_insert_own"
  on public.simulacoes for insert
  with check (auth.uid() = usuario_id);

create policy "simulacoes_update_own"
  on public.simulacoes for update
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

create policy "simulacoes_delete_own"
  on public.simulacoes for delete
  using (auth.uid() = usuario_id);

create policy "simulacoes_select_admin"
  on public.simulacoes for select
  using (
    (auth.jwt() ->> 'email') in ('opecuario@opecuario.com.br')
  );
