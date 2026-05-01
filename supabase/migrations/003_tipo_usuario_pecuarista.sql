-- ============================================================
-- Adiciona perfil do usuário no cadastro:
--   tipo_usuario   : pecuarista | profissional | outro
--   hectares_pasto : área de pasto (só preenchido para pecuaristas)
-- Ambos opcionais para preservar cadastros antigos.
-- ============================================================

alter table public.usuarios
  add column if not exists tipo_usuario text
    check (tipo_usuario in ('pecuarista', 'profissional', 'outro'));

alter table public.usuarios
  add column if not exists hectares_pasto numeric;
