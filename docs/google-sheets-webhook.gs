/**
 * Apps Script para receber leads do simulador e gravar na planilha
 * "PROSPECÇÃO DIAGNÓSTICO GRATUITO".
 *
 * Como instalar:
 *   1. Abra a planilha no Google Sheets.
 *   2. Menu: Extensões → Apps Script.
 *   3. Apague o código padrão e cole TUDO daqui.
 *   4. Troque o valor da constante SECRET por uma string aleatória longa.
 *   5. Salve (Ctrl+S).
 *   6. Clique em Implantar → Nova implantação.
 *      Tipo: Aplicativo da Web.
 *      Executar como: Eu.
 *      Quem tem acesso: Qualquer pessoa.
 *      Implantar.
 *   7. Copie a URL do Web App (algo tipo
 *      https://script.google.com/macros/s/AKfy.../exec).
 *   8. No Vercel, abra o projeto > Settings > Environment Variables e
 *      crie:
 *        GOOGLE_SHEETS_WEBHOOK_URL    = a URL copiada
 *        GOOGLE_SHEETS_WEBHOOK_SECRET = mesma string que voce colocou em SECRET
 *      Salve e faca um redeploy (ou commit qualquer coisa).
 *   9. Pronto. Cada novo cadastro sem ?ref= vai parar nessa aba.
 *
 * Mapeamento das colunas (mesma ordem da sua planilha):
 *   A: Nome
 *   B: Telefone
 *   C: Município
 *   D: Estado
 *   E: Área (ha)
 *   F: nº simulações  (sempre 0 no cadastro novo)
 *   G: Dono do lead   (deixado vazio — voce preenche)
 *   H: Cadastrado no CRM?  (checkbox desmarcado)
 */

const SECRET = "TROQUE_PARA_UMA_STRING_ALEATORIA_LONGA";

// Nome da aba onde gravar os leads. Se voce mudar o nome da aba na planilha,
// atualize aqui. Se quiser usar a aba ativa qualquer que ela seja, use
// SpreadsheetApp.getActiveSpreadsheet().getActiveSheet() abaixo.
const SHEET_NAME = "PROSPECÇÃO DIAGNÓSTICO GRATUITO";

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    if (body.secret !== SECRET) {
      return jsonOut({ ok: false, erro: "unauthorized" });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet =
      ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();

    sheet.appendRow([
      body.nome || "",                 // A
      body.telefone || "",             // B
      body.municipio || "",            // C
      body.estado || "",               // D
      body.hectares === "" || body.hectares == null
        ? ""
        : Number(body.hectares),       // E
      typeof body.simulacoes === "number" ? body.simulacoes : 0, // F
      "",                              // G — Dono do lead (manual)
      false,                           // H — Cadastrado no CRM? (manual)
    ]);

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, erro: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
