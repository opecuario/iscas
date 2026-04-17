"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getUsuario, type Usuario } from "@/lib/storage";

const UsuarioCtx = createContext<Usuario | null>(null);

export function useUsuario(): Usuario | null {
  return useContext(UsuarioCtx);
}

// Acessíveis sem login (não redireciona para /bem-vindo).
const ROTAS_PUBLICAS = [
  "/bem-vindo",
  "/login",
  "/cadastro",
  "/esqueci-senha",
  "/redefinir-senha",
  "/privacidade",
];

// Rotas que, se o usuário já estiver logado, redirecionam para o dashboard.
// /redefinir-senha e /privacidade NÃO entram aqui — são neutras.
const ROTAS_DE_ENTRADA = [
  "/bem-vindo",
  "/login",
  "/cadastro",
  "/esqueci-senha",
];

export default function UsuarioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregado, setCarregado] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let ativo = true;

    async function sincronizar(session: Session | null) {
      if (!session) {
        if (ativo) {
          setUsuario(null);
          setCarregado(true);
        }
        return;
      }
      const u = await getUsuario();
      if (ativo) {
        setUsuario(u);
        setCarregado(true);
      }
    }

    supabase.auth.getSession().then(({ data }) => sincronizar(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      sincronizar(session);
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!carregado) return;
    const ehPublica = ROTAS_PUBLICAS.includes(pathname);
    const ehEntrada = ROTAS_DE_ENTRADA.includes(pathname);
    if (!usuario && !ehPublica) router.replace("/bem-vindo");
    if (usuario && ehEntrada) router.replace("/");
  }, [carregado, usuario, pathname, router]);

  if (!carregado) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        Carregando…
      </div>
    );
  }

  return <UsuarioCtx.Provider value={usuario}>{children}</UsuarioCtx.Provider>;
}
