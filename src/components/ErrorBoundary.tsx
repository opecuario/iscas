"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  erro: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  componentDidCatch(erro: Error, info: unknown) {
    if (typeof window !== "undefined") {
      console.error("ErrorBoundary capturou erro:", erro, info);
    }
  }

  reset = () => this.setState({ erro: null });

  render() {
    if (!this.state.erro) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-lg font-bold text-red-900">Algo deu errado</h1>
          <p className="mt-2 text-sm text-red-800/90">
            Ocorreu um erro inesperado nesta tela. Tente recarregar ou voltar para o dashboard.
          </p>
          {this.state.erro.message && (
            <pre className="mt-3 overflow-x-auto rounded bg-white p-2 text-left text-[11px] text-red-900">
              {this.state.erro.message}
            </pre>
          )}
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={this.reset}
              className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
            >
              Tentar de novo
            </button>
            <a
              href="/"
              className="rounded-md bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Ir para o dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }
}
