"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
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
const NEUTRAL_300 = "#d4d4d4";
const NEUTRAL_200 = "#e5e5e5";
const NEUTRAL_100 = "#f5f5f5";
const NEUTRAL_50 = "#fafafa";
const EMERALD_700 = "#047857";
const RED_700 = "#b91c1c";

const NUM3 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });
const fmtGmd = (v: number) => (isFinite(v) ? NUM3.format(v) : "—");

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 44,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: NEUTRAL_900,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: NEUTRAL_200,
    marginBottom: 12,
  },
  brand: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: BRAND_900,
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 7,
    color: NEUTRAL_500,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  dataGeracao: {
    fontSize: 7,
    color: NEUTRAL_500,
    textAlign: "right",
  },
  simName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: BRAND_900,
    marginTop: 6,
    marginBottom: 2,
  },
  meta: {
    fontSize: 9,
    color: NEUTRAL_700,
    marginBottom: 14,
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
  graficoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  graficoLabel: {
    width: 70,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: BRAND_900,
  },
  graficoBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: NEUTRAL_100,
    borderRadius: 2,
    marginHorizontal: 8,
  },
  graficoBar: {
    height: 10,
    borderRadius: 2,
  },
  graficoValor: {
    width: 90,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
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
    borderBottomWidth: 1,
    borderBottomColor: NEUTRAL_200,
  },
  thIndicador: {
    flex: 2.4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: NEUTRAL_500,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  thCenario: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: NEUTRAL_500,
    textTransform: "uppercase",
    letterSpacing: 0.4,
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
  cta: {
    marginTop: 8,
    padding: 10,
    backgroundColor: BRAND_50,
    borderRadius: 3,
    borderLeftWidth: 3,
    borderLeftColor: BRAND_800,
  },
  ctaTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BRAND_900,
    marginBottom: 2,
  },
  ctaText: {
    fontSize: 8.5,
    color: NEUTRAL_700,
    lineHeight: 1.4,
  },
  ctaWhats: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: BRAND_800,
    marginTop: 4,
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
  const lucros = cenarios.map((c) => c.out.lucro);
  const maxAbsLucro = Math.max(...lucros.map(Math.abs), 1);
  const temExtras = (inputs.custosExtras ?? []).length > 0;
  const temPasto = out0.areaMaxima > 0;

  return (
    <Document
      title={`Relatorio - ${simNome}`}
      author="O Pecuário"
      subject="Simulação de recria/engorda"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header dataGeracao={dataGeracao} fixed />

        <Text style={styles.simName}>{simNome}</Text>
        <Text style={styles.meta}>
          {inputs.qtdCabecas || 0} cabeças · {out0.areaMaxima || 0} ha ·{" "}
          {out0.diasTotal || 0} dias
        </Text>

        <Text style={styles.sectionTitle}>Comparativo de lucro total</Text>
        <View style={{ marginBottom: 12 }}>
          {cenarios.map((c) => {
            const lucro = c.out.lucro;
            const pct = (Math.abs(lucro) / maxAbsLucro) * 100;
            const positivo = lucro >= 0;
            return (
              <View key={c.id} style={styles.graficoRow}>
                <Text style={styles.graficoLabel}>{c.label}</Text>
                <View style={styles.graficoBarBg}>
                  <View
                    style={[
                      styles.graficoBar,
                      {
                        width: `${pct}%`,
                        backgroundColor: positivo ? c.corHex : RED_700,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.graficoValor,
                    { color: positivo ? EMERALD_700 : RED_700 },
                  ]}
                >
                  {fmtBRL(lucro)}
                </Text>
              </View>
            );
          })}
        </View>

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
              <ValorCell
                key={c.id}
                texto={fmtInt(inputs.qtdCabecas)}
                unidade="cab"
              />
            ))}
          </DataRow>
          <DataRow label="Cabeças vendidas">
            {cenarios.map((c) => (
              <ValorCell
                key={c.id}
                texto={fmtInt(c.out.cabFinal)}
                unidade="cab"
              />
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
              <ValorCell
                key={c.id}
                texto={fmtInt(inputs.pesoCompraKg)}
                unidade="kg"
              />
            ))}
          </DataRow>
          <DataRow label="Peso de saída">
            {cenarios.map((c) => (
              <ValorCell
                key={c.id}
                texto={fmtInt(c.out.pesoSaidaKg)}
                unidade="kg"
              />
            ))}
          </DataRow>
          <DataRow label="Peso de saída (carcaça)">
            {cenarios.map((c) => (
              <ValorCell
                key={c.id}
                texto={fmtNum(c.out.pesoSaidaArroba)}
                unidade="@"
              />
            ))}
          </DataRow>
          <DataRow label="Arrobas compradas">
            {cenarios.map((c) => (
              <ValorCell
                key={c.id}
                texto={fmtNum(
                  (inputs.qtdCabecas * inputs.pesoCompraKg) / 30
                )}
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
              <ValorCell
                key={c.id}
                texto={fmtInt(c.out.diasTotal)}
                unidade="dias"
              />
            ))}
          </DataRow>
          {temPasto && (
            <>
              <DataRow label="Área total (pasto)">
                {cenarios.map((c) => (
                  <ValorCell
                    key={c.id}
                    texto={fmtNum(c.out.areaMaxima)}
                    unidade="ha"
                  />
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
              <ValorCell
                key={c.id}
                texto={fmtBRL(c.out.custoSuplementoTotal)}
              />
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
                  <ValorCell
                    key={c.id}
                    texto={fmtBRL(c.out.custosExtrasTotal)}
                  />
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
                      texto={fmtBRL(
                        cc.out.custosExtrasDetalhado[i]?.valor ?? 0
                      )}
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
              <ValorCell
                key={c.id}
                texto={fmtPct(c.out.rentabilidadeOperacao)}
              />
            ))}
          </DataRow>
          <DataRow label="Rentabilidade anual">
            {cenarios.map((c) => (
              <ValorCell
                key={c.id}
                texto={fmtPct(c.out.rentabilidadeAno)}
              />
            ))}
          </DataRow>
          <DataRow label="Custo da @ produzida">
            {cenarios.map((c) => (
              <ValorCell
                key={c.id}
                texto={fmtBRL(c.out.custoArrobaProduzida)}
              />
            ))}
          </DataRow>
        </View>

        <View style={styles.cta} wrap={false}>
          <Text style={styles.ctaTitle}>
            Quer melhorar os resultados desta operação?
          </Text>
          <Text style={styles.ctaText}>
            Nossa consultoria ajuda você a transformar esses cenários em decisões
            concretas de manejo, nutrição e compra/venda para elevar o retorno.
          </Text>
          <Text style={styles.ctaWhats}>
            WhatsApp: (66) 9985-2419
          </Text>
        </View>

        <Footer fixed />
      </Page>
    </Document>
  );
}

function Header({
  dataGeracao,
  fixed,
}: {
  dataGeracao: Date;
  fixed?: boolean;
}) {
  return (
    <View style={styles.header} fixed={fixed}>
      <View>
        <Text style={styles.brand}>O PECUÁRIO</Text>
        <Text style={styles.brandSub}>SIMULADOR DE RECRIA E ENGORDA</Text>
      </View>
      <Text style={styles.dataGeracao}>
        Gerado em {dataGeracao.toLocaleDateString("pt-BR")}
      </Text>
    </View>
  );
}

function Footer({ fixed }: { fixed?: boolean }) {
  return (
    <View style={styles.footer} fixed={fixed}>
      <Text>opecuario.com.br</Text>
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
        <Text key={c.id} style={styles.thCenario}>
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
