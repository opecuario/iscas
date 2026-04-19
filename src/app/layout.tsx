import type { Metadata } from "next";
import "./globals.css";
import UsuarioProvider from "@/components/UsuarioProvider";
import ToastProvider from "@/components/ToastProvider";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Simulador de Cenários — Recria e Engorda",
  description:
    "Simule operações de recria e engorda bovina com cenários realista, otimista e pessimista. Ferramenta para pecuaristas profissionais.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen font-sans">
        <ErrorBoundary>
          <ToastProvider>
            <UsuarioProvider>{children}</UsuarioProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
