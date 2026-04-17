export default function AvisoModoLocal() {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <strong>Modo local:</strong> os dados aqui são lidos do{" "}
      <code>localStorage</code> deste navegador. Quando o banco de dados for
      integrado, este painel passará a ver todos os usuários da plataforma sem
      mudar a interface.
    </div>
  );
}
