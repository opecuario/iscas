"use client";

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type {
  InputsBase,
  Outputs,
  TipoVariante,
  VarianteOverride,
} from "@/lib/types";
import { fmtBRL, fmtInt, fmtNum, fmtPct } from "@/lib/format";

export type CenarioPDF = {
  id: TipoVariante;
  label: string;
  corHex: string;
  override: VarianteOverride;
  out: Outputs;
};

const BRAND_900 = "#00401c";
const BRAND_800 = "#063d1f";
const BRAND_50 = "#e6f0ea";
const BRAND_100 = "#c4ddcd";
const NEUTRAL_900 = "#171717";
const NEUTRAL_700 = "#404040";
const NEUTRAL_500 = "#737373";
const NEUTRAL_200 = "#e5e5e5";
const NEUTRAL_100 = "#f5f5f5";
const NEUTRAL_50 = "#fafafa";
const EMERALD_700 = "#047857";
const RED_700 = "#b91c1c";

const NUM3 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });
const fmtGmd = (v: number) => (isFinite(v) ? NUM3.format(v) : "—");

function logoSrc(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/logo.png`;
  }
  return "/logo.png";
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 44,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: NEUTRAL_900,
  },
  // ---- Header padrão (páginas internas) ----
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: NEUTRAL_200,
    marginBottom: 14,
  },
  headerLogo: { width: 90, height: 13 },
  headerMeta: { fontSize: 7, color: NEUTRAL_500, textAlign: "right" },
  // ---- Capa ----
  capaLogoWrap: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 28,
  },
  capaLogo: { width: 280, height: 39.6 },
  capaKicker: {
    fontSize: 9,
    color: NEUTRAL_500,
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 6,
  },
  capaTitle: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: BRAND_900,
    textAlign: "center",
    marginBottom: 10,
  },
  capaMeta: {
    fontSize: 11,
    color: NEUTRAL_700,
    textAlign: "center",
    marginBottom: 28,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  card: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: NEUTRAL_200,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  cardHead: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeadLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardBody: { padding: 12 },
  cardLucroLabel: {
    fontSize: 8,
    color: NEUTRAL_500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardLucroValor: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },
  kvGrid: {
    flexDirection: "column",
    gap: 6,
  },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: NEUTRAL_200,
    paddingTop: 4,
  },
  kvLabel: { fontSize: 8.5, color: NEUTRAL_500 },
  kvValor: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: NEUTRAL_900,
  },
  capaCtaWrap: {
    marginTop: 18,
    padding: 12,
    backgroundColor: BRAND_50,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: BRAND_800,
  },
  capaCtaTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND_900,
  },
  capaCtaText: {
    fontSize: 9,
    color: NEUTRAL_700,
    marginTop: 2,
    lineHeight: 1.4,
  },
  capaCtaWhats: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: BRAND_800,
    marginTop: 4,
  },
  // ---- Tabela ----
  simName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: BRAND_900,
    marginBottom: 2,
  },
  meta: {
    fontSize: 9,
    color: NEUTRAL_700,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: NEUTRAL_500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
  },
  tableWrap: {
    borderWidth: 1,
    borderColor: NEUTRAL_200,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 10,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: NEUTRAL_50,
  },
  thIndicador: {
    flex: 2.4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: NEUTRAL_500,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  thCenario: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sepRow: {
    flexDirection: "row",
    backgroundColor: BRAND_50,
    borderTopWidth: 1,
    borderTopColor: BRAND_100,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_100,
  },
  sepCell: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: BRAND_800,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  dataRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: NEUTRAL_100,
  },
  tdLabel: {
    flex: 2.4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 9,
    color: NEUTRAL_700,
  },
  tdValor: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 9,
    color: NEUTRAL_900,
    fontFamily: "Helvetica-Bold",
  },
  tdLabelIndent: {
    flex: 2.4,
    paddingVertical: 3,
    paddingLeft: 24,
    paddingRight: 8,
    fontSize: 8,
    color: NEUTRAL_500,
  },
  tdValorIndent: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontSize: 8,
    color: NEUTRAL_500,
  },
  destacarRow: {
    backgroundColor: "#f0f7f3",
  },
  tdLabelDestaque: {
    flex: 2.4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: BRAND_900,
  },
  totalizadorRow: {
    flexDirection: "row",
    backgroundColor: BRAND_100,
    borderTopWidth: 1.5,
    borderTopColor: BRAND_800,
    borderBottomWidth: 1.5,
    borderBottomColor: BRAND_800,
  },
  tdLabelTotalizador: {
    flex: 2.4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: BRAND_900,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tdValorTotalizador: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND_900,
  },
  positivo: { color: EMERALD_700, fontFamily: "Helvetica-Bold" },
  negativo: { color: RED_700, fontFamily: "Helvetica-Bold" },
  unidade: { fontSize: 8, color: NEUTRAL_500, fontFamily: "Helvetica" },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: NEUTRAL_200,
    fontSize: 7,
    color: NEUTRAL_500,
  },
});

interface Props {
  simNome: string;
  inputs: InputsBase;
  cenarios: CenarioPDF[];
  dataGeracao: Date;
}

export default function RelatorioPDF({
  simNome,
  inputs,
  cenarios,
  dataGeracao,
}: Props) {
  const out0 = cenarios[0].out;
  const temExtras = (inputs.custosExtras ?? []).length > 0;
  const temPasto = out0.areaMaxima > 0;
  const logo = logoSrc();
  const dataStr = dataGeracao.toLocaleDateString("pt-BR");

  return (
    <Document
      title={`Relatorio - ${simNome}`}
      author="O Pecuário"
      subject="Simulação de recria/engorda"
    >
      {/* ======================= CAPA ======================= */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.capaLogoWrap}>
          <Image src={logo} style={styles.capaLogo} />
        </View>

        <Text style={styles.capaKicker}>RELATÓRIO DE SIMULAÇÃO</Text>
        <Text style={styles.capaTitle}>{simNome}</Text>
        <Text style={styles.capaMeta}>
          {fmtInt(inputs.qtdCabecas || 0)} cabeças  ·  {fmtNum(out0.areaMaxima || 0)} ha
          {"  ·  "}
          {fmtInt(out0.diasTotal || 0)} dias
        </Text>

        <View style={styles.cardsRow}>
          {cenarios.map((c) => (
            <CenarioCard key={c.id} c={c} />
          ))}
        </View>

        <View style={styles.capaCtaWrap} wrap={false}>
          <Text style={styles.capaCtaTitle}>
            Quer melhorar os resultados desta operação?
          </Text>
          <Text style={styles.capaCtaText}>
            Nossa consultoria ajuda você a transformar esses cenários em decisões
            concretas de manejo, nutrição e compra/venda para elevar o retorno.
          </Text>
          <Text style={styles.capaCtaWhats}>WhatsApp: (66) 9985-2419</Text>
        </View>

        <Footer dataStr={dataStr} fixed />
      </Page>

      {/* =================== PÁGINA DETALHADA =================== */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header logo={logo} dataStr={dataStr} fixed />

        <Text style={styles.simName}>{simNome}</Text>
        <Text style={styles.meta}>
          {fmtInt(inputs.qtdCabecas || 0)} cabeças · {fmtNum(out0.areaMaxima || 0)} ha ·{" "}
          {fmtInt(out0.diasTotal || 0)} dias
        </Text>

        <Text style={styles.sectionTitle}>Detalhamento comparativo</Text>
        <View style={styles.tableWrap}>
          <TableHeader cenarios={cenarios} fixed />

          <DataRow label="Preço de compra (R$/@)">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtBRL(c.override.precoCompraArroba)} />
            ))}
          </DataRow>
          <DataRow label="Preço de venda (R$/@)">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtBRL(c.override.precoVendaArroba)} />
            ))}
          </DataRow>

          {inputs.fases.map((f, idx) => (
            <FaseBloco
              key={f.id}
              faseId={f.id}
              faseNome={f.nome}
              faseGmdBase={f.gmd}
              ordem={idx + 1}
              cenarios={cenarios}
            />
          ))}

          <SeparadorRow label="Resumo do gado" />
          <DataRow label="Cabeças compradas">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtInt(inputs.qtdCabecas)} unidade="cab" />
            ))}
          </DataRow>
          <DataRow label="Cabeças vendidas">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtInt(c.out.cabFinal)} unidade="cab" />
            ))}
          </DataRow>
          {cenarios.some((c) => inputs.qtdCabecas - c.out.cabFinal > 0.5) && (
            <>
              <DataRow label="Cabeças mortas">
                {cenarios.map((c) => (
                  <ValorCell
                    key={c.id}
                    texto={fmtInt(inputs.qtdCabecas - c.out.cabFinal)}
                    unidade="cab"
                  />
                ))}
              </DataRow>
              <DataRow label="Mortalidade">
                {cenarios.map((c) => (
                  <ValorCell
                    key={c.id}
                    texto={fmtPct(
                      inputs.qtdCabecas > 0
                        ? (inputs.qtdCabecas - c.out.cabFinal) / inputs.qtdCabecas
                        : 0
                    )}
                  />
                ))}
              </DataRow>
            </>
          )}
          <DataRow label="Peso de entrada">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtInt(inputs.pesoCompraKg)} unidade="kg" />
            ))}
          </DataRow>
          <DataRow label="Peso de saída">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtInt(c.out.pesoSaidaKg)} unidade="kg" />
            ))}
          </DataRow>
          <DataRow label="Peso de saída (carcaça)">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtNum(c.out.pesoSaidaArroba)} unidade="@" />
            ))}
          </DataRow>
          <DataRow label="Arrobas compradas">
            {cenarios.map((c) => (
              <ValorCell
                key={c.id}
                texto={fmtNum((inputs.qtdCabecas * inputs.pesoCompraKg) / 30)}
                unidade="@"
              />
            ))}
          </DataRow>
          <DataRow label="Arrobas vendidas (carcaça)">
            {cenarios.map((c) => (
              <ValorCell
                key={c.id}
                texto={fmtNum(c.out.cabFinal * c.out.pesoSaidaArroba)}
                unidade="@"
              />
            ))}
          </DataRow>
          <DataRow label="Período total">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtInt(c.out.diasTotal)} unidade="dias" />
            ))}
          </DataRow>
          {temPasto && (
            <>
              <DataRow label="Área total (pasto)">
                {cenarios.map((c) => (
                  <ValorCell key={c.id} texto={fmtNum(c.out.areaMaxima)} unidade="ha" />
                ))}
              </DataRow>
              <DataRow label="Lotação de entrada">
                {cenarios.map((c) => (
                  <ValorCell
                    key={c.id}
                    texto={fmtNum(c.out.lotacaoEntrada)}
                    unidade="U.A./ha"
                  />
                ))}
              </DataRow>
              <DataRow label="Lotação média">
                {cenarios.map((c) => (
                  <ValorCell
                    key={c.id}
                    texto={fmtNum(c.out.lotacaoMedia)}
                    unidade="U.A./ha"
                  />
                ))}
              </DataRow>
              <DataRow label="Lotação de saída">
                {cenarios.map((c) => (
                  <ValorCell
                    key={c.id}
                    texto={fmtNum(c.out.lotacaoSaida)}
                    unidade="U.A./ha"
                  />
                ))}
              </DataRow>
            </>
          )}

          <SeparadorRow label="Custos detalhados" />
          <DataRow label="Compra dos animais">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtBRL(c.out.totalCompra)} />
            ))}
          </DataRow>
          <DataRow label="Suplemento (total das fases)">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtBRL(c.out.custoSuplementoTotal)} />
            ))}
          </DataRow>
          <DataRow label="Operacionais (salários + sanidade + pastagem + taxas)">
            {cenarios.map((c) => (
              <ValorCell
                key={c.id}
                texto={fmtBRL(
                  c.out.custoSalarios +
                    c.out.custoSanidade +
                    c.out.custoPastagem +
                    c.out.custoTaxasVenda
                )}
              />
            ))}
          </DataRow>
          {temExtras && (
            <>
              <DataRow label="Custos personalizados">
                {cenarios.map((c) => (
                  <ValorCell key={c.id} texto={fmtBRL(c.out.custosExtrasTotal)} />
                ))}
              </DataRow>
              {cenarios[0].out.custosExtrasDetalhado.map((c, i) => (
                <DataRow
                  key={i}
                  label={`↳ ${c.nome || `Custo #${i + 1}`}`}
                  indentada
                >
                  {cenarios.map((cc) => (
                    <ValorCell
                      key={cc.id}
                      texto={fmtBRL(cc.out.custosExtrasDetalhado[i]?.valor ?? 0)}
                      indentada
                    />
                  ))}
                </DataRow>
              ))}
            </>
          )}
          <TotalizadorRow label="Total desembolsado">
            {cenarios.map((c) => (
              <Text key={c.id} style={styles.tdValorTotalizador}>
                {fmtBRL(c.out.totalDesembolsado)}
              </Text>
            ))}
          </TotalizadorRow>

          <SeparadorRow label="Resultado" />
          <DataRow label="Faturamento total">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtBRL(c.out.faturamentoTotal)} />
            ))}
          </DataRow>
          <View style={[styles.dataRow, styles.destacarRow]}>
            <Text style={styles.tdLabelDestaque}>Lucro total</Text>
            {cenarios.map((c) => (
              <Text
                key={c.id}
                style={[
                  styles.tdValor,
                  c.out.lucro >= 0 ? styles.positivo : styles.negativo,
                ]}
              >
                {fmtBRL(c.out.lucro)}
              </Text>
            ))}
          </View>
          <DataRow label="Lucro por cabeça">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtBRL(c.out.lucroCab)} />
            ))}
          </DataRow>
          <DataRow label="Lucro por hectare">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtBRL(c.out.lucroHa)} />
            ))}
          </DataRow>
          <DataRow label="Rentabilidade da operação">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtPct(c.out.rentabilidadeOperacao)} />
            ))}
          </DataRow>
          <DataRow label="Rentabilidade anual">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtPct(c.out.rentabilidadeAno)} />
            ))}
          </DataRow>
          <DataRow label="Custo da @ produzida">
            {cenarios.map((c) => (
              <ValorCell key={c.id} texto={fmtBRL(c.out.custoArrobaProduzida)} />
            ))}
          </DataRow>
        </View>

        <Footer dataStr={dataStr} fixed />
      </Page>
    </Document>
  );
}

function CenarioCard({ c }: { c: CenarioPDF }) {
  const positivo = c.out.lucro >= 0;
  return (
    <View style={styles.card} wrap={false}>
      <View style={[styles.cardHead, { backgroundColor: c.corHex }]}>
        <Text style={styles.cardHeadLabel}>{c.label}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardLucroLabel}>Lucro total</Text>
        <Text
          style={[
            styles.cardLucroValor,
            { color: positivo ? EMERALD_700 : RED_700 },
          ]}
        >
          {fmtBRL(c.out.lucro)}
        </Text>
        <View style={styles.kvGrid}>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Lucro / cabeça</Text>
            <Text style={styles.kvValor}>{fmtBRL(c.out.lucroCab)}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Rentabilidade anual</Text>
            <Text style={styles.kvValor}>{fmtPct(c.out.rentabilidadeAno)}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>@ produzidas</Text>
            <Text style={styles.kvValor}>
              {fmtNum(c.out.arrobasProduzidasTotal)}
            </Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Custo da @ produzida</Text>
            <Text style={styles.kvValor}>
              {fmtBRL(c.out.custoArrobaProduzida)}
            </Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Total desembolsado</Text>
            <Text style={styles.kvValor}>{fmtBRL(c.out.totalDesembolsado)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function Header({
  logo,
  dataStr,
  fixed,
}: {
  logo: string;
  dataStr: string;
  fixed?: boolean;
}) {
  return (
    <View style={styles.header} fixed={fixed}>
      <Image src={logo} style={styles.headerLogo} />
      <Text style={styles.headerMeta}>Gerado em {dataStr}</Text>
    </View>
  );
}

function Footer({
  dataStr,
  fixed,
}: {
  dataStr: string;
  fixed?: boolean;
}) {
  return (
    <View style={styles.footer} fixed={fixed}>
      <Text>opecuario.com.br · {dataStr}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}

function TableHeader({
  cenarios,
  fixed,
}: {
  cenarios: CenarioPDF[];
  fixed?: boolean;
}) {
  return (
    <View style={styles.tableHeaderRow} fixed={fixed}>
      <Text style={styles.thIndicador}>Indicador</Text>
      {cenarios.map((c) => (
        <Text
          key={c.id}
          style={[styles.thCenario, { backgroundColor: c.corHex }]}
        >
          {c.label}
        </Text>
      ))}
    </View>
  );
}

function SeparadorRow({ label }: { label: string }) {
  return (
    <View style={styles.sepRow} wrap={false}>
      <Text style={styles.sepCell}>{label}</Text>
    </View>
  );
}

function DataRow({
  label,
  indentada,
  children,
}: {
  label: string;
  indentada?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.dataRow} wrap={false}>
      <Text style={indentada ? styles.tdLabelIndent : styles.tdLabel}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function TotalizadorRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.totalizadorRow} wrap={false}>
      <Text style={styles.tdLabelTotalizador}>{label}</Text>
      {children}
    </View>
  );
}

function ValorCell({
  texto,
  unidade,
  indentada,
}: {
  texto: string;
  unidade?: string;
  indentada?: boolean;
}) {
  return (
    <Text style={indentada ? styles.tdValorIndent : styles.tdValor}>
      {texto}
      {unidade && <Text style={styles.unidade}> {unidade}</Text>}
    </Text>
  );
}

function FaseBloco({
  faseId,
  faseNome,
  faseGmdBase,
  ordem,
  cenarios,
}: {
  faseId: string;
  faseNome: string;
  faseGmdBase: number;
  ordem: number;
  cenarios: CenarioPDF[];
}) {
  const calcDe = (c: CenarioPDF) => c.out.fases.find((f) => f.id === faseId);
  const calc0 = calcDe(cenarios[0]);
  const confinada = !!calc0?.confinamento;

  return (
    <>
      <SeparadorRow
        label={`Fase ${ordem} — ${faseNome || "Sem nome"}${
          confinada ? " (confinamento)" : ""
        }`}
      />
      <DataRow label="GMD">
        {cenarios.map((c) => (
          <ValorCell
            key={c.id}
            texto={fmtGmd(c.override.gmdPorFase?.[faseId] ?? faseGmdBase)}
            unidade="kg/dia"
          />
        ))}
      </DataRow>
      <DataRow label="Peso de entrada">
        {cenarios.map((c) => (
          <ValorCell
            key={c.id}
            texto={fmtInt(calcDe(c)?.pesoInicio ?? 0)}
            unidade="kg"
          />
        ))}
      </DataRow>
      <DataRow label="Peso de saída">
        {cenarios.map((c) => (
          <ValorCell
            key={c.id}
            texto={fmtInt(calcDe(c)?.pesoFim ?? 0)}
            unidade="kg"
          />
        ))}
      </DataRow>
      <DataRow label="Período">
        {cenarios.map((c) => (
          <ValorCell
            key={c.id}
            texto={fmtInt(calcDe(c)?.dias ?? 0)}
            unidade="dias"
          />
        ))}
      </DataRow>
      {!confinada && (
        <>
          <DataRow label="Área">
            {cenarios.map((c) => (
              <ValorCell
                key={c.id}
                texto={fmtNum(calcDe(c)?.areaHa ?? 0)}
                unidade="ha"
              />
            ))}
          </DataRow>
          <DataRow label="Lotação média (cab/ha)">
            {cenarios.map((c) => (
              <ValorCell
                key={c.id}
                texto={fmtNum(calcDe(c)?.lotacaoMediaCabHa ?? 0)}
                unidade="cab/ha"
              />
            ))}
          </DataRow>
          <DataRow label="Lotação média (U.A./ha)">
            {cenarios.map((c) => (
              <ValorCell
                key={c.id}
                texto={fmtNum(calcDe(c)?.lotacaoMedia ?? 0)}
                unidade="U.A./ha"
              />
            ))}
          </DataRow>
        </>
      )}
      <DataRow label="Consumo do suplemento">
        {cenarios.map((c) => (
          <ValorCell
            key={c.id}
            texto={fmtPct(calcDe(c)?.consumoSuplementoPctPV ?? 0)}
            unidade="do P.V."
          />
        ))}
      </DataRow>
      <DataRow label="Suplemento consumido">
        {cenarios.map((c) => (
          <ValorCell
            key={c.id}
            texto={fmtInt(calcDe(c)?.consumoTotalKg ?? 0)}
            unidade="kg"
          />
        ))}
      </DataRow>
      <DataRow label="Preço do suplemento (R$/kg)">
        {cenarios.map((c) => (
          <ValorCell
            key={c.id}
            texto={fmtBRL(calcDe(c)?.precoSuplementoKg ?? 0)}
          />
        ))}
      </DataRow>
      <DataRow label="Custo do suplemento">
        {cenarios.map((c) => (
          <ValorCell
            key={c.id}
            texto={fmtBRL(calcDe(c)?.custoSuplemento ?? 0)}
          />
        ))}
      </DataRow>
    </>
  );
}
