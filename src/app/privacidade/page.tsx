import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade e Termos de Uso",
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-sm leading-relaxed text-neutral-800">
      <Link href="/" className="text-xs text-neutral-500 hover:text-brand-800">
        ← Voltar
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-brand-900">
        Política de Privacidade e Termos de Uso
      </h1>
      <p className="mt-2 text-xs text-neutral-500">
        Última atualização: 17/04/2026
      </p>

      <section className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold text-brand-900">1. Quem somos</h2>
        <p>
          Este simulador é oferecido pela <strong>OpeCuário</strong>, consultoria
          especializada em pecuária de recria e engorda. Ao usar a ferramenta,
          você concorda com esta política.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold text-brand-900">
          2. Dados que coletamos
        </h2>
        <p>Ao se cadastrar, coletamos:</p>
        <ul className="ml-6 list-disc space-y-1">
          <li>Nome completo</li>
          <li>E-mail</li>
          <li>Telefone (opcional)</li>
          <li>Estado (opcional)</li>
          <li>Senha (armazenada de forma criptografada)</li>
        </ul>
        <p>
          Ao usar o simulador, também guardamos os dados das simulações que você
          cria (preços, pesos, período, custos etc.) para que você possa
          revisá-las e continuá-las depois.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold text-brand-900">
          3. Como usamos seus dados
        </h2>
        <ul className="ml-6 list-disc space-y-1">
          <li>Permitir o acesso à sua conta e às suas simulações.</li>
          <li>
            Entrar em contato com você para oferecer serviços de consultoria,
            quando houver pertinência.
          </li>
          <li>
            Melhorar a ferramenta com base em padrões anônimos de uso.
          </li>
        </ul>
        <p>
          <strong>Não vendemos seus dados.</strong> Não compartilhamos com
          terceiros, exceto com provedores de infraestrutura (Supabase, Vercel)
          necessários para operar a plataforma.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold text-brand-900">
          4. Seus direitos (LGPD)
        </h2>
        <p>
          Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018),
          você pode a qualquer momento:
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li>Acessar, corrigir ou excluir seus dados.</li>
          <li>Solicitar a portabilidade das suas simulações.</li>
          <li>
            Revogar o consentimento e encerrar sua conta — basta nos enviar uma
            mensagem.
          </li>
        </ul>
        <p>
          Para exercer qualquer desses direitos, entre em contato pelo WhatsApp{" "}
          <a
            href="https://wa.me/556699852419"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-800 hover:underline"
          >
            (66) 99985-2419
          </a>
          .
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold text-brand-900">
          5. Segurança
        </h2>
        <p>
          Usamos criptografia em trânsito (HTTPS) e em repouso. Suas simulações
          são isoladas por conta — nenhum outro usuário tem acesso a elas.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold text-brand-900">
          6. Termos de uso
        </h2>
        <p>
          O simulador é uma ferramenta de apoio à decisão. As projeções são
          baseadas nos valores que você informa e <strong>não garantem</strong>{" "}
          qualquer resultado real. Decisões tomadas a partir dele são de
          responsabilidade do usuário.
        </p>
        <p>
          A OpeCuário se reserva o direito de ajustar funcionalidades, limites
          de uso e esta política a qualquer momento, notificando os usuários
          quando cabível.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold text-brand-900">7. Contato</h2>
        <p>
          Dúvidas sobre esta política ou sobre o tratamento dos seus dados? Fale
          com a gente no WhatsApp{" "}
          <a
            href="https://wa.me/556699852419"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-800 hover:underline"
          >
            (66) 99985-2419
          </a>
          .
        </p>
      </section>
    </div>
  );
}
