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

    const sheet = pegarSheet();
    const linha = calcularProximaLinha(sheet);
    sheet.getRange(linha, 1, 1, 8).setValues([[
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
    ]]);
    return jsonOut({ ok: true, linha: linha, versao: "v4" });
  } catch (err) {
    return jsonOut({ ok: false, erro: String(err) });
  }
}

// Endpoint de diagnostico: abra a URL do Web App no navegador
// e voce ve qual versao do script esta rodando + qual seria a
// proxima linha gravada AGORA.
function doGet() {
  const sheet = pegarSheet();
  return jsonOut({
    ok: true,
    versao: "v4",
    sheet_name: sheet.getName(),
    last_row_nativo: sheet.getLastRow(),
    proxima_linha_calculada: calcularProximaLinha(sheet),
  });
}

// Funcao pra rodar manualmente do editor (Executar > teste).
// Grava um lead de teste pra confirmar onde o script escreve.
function teste() {
  const sheet = pegarSheet();
  const linha = calcularProximaLinha(sheet);
  console.log("Vou gravar na linha", linha, "do sheet", sheet.getName());
  sheet.getRange(linha, 1, 1, 8).setValues([[
    "TESTE MANUAL " + new Date().toLocaleTimeString(),
    "(00) 00000-0000",
    "Cidade Teste",
    "TT",
    99,
    0,
    "",
    false,
  ]]);
  return linha;
}

function pegarSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
}

function calcularProximaLinha(sheet) {
  // Acha a ultima linha que tem Nome (A) E Telefone (B) preenchidos.
  // Lead real sempre tem os dois. Lixo isolado em outras linhas (so
  // checkbox, so um nome solto, so formato residual) e ignorado.
  // Grava na linha logo abaixo dessa.
  const limite = 5000;
  const ultimaParaLer = Math.min(limite, Math.max(sheet.getMaxRows(), 1));
  const valores = sheet.getRange(1, 1, ultimaParaLer, 2).getValues();
  let ultimaComLead = 1; // 1 = cabecalho
  for (let i = 1; i < valores.length; i++) {
    const a = String(valores[i][0] ?? "").trim();
    const b = String(valores[i][1] ?? "").trim();
    if (a !== "" && b !== "") {
      ultimaComLead = i + 1; // 1-based
    }
  }
  return ultimaComLead + 1;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
