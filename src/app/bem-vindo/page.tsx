"use client";

import Image from "next/image";
import Link from "next/link";

export default function BemVindoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo.svg"
            alt="O Pecuário"
            width={260}
            height={40}
            priority
            className="h-12 w-auto"
          />
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-brand-900">
            Simulador de recria e engorda
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            Projete o resultado da sua operação em minutos — lucro, custo por
            arroba e rentabilidade.
          </p>

          <div className="mt-8 space-y-3">
            <Link
              href="/cadastro"
              className="block w-full rounded-md bg-brand-800 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Criar conta
            </Link>
            <Link
              href="/login"
              className="block w-full rounded-md border border-brand-800 bg-white px-4 py-3 text-base font-semibold text-brand-800 transition hover:bg-brand-50"
            >
              Já tenho conta
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Ao continuar, você concorda com nossa{" "}
          <Link
            href="/privacidade"
            className="font-medium text-brand-800 hover:underline"
          >
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
