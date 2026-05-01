-- ============================================================
-- Adiciona municipio ao cadastro do usuario.
-- Opcional para preservar cadastros antigos.
-- ============================================================

alter table public.usuarios
  add column if not exists municipio text;
