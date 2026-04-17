"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getUsuario, type Usuario } from "@/lib/storage";

const UsuarioCtx = createContext<Usuario | null>(null);

export function useUsuario(): Usuario | null {
  return useContext(UsuarioCtx);
}

const ROTAS_PUBLICAS = ["/login", "/cadastro"];

export default function UsuarioProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [checado, setChecado] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const u = getUsuario();
    setUsuario(u);
    setChecado(true);
    const ehPublica = ROTAS_PUBLICAS.includes(pathname);
    if (!u && !ehPublica) {
      router.replace("/login");
    }
    if (u && ehPublica) {
      router.replace("/");
    }
  }, [pathname, router]);

  if (!checado) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        Carregando…
      </div>
    );
  }

  return <UsuarioCtx.Provider value={usuario}>{children}</UsuarioCtx.Provider>;
}
