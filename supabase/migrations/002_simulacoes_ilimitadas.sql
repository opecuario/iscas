-- ============================================================
-- Permite liberar manualmente o limite de simulações por usuário.
-- Quando simulacoes_ilimitadas = true, o usuário pode criar
-- quantas simulações quiser (ignora LIMITE_SIMULACOES).
-- ============================================================

alter table public.usuarios
  add column if not exists simulacoes_ilimitadas boolean not null default false;

-- Admin pode atualizar o flag de qualquer usuário
create policy "usuarios_update_admin"
  on public.usuarios for update
  using (
    (auth.jwt() ->> 'email') in ('opecuario@opecuario.com.br')
  )
  with check (
    (auth.jwt() ->> 'email') in ('opecuario@opecuario.com.br')
  );
